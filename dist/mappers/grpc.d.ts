import type { AccessLogInput, ActivityLogInput, AuditContext, ChangeLogInput } from "../contracts/types";
import type { AccessLogInput as GrpcAccessLogInput, ActivityLogInput as GrpcActivityLogInput, AuditContext as GrpcAuditContext, ChangeLogInput as GrpcChangeLogInput, DriverHealth as GrpcDriverHealth, GetAuditHealthResponse as GrpcGetAuditHealthResponse, LogAccessRequest as GrpcLogAccessRequest, LogActivityRequest as GrpcLogActivityRequest, LogChangeRequest as GrpcLogChangeRequest } from "../generated/proto/audit/v1/audit";
export declare function toGrpcAuditContext(ctx: AuditContext): GrpcAuditContext;
export declare function toGrpcAccessInput(input: AccessLogInput): GrpcAccessLogInput;
export declare function toGrpcChangeInput(input: ChangeLogInput): GrpcChangeLogInput;
export declare function toGrpcActivityInput(input: ActivityLogInput): GrpcActivityLogInput;
export declare function toGrpcLogAccessRequest(ctx: AuditContext, input: AccessLogInput): GrpcLogAccessRequest;
export declare function toGrpcLogChangeRequest(ctx: AuditContext, input: ChangeLogInput): GrpcLogChangeRequest;
export declare function toGrpcLogActivityRequest(ctx: AuditContext, input: ActivityLogInput): GrpcLogActivityRequest;
export declare function fromGrpcLogAccessRequest(request: GrpcLogAccessRequest): {
    context: AuditContext;
    input: AccessLogInput;
};
export declare function fromGrpcLogChangeRequest(request: GrpcLogChangeRequest): {
    context: AuditContext;
    input: ChangeLogInput;
};
export declare function fromGrpcLogActivityRequest(request: GrpcLogActivityRequest): {
    context: AuditContext;
    input: ActivityLogInput;
};
export declare function fromGrpcDriverHealth(input: GrpcDriverHealth | undefined): {
    name: string;
    lastSuccessAt: number | null;
    lastFailureAt: number | null;
} | null;
export declare function fromGrpcHealthResponse(response: GrpcGetAuditHealthResponse | null | undefined): {
    lastSuccessAt: number | null;
    failuresTotal: number;
    driver: {
        name: string;
        lastSuccessAt: number | null;
        lastFailureAt: number | null;
    } | null;
};
