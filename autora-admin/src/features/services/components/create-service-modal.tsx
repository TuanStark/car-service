"use client";

import React, { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { AlertCircle, X } from "lucide-react";
import { ApiError } from "@/infrastructure/api/api-client";
import { Button } from "@/shared/ui/button";
import { Input, Select, Textarea } from "@/shared/ui/input";
import { useToast } from "@/shared/ui/toast-provider";
import {
  createAdminService,
  type ServiceBadgeType,
  type ServiceCategoryOption,
} from "../api";

function toSlug(input: string): string {
  return input
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/gi, "d")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 120);
}

export function CreateServiceModal({
  open,
  categories,
  onClose,
}: {
  readonly open: boolean;
  readonly categories: readonly ServiceCategoryOption[];
  readonly onClose: () => void;
}) {
  const queryClient = useQueryClient();
  const { notifySuccess, notifyError } = useToast();

  const [sku, setSku] = useState("");
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [slugTouched, setSlugTouched] = useState(false);
  const [categoryId, setCategoryId] = useState("");
  const [priceVnd, setPriceVnd] = useState("");
  const [originalPriceVnd, setOriginalPriceVnd] = useState("");
  const [estimatedDuration, setEstimatedDuration] = useState("45 phút");
  const [warrantyLabel, setWarrantyLabel] = useState("Bảo hành 6 tháng / 10.000 km");
  const [badge, setBadge] = useState<string>("");
  const [shortSummary, setShortSummary] = useState("");
  const [description, setDescription] = useState("");
  const [isFeatured, setIsFeatured] = useState(false);
  const [isActive, setIsActive] = useState(true);
  const [formError, setFormError] = useState<string | null>(null);

  const effectiveCategoryId = categoryId || categories[0]?.id || "";

  const resetForm = () => {
    setSku("");
    setName("");
    setSlug("");
    setSlugTouched(false);
    setCategoryId("");
    setPriceVnd("");
    setOriginalPriceVnd("");
    setEstimatedDuration("45 phút");
    setWarrantyLabel("Bảo hành 6 tháng / 10.000 km");
    setBadge("");
    setShortSummary("");
    setDescription("");
    setIsFeatured(false);
    setIsActive(true);
    setFormError(null);
  };

  const mutation = useMutation({
    mutationFn: () => {
      const parsedPrice = Number.parseInt(priceVnd, 10);
      const parsedOrig = originalPriceVnd.trim()
        ? Number.parseInt(originalPriceVnd, 10)
        : undefined;

      return createAdminService({
        sku: sku.trim().toUpperCase(),
        slug: slug.trim().toLowerCase(),
        categoryId: effectiveCategoryId,
        name: name.trim(),
        shortSummary: shortSummary.trim(),
        description: description.trim(),
        priceVnd: parsedPrice,
        ...(parsedOrig !== undefined ? { originalPriceVnd: parsedOrig } : {}),
        badge: (badge || null) as ServiceBadgeType,
        estimatedDuration: estimatedDuration.trim(),
        warrantyLabel: warrantyLabel.trim(),
        isFeatured,
        isActive,
      });
    },
    onSuccess: (created) => {
      void queryClient.invalidateQueries({ queryKey: ["admin", "services"] });
      notifySuccess(`Đã tạo gói dịch vụ "${created.name}".`);
      resetForm();
      onClose();
    },
    onError: (err) => {
      const msg =
        err instanceof ApiError
          ? err.message
          : "Không thể tạo gói dịch vụ mới.";
      setFormError(msg);
      notifyError(msg);
    },
  });

  if (!open) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    const normalizedSku = sku.trim().toUpperCase();
    const normalizedSlug = slug.trim().toLowerCase();
    const parsedPrice = Number.parseInt(priceVnd, 10);
    const parsedOrig = originalPriceVnd.trim()
      ? Number.parseInt(originalPriceVnd, 10)
      : null;

    if (!/^[A-Z0-9-]{3,40}$/.test(normalizedSku)) {
      setFormError("Mã SKU phải từ 3–40 ký tự gồm chữ in hoa, số và dấu gạch ngang.");
      return;
    }
    if (!/^[a-z0-9-]{3,180}$/.test(normalizedSlug)) {
      setFormError("Slug chỉ gồm chữ thường không dấu, số và dấu gạch ngang.");
      return;
    }
    if (!effectiveCategoryId) {
      setFormError("Vui lòng chọn danh mục dịch vụ.");
      return;
    }
    if (name.trim().length < 4) {
      setFormError("Tên dịch vụ tối thiểu 4 ký tự.");
      return;
    }
    if (!Number.isInteger(parsedPrice) || parsedPrice < 1000) {
      setFormError("Giá bán phải là số nguyên tối thiểu 1.000 VNĐ.");
      return;
    }
    if (parsedOrig !== null && (!Number.isInteger(parsedOrig) || parsedOrig < parsedPrice)) {
      setFormError("Giá gốc niêm yết phải lớn hơn hoặc bằng giá bán.");
      return;
    }
    if (shortSummary.trim().length < 10) {
      setFormError("Tóm tắt ngắn tối thiểu 10 ký tự.");
      return;
    }
    if (description.trim().length < 10) {
      setFormError("Mô tả chi tiết tối thiểu 10 ký tự.");
      return;
    }

    mutation.mutate();
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="create-service-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4"
    >
      <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-xl border border-line bg-surface shadow-2xl">
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-line bg-surface px-5 py-4">
          <div>
            <h3 id="create-service-title" className="text-sm sm:text-base font-bold text-ink">
              Thêm gói dịch vụ mới
            </h3>
            <p className="text-xs text-ink-secondary">
              Giá và điều kiện hợp lệ sẽ được kiểm tra lại trên máy chủ.
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

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-ink">
                Tên dịch vụ *
              </label>
              <Input
                value={name}
                onChange={(e) => {
                  const val = e.target.value;
                  setName(val);
                  if (!slugTouched) setSlug(toSlug(val));
                }}
                placeholder="VD: Bảo dưỡng hệ thống phanh toàn diện"
                required
              />
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-semibold text-ink">
                Mã SKU *
              </label>
              <Input
                value={sku}
                onChange={(e) => setSku(e.target.value.toUpperCase())}
                placeholder="VD: ATR-PH-012"
                required
              />
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-semibold text-ink">
                Đường dẫn (Slug) *
              </label>
              <Input
                value={slug}
                onChange={(e) => {
                  setSlugTouched(true);
                  setSlug(e.target.value);
                }}
                placeholder="bao-duong-he-thong-phanh"
                required
              />
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-semibold text-ink">
                Danh mục *
              </label>
              <Select
                value={effectiveCategoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                required
              >
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.shortLabel || cat.title}
                  </option>
                ))}
              </Select>
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-semibold text-ink">
                Giá bán (VNĐ) *
              </label>
              <Input
                type="number"
                min={1000}
                step={1000}
                value={priceVnd}
                onChange={(e) => setPriceVnd(e.target.value)}
                placeholder="650000"
                required
              />
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-semibold text-ink">
                Giá niêm yết gốc (VNĐ)
              </label>
              <Input
                type="number"
                min={1000}
                step={1000}
                value={originalPriceVnd}
                onChange={(e) => setOriginalPriceVnd(e.target.value)}
                placeholder="Để trống nếu không giảm giá"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-semibold text-ink">
                Thời gian ước tính *
              </label>
              <Input
                value={estimatedDuration}
                onChange={(e) => setEstimatedDuration(e.target.value)}
                placeholder="45 phút"
                required
              />
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-semibold text-ink">
                Chính sách bảo hành *
              </label>
              <Input
                value={warrantyLabel}
                onChange={(e) => setWarrantyLabel(e.target.value)}
                placeholder="Bảo hành 6 tháng / 10.000 km"
                required
              />
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-semibold text-ink">
                Nhãn nổi bật
              </label>
              <Select value={badge} onChange={(e) => setBadge(e.target.value)}>
                <option value="">Không gắn nhãn</option>
                <option value="BEST_SELLER">Bán chạy</option>
                <option value="PROMO">Khuyến mãi</option>
                <option value="NEW">Mới</option>
                <option value="RECOMMENDED">Khuyên dùng</option>
              </Select>
            </div>

            <div className="flex items-end gap-5 pb-1.5">
              <label className="inline-flex items-center gap-2 text-xs font-medium text-ink cursor-pointer">
                <input
                  type="checkbox"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                  className="h-4 w-4 rounded border-line-strong text-brand"
                />
                Mở bán ngay
              </label>
              <label className="inline-flex items-center gap-2 text-xs font-medium text-ink cursor-pointer">
                <input
                  type="checkbox"
                  checked={isFeatured}
                  onChange={(e) => setIsFeatured(e.target.checked)}
                  className="h-4 w-4 rounded border-line-strong text-brand"
                />
                Hiển thị nổi bật
              </label>
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-semibold text-ink">
              Tóm tắt ngắn *
            </label>
            <Input
              value={shortSummary}
              onChange={(e) => setShortSummary(e.target.value)}
              placeholder="Mô tả ngắn gọn giá trị gói dịch vụ (tối thiểu 10 ký tự)"
              required
            />
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-semibold text-ink">
              Mô tả chi tiết *
            </label>
            <Textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Chi tiết quy trình, hạng mục kiểm tra và tiêu chuẩn phụ tùng..."
              required
            />
          </div>

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
              {mutation.isPending ? "Đang tạo..." : "Tạo gói dịch vụ"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

