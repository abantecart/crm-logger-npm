import { BinaryReader, BinaryWriter } from "@bufbuild/protobuf/wire";
import { type CallOptions, type ChannelCredentials, Client, type ClientOptions, type ClientUnaryCall, type handleUnaryCall, type Metadata, type ServiceError, type UntypedServiceImplementation } from "@grpc/grpc-js";
export declare const protobufPackage = "audit.v1";
export interface AuditContext {
    actorId: string;
    actorType: string;
    tenantId: string;
    requestId: string;
    ip: string;
    userAgent: string;
    sessionId: string;
    source: string;
}
export interface AccessLogInput {
    eventType: string;
    route: string;
    statusCode: number;
    durationMs: number;
    authMethod: string;
    outcome: string;
    meta: {
        [key: string]: any;
    } | undefined;
    geo: Geo | undefined;
}
export interface Geo {
    country: string;
    region: string;
}
export interface ChangeLogInput {
    changeType: string;
    entityType: string;
    entityId: string;
    operation: string;
    before: {
        [key: string]: any;
    } | undefined;
    after: {
        [key: string]: any;
    } | undefined;
    description: string;
    systemReason: string;
    parentId: string;
    meta: {
        [key: string]: any;
    } | undefined;
}
export interface ActivityLogInput {
    entityType: string;
    entityId: string;
    operation: string;
    activity: string;
    category: string;
    meta: {
        [key: string]: any;
    } | undefined;
}
export interface LogAccessRequest {
    context: AuditContext | undefined;
    input: AccessLogInput | undefined;
}
export interface LogChangeRequest {
    context: AuditContext | undefined;
    input: ChangeLogInput | undefined;
}
export interface LogActivityRequest {
    context: AuditContext | undefined;
    input: ActivityLogInput | undefined;
}
export interface GetAuditHealthRequest {
}
export interface AuditWriteResponse {
    ok: boolean;
    message: string;
}
export interface DriverHealth {
    name: string;
    lastSuccessAt: string;
    lastFailureAt: string;
}
export interface GetAuditHealthResponse {
    lastSuccessAt: string;
    failuresTotal: string;
    driver: DriverHealth | undefined;
}
export declare const AuditContext: MessageFns<AuditContext>;
export declare const AccessLogInput: MessageFns<AccessLogInput>;
export declare const Geo: MessageFns<Geo>;
export declare const ChangeLogInput: MessageFns<ChangeLogInput>;
export declare const ActivityLogInput: MessageFns<ActivityLogInput>;
export declare const LogAccessRequest: MessageFns<LogAccessRequest>;
export declare const LogChangeRequest: MessageFns<LogChangeRequest>;
export declare const LogActivityRequest: MessageFns<LogActivityRequest>;
export declare const GetAuditHealthRequest: MessageFns<GetAuditHealthRequest>;
export declare const AuditWriteResponse: MessageFns<AuditWriteResponse>;
export declare const DriverHealth: MessageFns<DriverHealth>;
export declare const GetAuditHealthResponse: MessageFns<GetAuditHealthResponse>;
export type AuditServiceService = typeof AuditServiceService;
export declare const AuditServiceService: {
    readonly logAccess: {
        readonly path: "/audit.v1.AuditService/LogAccess";
        readonly requestStream: false;
        readonly responseStream: false;
        readonly requestSerialize: (value: LogAccessRequest) => Buffer;
        readonly requestDeserialize: (value: Buffer) => LogAccessRequest;
        readonly responseSerialize: (value: AuditWriteResponse) => Buffer;
        readonly responseDeserialize: (value: Buffer) => AuditWriteResponse;
    };
    readonly logChange: {
        readonly path: "/audit.v1.AuditService/LogChange";
        readonly requestStream: false;
        readonly responseStream: false;
        readonly requestSerialize: (value: LogChangeRequest) => Buffer;
        readonly requestDeserialize: (value: Buffer) => LogChangeRequest;
        readonly responseSerialize: (value: AuditWriteResponse) => Buffer;
        readonly responseDeserialize: (value: Buffer) => AuditWriteResponse;
    };
    readonly logActivity: {
        readonly path: "/audit.v1.AuditService/LogActivity";
        readonly requestStream: false;
        readonly responseStream: false;
        readonly requestSerialize: (value: LogActivityRequest) => Buffer;
        readonly requestDeserialize: (value: Buffer) => LogActivityRequest;
        readonly responseSerialize: (value: AuditWriteResponse) => Buffer;
        readonly responseDeserialize: (value: Buffer) => AuditWriteResponse;
    };
    readonly getAuditHealth: {
        readonly path: "/audit.v1.AuditService/GetAuditHealth";
        readonly requestStream: false;
        readonly responseStream: false;
        readonly requestSerialize: (value: GetAuditHealthRequest) => Buffer;
        readonly requestDeserialize: (value: Buffer) => GetAuditHealthRequest;
        readonly responseSerialize: (value: GetAuditHealthResponse) => Buffer;
        readonly responseDeserialize: (value: Buffer) => GetAuditHealthResponse;
    };
};
export interface AuditServiceServer extends UntypedServiceImplementation {
    logAccess: handleUnaryCall<LogAccessRequest, AuditWriteResponse>;
    logChange: handleUnaryCall<LogChangeRequest, AuditWriteResponse>;
    logActivity: handleUnaryCall<LogActivityRequest, AuditWriteResponse>;
    getAuditHealth: handleUnaryCall<GetAuditHealthRequest, GetAuditHealthResponse>;
}
export interface AuditServiceClient extends Client {
    logAccess(request: LogAccessRequest, callback: (error: ServiceError | null, response: AuditWriteResponse) => void): ClientUnaryCall;
    logAccess(request: LogAccessRequest, metadata: Metadata, callback: (error: ServiceError | null, response: AuditWriteResponse) => void): ClientUnaryCall;
    logAccess(request: LogAccessRequest, metadata: Metadata, options: Partial<CallOptions>, callback: (error: ServiceError | null, response: AuditWriteResponse) => void): ClientUnaryCall;
    logChange(request: LogChangeRequest, callback: (error: ServiceError | null, response: AuditWriteResponse) => void): ClientUnaryCall;
    logChange(request: LogChangeRequest, metadata: Metadata, callback: (error: ServiceError | null, response: AuditWriteResponse) => void): ClientUnaryCall;
    logChange(request: LogChangeRequest, metadata: Metadata, options: Partial<CallOptions>, callback: (error: ServiceError | null, response: AuditWriteResponse) => void): ClientUnaryCall;
    logActivity(request: LogActivityRequest, callback: (error: ServiceError | null, response: AuditWriteResponse) => void): ClientUnaryCall;
    logActivity(request: LogActivityRequest, metadata: Metadata, callback: (error: ServiceError | null, response: AuditWriteResponse) => void): ClientUnaryCall;
    logActivity(request: LogActivityRequest, metadata: Metadata, options: Partial<CallOptions>, callback: (error: ServiceError | null, response: AuditWriteResponse) => void): ClientUnaryCall;
    getAuditHealth(request: GetAuditHealthRequest, callback: (error: ServiceError | null, response: GetAuditHealthResponse) => void): ClientUnaryCall;
    getAuditHealth(request: GetAuditHealthRequest, metadata: Metadata, callback: (error: ServiceError | null, response: GetAuditHealthResponse) => void): ClientUnaryCall;
    getAuditHealth(request: GetAuditHealthRequest, metadata: Metadata, options: Partial<CallOptions>, callback: (error: ServiceError | null, response: GetAuditHealthResponse) => void): ClientUnaryCall;
}
export declare const AuditServiceClient: {
    new (address: string, credentials: ChannelCredentials, options?: Partial<ClientOptions>): AuditServiceClient;
    service: typeof AuditServiceService;
    serviceName: string;
};
type Builtin = Date | Function | Uint8Array | string | number | boolean | undefined;
export type DeepPartial<T> = T extends Builtin ? T : T extends globalThis.Array<infer U> ? globalThis.Array<DeepPartial<U>> : T extends ReadonlyArray<infer U> ? ReadonlyArray<DeepPartial<U>> : T extends {} ? {
    [K in keyof T]?: DeepPartial<T[K]>;
} : Partial<T>;
type KeysOfUnion<T> = T extends T ? keyof T : never;
export type Exact<P, I extends P> = P extends Builtin ? P : P & {
    [K in keyof P]: Exact<P[K], I[K]>;
} & {
    [K in Exclude<keyof I, KeysOfUnion<P>>]: never;
};
export interface MessageFns<T> {
    encode(message: T, writer?: BinaryWriter): BinaryWriter;
    decode(input: BinaryReader | Uint8Array, length?: number): T;
    fromJSON(object: any): T;
    toJSON(message: T): unknown;
    create<I extends Exact<DeepPartial<T>, I>>(base?: I): T;
    fromPartial<I extends Exact<DeepPartial<T>, I>>(object: I): T;
}
export {};
