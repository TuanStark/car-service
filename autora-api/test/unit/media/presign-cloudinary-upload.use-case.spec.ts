import { createHash } from "node:crypto";
import { describe, expect, it, vi } from "vitest";
import {
  BusinessRuleViolationException,
  ForbiddenDomainException,
} from "@core/exceptions/domain.exception";
import { PresignCloudinaryUploadUseCase } from "../../../src/modules/media/application/use-cases/presign-cloudinary-upload.use-case";

describe("PresignCloudinaryUploadUseCase", () => {
  const adminActor = {
    id: "admin-1",
    email: "admin@autora.vn",
    fullName: "Admin",
    roles: ["admin"],
    permissions: ["manage:all"],
    jti: "jti-1",
    exp: Math.floor(Date.now() / 1000) + 900,
  };

  it("issues valid Cloudinary SHA-1 signature and uploadUrl when configured", async () => {
    const configService = {
      get: vi.fn((key: string) => {
        const map: Record<string, string> = {
          "cloudinary.cloudName": "demo-cloud",
          "cloudinary.apiKey": "123456",
          "cloudinary.apiSecret": "super_secret",
          "cloudinary.uploadFolder": "autora",
        };
        return map[key];
      }),
    };
    const auditWriter = { record: vi.fn().mockResolvedValue(undefined) };

    const useCase = new PresignCloudinaryUploadUseCase(
      configService as never,
      auditWriter as never
    );

    const res = await useCase.execute(
      { folder: "services", mimeType: "image/jpeg", sizeBytes: 102400 },
      adminActor
    );

    expect(res.uploadUrl).toBe(
      "https://api.cloudinary.com/v1_1/demo-cloud/image/upload"
    );
    expect(res.folder).toBe("autora/services");
    expect(res.apiKey).toBe("123456");

    const expectedSig = createHash("sha1")
      .update(
        `allowed_formats=${res.allowedFormats}&folder=${res.folder}&public_id=${res.publicId}&timestamp=${res.timestamp}super_secret`
      )
      .digest("hex");
    expect(res.signature).toBe(expectedSig);
    expect(auditWriter.record).toHaveBeenCalledTimes(1);
  });

  it("throws CLOUDINARY_NOT_CONFIGURED when env credentials are missing", async () => {
    const configService = { get: vi.fn().mockReturnValue("") };
    const auditWriter = { record: vi.fn() };
    const useCase = new PresignCloudinaryUploadUseCase(
      configService as never,
      auditWriter as never
    );

    await expect(
      useCase.execute(
        { folder: "garages", mimeType: "image/png", sizeBytes: 50000 },
        adminActor
      )
    ).rejects.toThrow(BusinessRuleViolationException);
  });

  it("blocks non-admin actors", async () => {
    const configService = { get: vi.fn() };
    const auditWriter = { record: vi.fn() };
    const useCase = new PresignCloudinaryUploadUseCase(
      configService as never,
      auditWriter as never
    );

    await expect(
      useCase.execute(
        { folder: "services", mimeType: "image/webp", sizeBytes: 1000 },
        { ...adminActor, roles: ["customer"] }
      )
    ).rejects.toThrow(ForbiddenDomainException);
  });
});
