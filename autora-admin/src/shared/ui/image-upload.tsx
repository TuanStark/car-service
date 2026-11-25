"use client";

import React, { useRef, useState } from "react";
import { ImagePlus, Loader2, Plus, Trash2, Upload } from "lucide-react";
import { ApiError } from "@/infrastructure/api/api-client";
import { uploadAdminImage, type UploadFolder } from "@/infrastructure/api/media";
import { Button } from "./button";
import { Input } from "./input";
import { useToast } from "./toast-provider";

export interface ImagePreset {
  readonly label: string;
  readonly url: string;
}

export const SERVICE_IMAGE_PRESETS: readonly ImagePreset[] = [
  { label: "Bảo dưỡng", url: "/images/service-maintenance.jpg" },
  { label: "Sửa chữa", url: "/images/service-repair.jpg" },
  { label: "Detailing", url: "/images/service-detailing.jpg" },
  { label: "Lốp & Cân chỉnh", url: "/images/service-tires.jpg" },
];

export const GARAGE_IMAGE_PRESETS: readonly ImagePreset[] = [
  { label: "Xưởng tiêu chuẩn", url: "/images/featured-garage.jpg" },
  { label: "Xưởng hiện đại", url: "/images/garage-card-alt.jpg" },
  { label: "Khu tiếp nhận", url: "/images/hero-workshop.jpg" },
];

export function ImageUploadField({
  label,
  value,
  onChange,
  folder = "services",
  presets = SERVICE_IMAGE_PRESETS,
  hint = "Upload trực tiếp lên Cloudinary qua Presigned URL (JPG, PNG, WebP ≤ 5MB) hoặc chọn ảnh mẫu.",
}: {
  readonly label: string;
  readonly value: string;
  readonly onChange: (nextUrl: string) => void;
  readonly folder?: UploadFolder;
  readonly presets?: readonly ImagePreset[];
  readonly hint?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const { notifySuccess, notifyError } = useToast();
  const [isUploading, setIsUploading] = useState(false);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    setIsUploading(true);
    try {
      const res = await uploadAdminImage(file, folder);
      onChange(res.url);
      notifySuccess("Đã tải ảnh trực tiếp lên Cloudinary thành công.");
    } catch (err) {
      notifyError(
        err instanceof ApiError
          ? err.message
          : "Không thể tải ảnh lên. Vui lòng thử lại."
      );
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="space-y-2.5">
      <div className="flex items-center justify-between gap-2">
        <label className="block text-xs font-semibold text-ink">{label}</label>
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="hidden"
          onChange={(e) => void handleFileChange(e)}
        />
        <Button
          type="button"
          variant="secondary"
          size="sm"
          disabled={isUploading}
          onClick={() => inputRef.current?.click()}
        >
          {isUploading ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <Upload className="h-3.5 w-3.5" />
          )}
          {isUploading ? "Đang tải..." : "Tải ảnh từ máy"}
        </Button>
      </div>

      <div className="flex flex-col gap-3 rounded-xl border border-line bg-surface-subtle/60 p-3 sm:flex-row sm:items-center">
        <div className="relative h-24 w-36 shrink-0 overflow-hidden rounded-lg border border-line bg-surface">
          {value ? (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img
              src={value}
              alt={label}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full w-full flex-col items-center justify-center text-ink-muted">
              <ImagePlus className="h-5 w-5" />
              <span className="mt-1 text-[10px]">Chưa có ảnh</span>
            </div>
          )}
        </div>

        <div className="min-w-0 flex-1 space-y-2">
          <Input
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder="/images/service-maintenance.jpg hoặc URL ảnh"
          />
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-[11px] font-medium text-ink-muted">
              Ảnh mẫu:
            </span>
            {presets.map((preset) => (
              <button
                key={preset.url}
                type="button"
                onClick={() => onChange(preset.url)}
                className={`rounded-md border px-2 py-0.5 text-[11px] font-medium transition-colors cursor-pointer ${
                  value === preset.url
                    ? "border-brand bg-brand-soft text-brand"
                    : "border-line bg-surface text-ink-secondary hover:border-line-strong hover:text-ink"
                }`}
              >
                {preset.label}
              </button>
            ))}
          </div>
          <p className="text-[11px] text-ink-muted">{hint}</p>
        </div>
      </div>
    </div>
  );
}

export function GalleryUploadField({
  urls,
  onChange,
  folder = "services",
}: {
  readonly urls: readonly string[];
  readonly onChange: (nextUrls: string[]) => void;
  readonly folder?: UploadFolder;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const { notifySuccess, notifyError } = useToast();
  const [isUploading, setIsUploading] = useState(false);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    setIsUploading(true);
    try {
      const res = await uploadAdminImage(file, folder);
      onChange([...urls, res.url]);
      notifySuccess("Đã thêm ảnh vào thư viện.");
    } catch (err) {
      notifyError(
        err instanceof ApiError ? err.message : "Không thể tải ảnh lên."
      );
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="space-y-2.5">
      <div className="flex items-center justify-between gap-2">
        <label className="block text-xs font-semibold text-ink">
          Thư viện ảnh chi tiết ({urls.length} ảnh)
        </label>
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="hidden"
          onChange={(e) => void handleFileChange(e)}
        />
        <Button
          type="button"
          variant="secondary"
          size="sm"
          disabled={isUploading}
          onClick={() => inputRef.current?.click()}
        >
          {isUploading ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <Plus className="h-3.5 w-3.5" />
          )}
          {isUploading ? "Đang tải..." : "Thêm ảnh thư viện"}
        </Button>
      </div>

      {urls.length === 0 ? (
        <p className="rounded-lg border border-dashed border-line-strong px-4 py-3 text-xs text-ink-muted">
          Chưa có ảnh thư viện bổ sung. Hệ thống sẽ dùng ảnh đại diện làm mặc định.
        </p>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {urls.map((url, idx) => (
            <div
              key={`${url}-${idx}`}
              className="group relative aspect-[4/3] overflow-hidden rounded-lg border border-line bg-surface-subtle"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={url}
                alt={`Ảnh thư viện ${idx + 1}`}
                className="h-full w-full object-cover"
              />
              <button
                type="button"
                aria-label="Xóa ảnh"
                onClick={() =>
                  onChange(urls.filter((_, i) => i !== idx))
                }
                className="absolute right-1.5 top-1.5 inline-flex h-6 w-6 items-center justify-center rounded-md bg-slate-900/75 text-white opacity-90 hover:bg-rose-600 cursor-pointer"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

