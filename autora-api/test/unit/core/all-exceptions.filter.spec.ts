import { BadRequestException, type ArgumentsHost } from "@nestjs/common";
import { describe, expect, it, vi } from "vitest";
import { AllExceptionsFilter } from "@core/exceptions/all-exceptions.filter";
import { EntityNotFoundException } from "@core/exceptions/domain.exception";

function createMockHost(url = "/api/v1/services/not-found") {
  const send = vi.fn();
  const header = vi.fn().mockReturnThis();
  const status = vi.fn().mockReturnValue({ header, send });

  const reply = { status, header, send };
  const request = {
    url,
    method: "GET",
    headers: { "x-request-id": "req-123" },
  };

  const host = {
    switchToHttp: () => ({
      getRequest: () => request,
      getResponse: () => reply,
    }),
  } as unknown as ArgumentsHost;

  return { host, status, header, send };
}

describe("AllExceptionsFilter (RFC 7807)", () => {
  it("maps DomainException to application/problem+json", () => {
    const filter = new AllExceptionsFilter();
    const { host, status, header, send } = createMockHost();

    filter.catch(new EntityNotFoundException("Gói dịch vụ", "oil-5w30"), host);

    expect(status).toHaveBeenCalledWith(404);
    expect(header).toHaveBeenCalledWith(
      "content-type",
      "application/problem+json; charset=utf-8"
    );
    expect(send).toHaveBeenCalledWith(
      expect.objectContaining({
        status: 404,
        title: "Not Found",
        errorCode: "RESOURCE_NOT_FOUND",
        requestId: "req-123",
        instance: "/api/v1/services/not-found",
      })
    );
  });

  it("extracts validation error list from BadRequestException", () => {
    const filter = new AllExceptionsFilter();
    const { host, status, send } = createMockHost("/api/v1/auth/register");

    filter.catch(
      new BadRequestException(["Email không đúng định dạng."]),
      host
    );

    expect(status).toHaveBeenCalledWith(400);
    expect(send).toHaveBeenCalledWith(
      expect.objectContaining({
        status: 400,
        title: "Bad Request",
        errors: ["Email không đúng định dạng."],
      })
    );
  });

  it("hides internal details for unexpected errors", () => {
    const filter = new AllExceptionsFilter();
    const { host, status, send } = createMockHost();

    filter.catch(new Error("Database credentials leaked"), host);

    expect(status).toHaveBeenCalledWith(500);
    expect(send).toHaveBeenCalledWith(
      expect.objectContaining({
        status: 500,
        title: "Internal Server Error",
        detail: "Đã xảy ra lỗi hệ thống. Vui lòng thử lại sau.",
      })
    );
  });
});
