"use client";

import React, { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { AlertCircle, Pencil, X } from "lucide-react";
import { ApiError } from "@/infrastructure/api/api-client";
import { Button } from "@/shared/ui/button";
import { GARAGE_IMAGE_PRESETS, ImageUploadField } from "@/shared/ui/image-upload";
import { Input, Select, Textarea } from "@/shared/ui/input";
import { useToast } from "@/shared/ui/toast-provider";
import { toSlug } from "@/shared/utils/slug";
import { createAdminGarage, type GarageCityCode } from "../api";

const CITY_LABELS: Record<GarageCityCode, string> = {
  HCM: "TP. Hồ Chí Minh",
  HN: "Hà Nội",
  DN: "Đà Nẵng",
};

export function CreateGarageModal({
  open,
  onClose,
}: {
  readonly open: boolean;
  readonly onClose: () => void;
}) {
  const queryClient = useQueryClient();
  const { notifySuccess, notifyError } = useToast();

  const [name, setName] = useState("");
  const [customSlug, setCustomSlug] = useState<string | null>(null);
  const [editingSlug, setEditingSlug] = useState(false);
  const [cityCode, setCityCode] = useState<GarageCityCode>("HCM");
  const [district, setDistrict] = useState("");
  const [fullAddress, setFullAddress] = useState("");
  const [phone, setPhone] = useState("");
  const [openHours, setOpenHours] = useState("08:00 – 18:30");
  const [bayCount, setBayCount] = useState("6");
  const [startingPriceVnd, setStartingPriceVnd] = useState("450000");
  const [coverImageUrl, setCoverImageUrl] = useState("/images/featured-garage.jpg");
  const [summary, setSummary] = useState("");
  const [verified, setVerified] = useState(true);
  const [formError, setFormError] = useState<string | null>(null);

  const effectiveSlug = customSlug ?? toSlug(name);

  const resetForm = () => {
    setName("");
    setCustomSlug(null);
    setEditingSlug(false);
    setCityCode("HCM");
    setDistrict("");
    setFullAddress("");
    setPhone("");
    setOpenHours("08:00 – 18:30");
    setBayCount("6");
    setStartingPriceVnd("450000");
    setCoverImageUrl("/images/featured-garage.jpg");
    setSummary("");
    setVerified(true);
    setFormError(null);
  };

  const mutation = useMutation({
    mutationFn: () =>
      createAdminGarage({
        slug: effectiveSlug.trim().toLowerCase(),
        name: name.trim(),
        district: district.trim(),
        cityCode,
        cityLabel: CITY_LABELS[cityCode],
        fullAddress: fullAddress.trim(),
        phone: phone.trim() || undefined,
        verified,
        status: "ACTIVE",
        coverImageUrl: coverImageUrl.trim() || "/images/featured-garage.jpg",
        openHours: openHours.trim(),
        bayCount: Number.parseInt(bayCount, 10),
        startingPriceVnd: Number.parseInt(startingPriceVnd, 10),
        summary: summary.trim(),
      }),
    onSuccess: (created) => {
      void queryClient.invalidateQueries({ queryKey: ["admin", "garages"] });
      void queryClient.invalidateQueries({ queryKey: ["admin", "dashboard"] });
      notifySuccess(`Đã thêm garage "${created.name}".`);
      resetForm();
      onClose();
    },
    onError: (err) => {
      const msg =
        err instanceof ApiError
          ? err.message
          : "Không thể tạo garage mới.";
      setFormError(msg);
      notifyError(msg);
    },
  });

  if (!open) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (name.trim().length < 3) {
      setFormError("Tên garage tối thiểu 3 ký tự.");
      return;
    }
    if (!/^[a-z0-9-]{3,180}$/.test(effectiveSlug.trim().toLowerCase())) {
      setFormError("Slug chỉ gồm chữ thường không dấu, số và dấu gạch ngang.");
      return;
    }
    if (district.trim().length < 2 || fullAddress.trim().length < 5) {
      setFormError("Vui lòng nhập đầy đủ Quận/Huyện và địa chỉ.");
      return;
    }
    if (summary.trim().length < 10) {
      setFormError("Mô tả năng lực xưởng tối thiểu 10 ký tự.");
      return;
    }

    mutation.mutate();
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="create-garage-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4"
    >
      <div className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-xl border border-line bg-surface shadow-2xl">
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-line bg-surface px-5 py-4">
          <div>
            <h3 id="create-garage-title" className="text-sm sm:text-base font-bold text-ink">
              Thêm garage đối tác mới
            </h3>
            <p className="text-xs text-ink-secondary">
              Slug đường dẫn được tạo tự động từ tên garage.
            </p>
          </div>
          <button
            type="button"
            aria-label="Đóng"
            onClick={onClose}
            disabled={mutation.isPending}
            className="rounded-md p-1 text-ink-muted hover:bg-surface-subtle hover:text-ink cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 p-5">
          {formError && (
            <div className="flex items-start gap-2 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2.5 text-xs text-rose-800">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-rose-600" />
              <span>{formError}</span>
            </div>
          )}

          <div>
            <label className="mb-1.5 block text-xs font-semibold text-ink">
              Tên garage *
            </label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="VD: AUTORA Flagship Quận 2"
              required
            />
          </div>

          <div className="rounded-lg border border-line bg-surface-subtle/60 px-3.5 py-2.5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-xs">
                <span className="text-ink-muted">Slug tự động:</span>{" "}
                <code className="font-mono text-ink-secondary">
                  /{effectiveSlug || "ten-garage"}
                </code>
              </span>
              <button
                type="button"
                onClick={() => setEditingSlug((prev) => !prev)}
                className="inline-flex items-center gap-1 text-[11px] font-semibold text-brand hover:underline cursor-pointer"
              >
                <Pencil className="h-3 w-3" />
                {editingSlug ? "Thu gọn" : "Tùy chỉnh slug"}
              </button>
            </div>
            {editingSlug && (
              <div className="mt-2.5 border-t border-line pt-2.5">
                <Input
                  value={effectiveSlug}
                  onChange={(e) => setCustomSlug(e.target.value.toLowerCase())}
                  placeholder="autora-flagship-quan-2"
                />
              </div>
            )}
          </div>

          <ImageUploadField
            label="Ảnh bìa garage *"
            value={coverImageUrl}
            onChange={setCoverImageUrl}
            folder="garages"
            presets={GARAGE_IMAGE_PRESETS}
          />

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-ink">
                Tỉnh / Thành phố *
              </label>
              <Select
                value={cityCode}
                onChange={(e) => setCityCode(e.target.value as GarageCityCode)}
              >
                <option value="HCM">TP. Hồ Chí Minh</option>
                <option value="HN">Hà Nội</option>
                <option value="DN">Đà Nẵng</option>
              </Select>
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-semibold text-ink">
                Quận / Huyện *
              </label>
              <Input
                value={district}
                onChange={(e) => setDistrict(e.target.value)}
                placeholder="VD: TP. Thủ Đức, TP.HCM"
                required
              />
            </div>

            <div className="sm:col-span-2">
              <label className="mb-1.5 block text-xs font-semibold text-ink">
                Địa chỉ đầy đủ *
              </label>
              <Input
                value={fullAddress}
                onChange={(e) => setFullAddress(e.target.value)}
                placeholder="Số nhà, tên đường, phường/xã, quận/huyện..."
                required
              />
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-semibold text-ink">
                Số điện thoại
              </label>
              <Input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="0901234567"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-semibold text-ink">
                Giờ mở cửa *
              </label>
              <Input
                value={openHours}
                onChange={(e) => setOpenHours(e.target.value)}
                required
              />
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-semibold text-ink">
                Số cầu nâng *
              </label>
              <Input
                type="number"
                min={1}
                max={100}
                value={bayCount}
                onChange={(e) => setBayCount(e.target.value)}
                required
              />
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-semibold text-ink">
                Giá khởi điểm (VNĐ) *
              </label>
              <Input
                type="number"
                min={0}
                step={10000}
                value={startingPriceVnd}
                onChange={(e) => setStartingPriceVnd(e.target.value)}
                required
              />
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-semibold text-ink">
              Mô tả năng lực xưởng *
            </label>
            <Textarea
              rows={3}
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              placeholder="Mô tả quy mô xưởng, trang thiết bị chẩn đoán và thế mạnh dịch vụ..."
              required
            />
          </div>

          <label className="inline-flex items-center gap-2 text-xs font-medium text-ink cursor-pointer">
            <input
              type="checkbox"
              checked={verified}
              onChange={(e) => setVerified(e.target.checked)}
              className="h-4 w-4 rounded border-line-strong text-brand"
            />
            Đánh dấu đã xác minh ngay
          </label>

          <div className="flex items-center justify-end gap-2 border-t border-line pt-4">
            <Button
              variant="secondary"
              size="sm"
              onClick={onClose}
              disabled={mutation.isPending}
            >
              Hủy
            </Button>
            <Button type="submit" size="sm" disabled={mutation.isPending}>
              {mutation.isPending ? "Đang tạo..." : "Thêm garage"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

