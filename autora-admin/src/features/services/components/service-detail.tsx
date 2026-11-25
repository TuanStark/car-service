"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AlertCircle, ArrowLeft, Power, Save } from "lucide-react";
import { ApiError } from "@/infrastructure/api/api-client";
import { Button } from "@/shared/ui/button";
import { Card, CardHeader } from "@/shared/ui/card";
import { ConfirmDialog } from "@/shared/ui/confirm-dialog";
import { ErrorState, TableSkeleton } from "@/shared/ui/feedback";
import { GalleryUploadField, ImageUploadField } from "@/shared/ui/image-upload";
import { Input, Select, Textarea } from "@/shared/ui/input";
import { StatusPill } from "@/shared/ui/status-badge";
import { useToast } from "@/shared/ui/toast-provider";
import { formatVnd } from "@/shared/utils/format";
import {
  fetchAdminServiceDetail,
  fetchServiceCategories,
  type ServiceBadgeType,
  type ServiceCategoryOption,
  type ServiceProductItem,
  toggleAdminServiceStatus,
  updateAdminService,
} from "../api";

export function ServiceDetailView({ serviceId }: { readonly serviceId: string }) {
  const { data: categories = [] } = useQuery({
    queryKey: ["admin", "service-categories"],
    queryFn: fetchServiceCategories,
  });

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ["admin", "service", serviceId],
    queryFn: () => fetchAdminServiceDetail(serviceId),
  });

  if (isLoading) {
    return (
      <Card>
        <TableSkeleton rows={6} cols={4} />
      </Card>
    );
  }

  if (isError || !data) {
    return (
      <ErrorState
        message={
          error instanceof ApiError
            ? error.message
            : "Không tìm thấy thông tin gói dịch vụ."
        }
        status={error instanceof ApiError ? error.status : undefined}
        onRetry={() => void refetch()}
      />
    );
  }

  return (
    <ServiceDetailContent
      key={data.id}
      data={data}
      categories={categories}
      serviceId={serviceId}
    />
  );
}

function ServiceDetailContent({
  data,
  categories,
  serviceId,
}: {
  readonly data: ServiceProductItem;
  readonly categories: readonly ServiceCategoryOption[];
  readonly serviceId: string;
}) {
  const queryClient = useQueryClient();
  const { notifySuccess, notifyError } = useToast();

  const [sku, setSku] = useState(data.sku);
  const [slug, setSlug] = useState(data.slug);
  const [categoryId, setCategoryId] = useState(data.categoryId);
  const [name, setName] = useState(data.name);
  const [shortSummary, setShortSummary] = useState(data.shortSummary);
  const [description, setDescription] = useState(data.description);
  const [imageUrl, setImageUrl] = useState(data.imageUrl);
  const [galleryUrls, setGalleryUrls] = useState<string[]>([
    ...data.galleryUrls,
  ]);
  const [priceVnd, setPriceVnd] = useState(String(data.priceVnd));
  const [originalPriceVnd, setOriginalPriceVnd] = useState(
    data.originalPriceVnd !== null ? String(data.originalPriceVnd) : ""
  );
  const [badge, setBadge] = useState(data.badge ?? "");
  const [estimatedDuration, setEstimatedDuration] = useState(
    data.estimatedDuration
  );
  const [warrantyLabel, setWarrantyLabel] = useState(data.warrantyLabel);
  const [compatibleBrandsLabel, setCompatibleBrandsLabel] = useState(
    data.compatibleBrandsLabel
  );
  const [includedStepsText, setIncludedStepsText] = useState(
    data.includedSteps.join("\n")
  );
  const [isFeatured, setIsFeatured] = useState(data.isFeatured);
  const [formError, setFormError] = useState<string | null>(null);
  const [confirmToggleOpen, setConfirmToggleOpen] = useState(false);

  const updateMutation = useMutation({
    mutationFn: () => {
      const parsedPrice = Number.parseInt(priceVnd, 10);
      const parsedOrig = originalPriceVnd.trim()
        ? Number.parseInt(originalPriceVnd, 10)
        : null;
      const steps = includedStepsText
        .split("\n")
        .map((line) => line.trim())
        .filter(Boolean);

      return updateAdminService(serviceId, {
        sku: sku.trim().toUpperCase(),
        slug: slug.trim().toLowerCase(),
        categoryId,
        name: name.trim(),
        shortSummary: shortSummary.trim(),
        description: description.trim(),
        imageUrl: imageUrl.trim() || "/images/service-maintenance.jpg",
        galleryUrls:
          galleryUrls.length > 0
            ? galleryUrls
            : [imageUrl.trim() || "/images/service-maintenance.jpg"],
        priceVnd: parsedPrice,
        originalPriceVnd: parsedOrig,
        badge: (badge || null) as ServiceBadgeType,
        estimatedDuration: estimatedDuration.trim(),
        warrantyLabel: warrantyLabel.trim(),
        compatibleBrandsLabel: compatibleBrandsLabel.trim(),
        includedSteps: steps,
        isFeatured,
      });
    },
    onSuccess: (updated) => {
      queryClient.setQueryData(["admin", "service", serviceId], updated);
      void queryClient.invalidateQueries({ queryKey: ["admin", "services"] });
      setFormError(null);
      notifySuccess("Đã cập nhật thông tin & bảng giá dịch vụ.");
    },
    onError: (err) => {
      const msg =
        err instanceof ApiError
          ? err.message
          : "Không thể cập nhật gói dịch vụ.";
      setFormError(msg);
      notifyError(msg);
    },
  });

  const toggleMutation = useMutation({
    mutationFn: (nextActive: boolean) =>
      toggleAdminServiceStatus(serviceId, nextActive),
    onSuccess: (updated) => {
      queryClient.setQueryData(["admin", "service", serviceId], updated);
      void queryClient.invalidateQueries({ queryKey: ["admin", "services"] });
      notifySuccess(
        updated.isActive
          ? "Đã kích hoạt mở bán gói dịch vụ."
          : "Đã tạm ngưng gói dịch vụ."
      );
      setConfirmToggleOpen(false);
    },
    onError: (err) => {
      notifyError(
        err instanceof ApiError
          ? err.message
          : "Không thể thay đổi trạng thái gói dịch vụ."
      );
    },
  });

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    const parsedPrice = Number.parseInt(priceVnd, 10);
    const parsedOrig = originalPriceVnd.trim()
      ? Number.parseInt(originalPriceVnd, 10)
      : null;

    if (!Number.isInteger(parsedPrice) || parsedPrice < 1000) {
      setFormError("Giá bán phải là số nguyên tối thiểu 1.000 VNĐ.");
      return;
    }
    if (
      parsedOrig !== null &&
      (!Number.isInteger(parsedOrig) || parsedOrig < parsedPrice)
    ) {
      setFormError("Giá gốc niêm yết phải lớn hơn hoặc bằng giá bán hiện tại.");
      return;
    }

    updateMutation.mutate();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Link
            href="/services"
            className="inline-flex items-center gap-1.5 rounded-lg border border-line-strong bg-surface px-3 py-1.5 text-xs font-semibold text-ink hover:bg-surface-subtle"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Danh sách dịch vụ
          </Link>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-lg font-bold text-ink">{data.name}</h2>
              <StatusPill
                label={data.isActive ? "Đang mở bán" : "Tạm ngưng"}
                tone={data.isActive ? "success" : "warning"}
              />
            </div>
            <p className="text-xs text-ink-secondary font-mono">
              SKU: {data.sku} • Giá hiện tại: {formatVnd(data.priceVnd)}
              {data.discountPercent ? ` (-${data.discountPercent}%)` : ""}
            </p>
          </div>
        </div>

        <Button
          variant={data.isActive ? "danger" : "primary"}
          size="sm"
          onClick={() => setConfirmToggleOpen(true)}
        >
          <Power className="h-3.5 w-3.5" />
          {data.isActive ? "Tạm ngưng gói dịch vụ" : "Kích hoạt mở bán"}
        </Button>
      </div>

      <Card>
        <CardHeader
          title="Thông tin chi tiết & Bảng giá"
          description="Mọi thay đổi về giá bán/giá gốc được kiểm tra hợp lệ ở tầng nghiệp vụ máy chủ."
        />

        <form onSubmit={handleSave} className="space-y-4 p-5">
          {formError && (
            <div className="flex items-start gap-2 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2.5 text-xs text-rose-800">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-rose-600" />
              <span>{formError}</span>
            </div>
          )}

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-ink">
                Tên dịch vụ *
              </label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-semibold text-ink">
                Danh mục *
              </label>
              <Select
                value={categoryId}
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
                Mã SKU *
              </label>
              <Input
                value={sku}
                onChange={(e) => setSku(e.target.value.toUpperCase())}
                required
              />
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-semibold text-ink">
                Đường dẫn (Slug) *
              </label>
              <Input
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                required
              />
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-semibold text-ink">
                Giá bán hiện tại (VNĐ) *
              </label>
              <Input
                type="number"
                min={1000}
                step={1000}
                value={priceVnd}
                onChange={(e) => setPriceVnd(e.target.value)}
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
                placeholder="Để trống nếu không áp dụng giảm giá"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-semibold text-ink">
                Thời gian thực hiện *
              </label>
              <Input
                value={estimatedDuration}
                onChange={(e) => setEstimatedDuration(e.target.value)}
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

            <div>
              <label className="mb-1.5 block text-xs font-semibold text-ink">
                Dòng xe tương thích
              </label>
              <Input
                value={compatibleBrandsLabel}
                onChange={(e) => setCompatibleBrandsLabel(e.target.value)}
              />
            </div>
          </div>

          <ImageUploadField
            label="Ảnh đại diện dịch vụ *"
            value={imageUrl}
            onChange={setImageUrl}
          />

          <GalleryUploadField urls={galleryUrls} onChange={setGalleryUrls} />

          <div>
            <label className="mb-1.5 block text-xs font-semibold text-ink">
              Tóm tắt ngắn *
            </label>
            <Input
              value={shortSummary}
              onChange={(e) => setShortSummary(e.target.value)}
              required
            />
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-semibold text-ink">
              Mô tả chi tiết *
            </label>
            <Textarea
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
            />
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-semibold text-ink">
              Các bước thực hiện (mỗi dòng 1 bước)
            </label>
            <Textarea
              rows={4}
              value={includedStepsText}
              onChange={(e) => setIncludedStepsText(e.target.value)}
            />
          </div>

          <label className="inline-flex items-center gap-2 text-xs font-medium text-ink cursor-pointer">
            <input
              type="checkbox"
              checked={isFeatured}
              onChange={(e) => setIsFeatured(e.target.checked)}
              className="h-4 w-4 rounded border-line-strong text-brand"
            />
            Hiển thị tại mục dịch vụ nổi bật trên trang chủ
          </label>

          <div className="flex justify-end border-t border-line pt-4">
            <Button type="submit" disabled={updateMutation.isPending}>
              <Save className="h-4 w-4" />
              {updateMutation.isPending ? "Đang lưu..." : "Lưu thay đổi"}
            </Button>
          </div>
        </form>
      </Card>

      <ConfirmDialog
        open={confirmToggleOpen}
        title={
          data.isActive ? "Tạm ngưng gói dịch vụ?" : "Mở bán lại gói dịch vụ?"
        }
        description={
          data.isActive
            ? `Khách hàng sẽ không thể đặt mới gói "${data.name}" khi đang tạm ngưng.`
            : `Gói "${data.name}" sẽ hiển thị trở lại trong danh mục đặt lịch.`
        }
        confirmLabel={data.isActive ? "Xác nhận tạm ngưng" : "Xác nhận mở bán"}
        tone={data.isActive ? "danger" : "primary"}
        isPending={toggleMutation.isPending}
        onClose={() => setConfirmToggleOpen(false)}
        onConfirm={() => toggleMutation.mutate(!data.isActive)}
      />
    </div>
  );
}
