import { createHash } from "node:crypto";
import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { Type } from "class-transformer";
import { IsIn, IsInt, IsOptional, Max, Min } from "class-validator";
import type { AuthenticatedUser } from "@core/decorators/current-user.decorator";
import {
  BusinessRuleViolationException,
  ForbiddenDomainException,
} from "@core/exceptions/domain.exception";
import { generateUuidV7 } from "@core/utils/uuid.util";
import { AdminAuditWriterService } from "@modules/audit/application/services/admin-audit-writer.service";

const ALLOWED_IMAGE_MIME_TYPES = [
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
] as const;

const ALLOWED_UPLOAD_FOLDERS = ["services", "garages", "general"] as const;
const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
const ALLOWED_FORMATS = "jpg,jpeg,png,webp";

export type AllowedUploadFolder = (typeof ALLOWED_UPLOAD_FOLDERS)[number];

export class PresignUploadDto {
  @ApiPropertyOptional({ enum: ALLOWED_UPLOAD_FOLDERS, default: "general" })
  @IsOptional()
  @IsIn(ALLOWED_UPLOAD_FOLDERS)
  folder?: AllowedUploadFolder;

  @ApiProperty({ enum: ALLOWED_IMAGE_MIME_TYPES, example: "image/jpeg" })
  @IsIn(ALLOWED_IMAGE_MIME_TYPES, {
    message: "Chỉ hỗ trợ định dạng ảnh JPG, PNG hoặc WebP.",
  })
  mimeType!: (typeof ALLOWED_IMAGE_MIME_TYPES)[number];

  @ApiProperty({ example: 512000 })
  @Type(() => Number)
  @IsInt()
  @Min(1, { message: "Tệp hình ảnh rỗng." })
  @Max(MAX_IMAGE_BYTES, { message: "Kích thước ảnh tối đa là 5MB." })
  sizeBytes!: number;
}

export interface CloudinaryPresignResponseDto {
  readonly uploadUrl: string;
  readonly cloudName: string;
  readonly apiKey: string;
  readonly timestamp: number;
  readonly signature: string;
  readonly folder: string;
  readonly publicId: string;
  readonly allowedFormats: string;
}

/**
 * Issues a short-lived Cloudinary signed upload payload so the browser
 * uploads image binaries directly to Cloudinary without routing bytes through the API server.
 */
@Injectable()
export class PresignCloudinaryUploadUseCase {
  constructor(
    private readonly configService: ConfigService,
    private readonly auditWriter: AdminAuditWriterService
  ) {}

  async execute(
    dto: PresignUploadDto,
    actor: AuthenticatedUser
  ): Promise<CloudinaryPresignResponseDto> {
    if (!actor.roles.includes("admin")) {
      throw new ForbiddenDomainException(
        "Chỉ quản trị viên mới được phép cấp chữ ký tải ảnh."
      );
    }

    const cloudName = this.configService.get<string>("cloudinary.cloudName") ?? "";
    const apiKey = this.configService.get<string>("cloudinary.apiKey") ?? "";
    const apiSecret =
      this.configService.get<string>("cloudinary.apiSecret") ?? "";
    const baseFolder =
      this.configService.get<string>("cloudinary.uploadFolder") ?? "autora";

    if (!cloudName || !apiKey || !apiSecret) {
      throw new BusinessRuleViolationException(
        "Chưa cấu hình Cloudinary (CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET) trên máy chủ.",
        "CLOUDINARY_NOT_CONFIGURED"
      );
    }

    const timestamp = Math.floor(Date.now() / 1000);
    const subFolder = dto.folder ?? "general";
    const folder = `${baseFolder.replace(/\/+$/, "")}/${subFolder}`;
    const publicId = generateUuidV7();

    const paramsToSign: Record<string, string | number> = {
      allowed_formats: ALLOWED_FORMATS,
      folder,
      public_id: publicId,
      timestamp,
    };

    const canonicalQuery = Object.keys(paramsToSign)
      .sort()
      .map((key) => `${key}=${paramsToSign[key]}`)
      .join("&");

    const signature = createHash("sha1")
      .update(`${canonicalQuery}${apiSecret}`)
      .digest("hex");

    await this.auditWriter.record({
      actorUserId: actor.id,
      actorEmail: actor.email,
      eventName: "admin.media.presigned",
      resourceType: "Media",
      resourceId: publicId,
      payload: { folder, mimeType: dto.mimeType, sizeBytes: dto.sizeBytes },
    });

    return {
      uploadUrl: `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
      cloudName,
      apiKey,
      timestamp,
      signature,
      folder,
      publicId,
      allowedFormats: ALLOWED_FORMATS,
    };
  }
}

