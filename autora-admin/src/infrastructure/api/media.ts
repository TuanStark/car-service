import { apiData, ApiError } from "./api-client";

export type UploadFolder = "services" | "garages" | "general";

export interface CloudinaryPresignResponse {
  readonly uploadUrl: string;
  readonly cloudName: string;
  readonly apiKey: string;
  readonly timestamp: number;
  readonly signature: string;
  readonly folder: string;
  readonly publicId: string;
  readonly allowedFormats: string;
}

export interface UploadedMediaResult {
  readonly url: string;
  readonly publicId: string;
  readonly sizeBytes: number;
}

const ALLOWED_MIME_TYPES = new Set([
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
]);
const MAX_UPLOAD_BYTES = 5 * 1024 * 1024;

/**
 * Direct-to-Cloudinary upload using backend-signed presign parameters:
 * 1. Request short-lived signature from autora-api (/admin/media/presign)
 * 2. POST file directly from browser to Cloudinary uploadUrl (zero image bytes hit autora-api)
 */
export async function uploadAdminImage(
  file: File,
  folder: UploadFolder = "general"
): Promise<UploadedMediaResult> {
  if (!ALLOWED_MIME_TYPES.has(file.type)) {
    throw new ApiError({
      message: "Chỉ hỗ trợ định dạng ảnh JPG, PNG hoặc WebP.",
      status: 422,
    });
  }
  if (file.size === 0 || file.size > MAX_UPLOAD_BYTES) {
    throw new ApiError({
      message: "Kích thước ảnh phải lớn hơn 0 và tối đa 5MB.",
      status: 422,
    });
  }

  const presign = await apiData<CloudinaryPresignResponse>(
    "/admin/media/presign",
    {
      method: "POST",
      body: {
        folder,
        mimeType: file.type,
        sizeBytes: file.size,
      },
    }
  );

  const formData = new FormData();
  formData.append("file", file);
  formData.append("api_key", presign.apiKey);
  formData.append("timestamp", String(presign.timestamp));
  formData.append("signature", presign.signature);
  formData.append("folder", presign.folder);
  formData.append("public_id", presign.publicId);
  formData.append("allowed_formats", presign.allowedFormats);

  const cloudRes = await fetch(presign.uploadUrl, {
    method: "POST",
    body: formData,
  });

  if (!cloudRes.ok) {
    let errDetail = "Tải ảnh lên Cloudinary thất bại.";
    try {
      const parsed = (await cloudRes.json()) as {
        error?: { message?: string };
      };
      if (parsed.error?.message) errDetail = parsed.error.message;
    } catch {
      // ignore non-json cloudinary error
    }
    throw new ApiError({
      message: errDetail,
      status: cloudRes.status,
    });
  }

  const cloudBody = (await cloudRes.json()) as {
    secure_url: string;
    public_id: string;
    bytes: number;
  };

  return {
    url: cloudBody.secure_url,
    publicId: cloudBody.public_id,
    sizeBytes: cloudBody.bytes,
  };
}
