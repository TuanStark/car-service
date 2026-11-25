import { HttpStatus } from "@nestjs/common";

export class DomainException extends Error {
  public readonly statusCode: number;
  public readonly errorCode: string;
  public readonly details?: Record<string, unknown>;

  constructor(params: {
    message: string;
    statusCode: number;
    errorCode: string;
    details?: Record<string, unknown>;
  }) {
    super(params.message);
    this.name = new.target.name;
    this.statusCode = params.statusCode;
    this.errorCode = params.errorCode;
    this.details = params.details;
  }
}

export class EntityNotFoundException extends DomainException {
  constructor(resourceName: string, identifier: string) {
    super({
      message: `${resourceName} (${identifier}) không tồn tại hoặc đã bị xóa.`,
      statusCode: HttpStatus.NOT_FOUND,
      errorCode: "RESOURCE_NOT_FOUND",
      details: { resourceName, identifier },
    });
  }
}

export class EntityConflictException extends DomainException {
  constructor(message: string, details?: Record<string, unknown>) {
    super({
      message,
      statusCode: HttpStatus.CONFLICT,
      errorCode: "RESOURCE_CONFLICT",
      details,
    });
  }
}

export class BusinessRuleViolationException extends DomainException {
  constructor(message: string, errorCode = "BUSINESS_RULE_VIOLATION", details?: Record<string, unknown>) {
    super({
      message,
      statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
      errorCode,
      details,
    });
  }
}

export class UnauthorizedDomainException extends DomainException {
  constructor(message = "Thông tin xác thực không hợp lệ hoặc đã hết hạn.") {
    super({
      message,
      statusCode: HttpStatus.UNAUTHORIZED,
      errorCode: "UNAUTHORIZED",
    });
  }
}

export class ForbiddenDomainException extends DomainException {
  constructor(message = "Bạn không có quyền thực hiện thao tác này.") {
    super({
      message,
      statusCode: HttpStatus.FORBIDDEN,
      errorCode: "FORBIDDEN",
    });
  }
}
