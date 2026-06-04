"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getOutboxMigrationSql = getOutboxMigrationSql;
/**
 * DB-layer change capture for the ENTIRE database via a transactional outbox.
 *
 * A trigger on every table writes a small "note" for any INSERT/UPDATE/DELETE
 * into `audit_outbox` in the same transaction as the original change (fast, no
 * network). The outbox forwarder (`createOutboxForwarder`) picks up those notes
 * and ships them to audit-log -> DynamoDB, keeping slow network calls out of the
 * write transaction without losing any change.
 *
 * The actor ("who made the change") comes from `app.*` session variables, set by
 * the service through SET LOCAL (see `runWithActor`). With no actor (manual SQL,
 * migration, another writer) the forwarder marks the change as change_type=system.
 *
 * WARNING: the trailing EVENT TRIGGER (auto-auditing for future tables) requires
 * SUPERUSER. In the dev Docker setup POSTGRES_USER is a superuser. In production
 * with a restricted role, apply the `CREATE EVENT TRIGGER` block separately as admin.
 */
const OUTBOX_MIGRATION_SQL = `-- 1. "Outbox": the trigger writes changes here, the forwarder reads them.
--    Processed rows are DELETED by the forwarder immediately, so the outbox
--    stays almost empty (long-term storage lives in DynamoDB). That is why
--    there is no processed_at column: this table holds only unprocessed rows.
create table if not exists audit_outbox (
  id           bigserial   primary key,
  entity_type  text        not null,           -- table name
  entity_id    text        not null,           -- primary key value
  operation    text        not null,           -- INSERT | UPDATE | DELETE
  before       jsonb,
  after        jsonb,
  actor_id     text        not null default '',
  actor_type   text        not null default '',
  tenant_id    text        not null default '',
  request_id   text        not null default '',
  trace_id     text,
  txid         bigint      not null default txid_current(),
  created_at   timestamptz not null default now()
);

-- 2. Generic capture function: works for any table. entity_type = table name,
--    entity_id is derived from the primary key DYNAMICALLY (no assumed id column).
create or replace function audit_capture() returns trigger
language plpgsql as $$
declare
  v_before  jsonb;
  v_after   jsonb;
  v_row     jsonb;          -- active row: NEW for ins/upd, OLD for delete
  v_pk_cols text[];
  v_entity_id text;
begin
  if tg_op = 'DELETE' then
    v_before := to_jsonb(old);
    v_after  := null;
    v_row    := to_jsonb(old);
  elsif tg_op = 'UPDATE' then
    v_before := to_jsonb(old);
    v_after  := to_jsonb(new);
    v_row    := to_jsonb(new);
  else -- INSERT
    v_before := null;
    v_after  := to_jsonb(new);
    v_row    := to_jsonb(new);
  end if;

  -- Primary key columns of this specific table (tg_relid = current table).
  select array_agg(a.attname order by array_position(i.indkey, a.attnum))
    into v_pk_cols
  from pg_index i
  join pg_attribute a
    on a.attrelid = i.indrelid and a.attnum = any (i.indkey)
  where i.indrelid = tg_relid and i.indisprimary;

  if v_pk_cols is null then
    -- No primary key: use a hash of the entire row as the identifier.
    v_entity_id := md5(v_row::text);
  else
    -- PK values from the JSONB row; composite keys are joined with ':'.
    select string_agg(v_row ->> col, ':')
      into v_entity_id
    from unnest(v_pk_cols) as col;
  end if;

  insert into audit_outbox (
    entity_type, entity_id, operation, before, after,
    actor_id, actor_type, tenant_id, request_id, trace_id
  ) values (
    tg_table_name, v_entity_id, tg_op, v_before, v_after,
    coalesce(current_setting('app.user_id',    true), ''),
    coalesce(current_setting('app.actor_type', true), ''),
    coalesce(current_setting('app.tenant_id',  true), ''),
    coalesce(current_setting('app.request_id', true), ''),
    nullif(current_setting('app.trace_id', true), '')
  );

  -- Low-latency wake-up for the forwarder (LISTEN audit_outbox); polling is a fallback.
  perform pg_notify('audit_outbox', '');
  return coalesce(new, old);
end;
$$;

-- 3. Attach the generic trigger to a single table (idempotent, with filters).
create or replace function audit_enable_on(p_schema text, p_table text)
returns void
language plpgsql as $$
begin
  -- Do not audit internal service tables (otherwise infinite loops / noise).
  if p_table in ('audit_outbox', 'pgmigrations') then
    return;
  end if;

  -- Only regular ('r') and partitioned ('p') tables, not views or anything else.
  perform 1
  from pg_class c
  join pg_namespace n on n.oid = c.relnamespace
  where n.nspname = p_schema and c.relname = p_table and c.relkind in ('r', 'p');
  if not found then
    return;
  end if;

  execute format('drop trigger if exists trg_audit_capture on %I.%I', p_schema, p_table);
  execute format(
    'create trigger trg_audit_capture
       after insert or update or delete on %I.%I
       for each row execute function audit_capture()',
    p_schema, p_table);
end;
$$;

-- 4. Attach auditing to all existing tables in the public schema.
do $$
declare r record;
begin
  for r in
    select schemaname, tablename
    from pg_tables
    where schemaname = 'public'
  loop
    perform audit_enable_on(r.schemaname, r.tablename);
  end loop;
end $$;

-- 5. Event trigger: any NEW table in public gets auditing automatically.
--    Requires superuser privileges (see file header).
create or replace function audit_on_ddl() returns event_trigger
language plpgsql as $$
declare
  obj record;
  v_table text;
begin
  for obj in select * from pg_event_trigger_ddl_commands()
  loop
    if obj.object_type = 'table' and obj.schema_name = 'public' then
      select relname into v_table from pg_class where oid = obj.objid;
      if v_table is not null then
        perform audit_enable_on(obj.schema_name, v_table);
      end if;
    end if;
  end loop;
end;
$$;

drop event trigger if exists trg_audit_ddl;
create event trigger trg_audit_ddl
  on ddl_command_end
  when tag in ('CREATE TABLE')
  execute function audit_on_ddl();
`;
/**
 * Returns the full SQL that provisions the audit outbox: the `audit_outbox`
 * table, the generic capture trigger, attachment to existing public tables, and
 * an event trigger that auto-audits future tables. Idempotent — safe to re-run.
 */
function getOutboxMigrationSql() {
    return OUTBOX_MIGRATION_SQL;
}
//# sourceMappingURL=outbox-migration.js.map