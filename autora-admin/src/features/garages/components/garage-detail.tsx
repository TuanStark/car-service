"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, BadgeCheck, Save } from "lucide-react";
import { ApiError } from "@/infrastructure/api/api-client";
import { Button } from "@/shared/ui/button";
import { Card, CardHeader } from "@/shared/ui/card";
import { ConfirmDialog } from "@/shared/ui/confirm-dialog";
import { ErrorState, TableSkeleton } from "@/shared/ui/feedback";
import { Input, Select, Textarea } from "@/shared/ui/input";
import {
  BookingStatusBadge,
  GarageStatusBadge,
  StatusPill,
} from "@/shared/ui/status-badge";
import { useToast } from "@/shared/ui/toast-provider";
import { formatViDate, formatVnd } from "@/shared/utils/format";
import {
  fetchAdminGarageDetail,
  type GarageCityCode,
  type GarageDetail,
  type GarageStatus,
  updateAdminGarage,
  updateAdminGarageStatus,
} from "../api";

const CITY_LABELS: Record<GarageCityCode, string> = {
  HCM: "TP. Hồ Chí Minh",
  HN: "Hà Nội",
  DN: "Đà Nẵng",
};

export function GarageDetailView({ garageId }: { readonly garageId: string }) {
  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ["admin", "garage", garageId],
    queryFn: () => fetchAdminGarageDetail(garageId),
  });

  if (isLoading) {
    return (
      <Card>
        <TableSkeleton rows={6} cols={3} />
      </Card>
    );
  }

  if (isError || !data) {
    return (
      <ErrorState
        message={
          error instanceof ApiError
            ? error.message
            : "Không thể tải thông tin garage."
        }
        status={error instanceof ApiError ? error.status : undefined}
        onRetry={() => void refetch()}
      />
    );
  }

  return <GarageDetailContent key={data.id} data={data} garageId={garageId} />;
}

function GarageDetailContent({
  data,
  garageId,
}: {
  readonly data: GarageDetail;
  readonly garageId: string;
}) {
  const queryClient = useQueryClient();
  const { notifySuccess, notifyError } = useToast();

  const [name, setName] = useState(data.name);
  const [district, setDistrict] = useState(data.district);
  const [cityCode, setCityCode] = useState<GarageCityCode>(data.cityCode);
  const [fullAddress, setFullAddress] = useState(data.fullAddress);
  const [phone, setPhone] = useState(data.phone ?? "");
  const [openHours, setOpenHours] = useState(data.openHours);
  const [bayCount, setBayCount] = useState(data.bayCount);
  const [startingPriceVnd, setStartingPriceVnd] = useState(
    data.startingPriceVnd
  );
  const [summary, setSummary] = useState(data.summary);
  const [pendingStatusAction, setPendingStatusAction] = useState<{
    status?: GarageStatus;
    verified?: boolean;
    title: string;
    description: string;
    tone: "primary" | "danger";
  } | null>(null);

  const updateInfoMutation = useMutation({
    mutationFn: () =>
      updateAdminGarage(garageId, {
        name: name.trim(),
        district: district.trim(),
        cityCode,
        cityLabel: CITY_LABELS[cityCode],
        fullAddress: fullAddress.trim(),
        phone: phone.trim(),
        openHours: openHours.trim(),
        bayCount: Number(bayCount),
        startingPriceVnd: Number(startingPriceVnd),
        summary: summary.trim(),
      }),
    onSuccess: (updated) => {
      queryClient.setQueryData(["admin", "garage", garageId], updated);
      void queryClient.invalidateQueries({ queryKey: ["admin", "garages"] });
      notifySuccess("Đã lưu thông tin hồ sơ garage.");
    },
    onError: (err) => {
      notifyError(
        err instanceof ApiError ? err.message : "Không thể cập nhật thông tin."
      );
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: (payload: { status?: GarageStatus; verified?: boolean }) =>
      updateAdminGarageStatus(garageId, payload),
    onSuccess: (updated) => {
      queryClient.setQueryData(["admin", "garage", garageId], updated);
      void queryClient.invalidateQueries({ queryKey: ["admin", "garages"] });
      void queryClient.invalidateQueries({ queryKey: ["admin", "dashboard"] });
      setPendingStatusAction(null);
      notifySuccess("Đã cập nhật trạng thái vận hành garage.");
    },
    onError: (err) => {
      setPendingStatusAction(null);
      notifyError(
        err instanceof ApiError ? err.message : "Không thể đổi trạng thái."
      );
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link
          href="/garages"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-ink-secondary hover:text-brand"
        >
          <ArrowLeft className="h-4 w-4" />
          Quay lại danh sách garage
        </Link>
        <div className="flex flex-wrap items-center gap-2">
          <GarageStatusBadge status={data.status} />
          <StatusPill
            label={data.verified ? "Đã xác minh" : "Chờ xác minh"}
            tone={data.verified ? "brand" : "warning"}
          />
        </div>
      </div>

      {/* Status & Verification Controls */}
      <Card className="p-5 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-ink">{data.name}</h2>
          <p className="text-xs text-ink-secondary">
            Slug: <span className="font-mono">{data.slug}</span> •{" "}
            {data.bookingCount} lịch hẹn • {data.serviceCount} dịch vụ
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {!data.verified ? (
            <Button
              variant="primary"
              size="sm"
              onClick={() =>
                setPendingStatusAction({
                  verified: true,
                  status: "ACTIVE",
                  title: "Xác minh & Kích hoạt Garage",
                  description: `Xác nhận garage "${data.name}" đủ tiêu chuẩn kỹ thuật để hiển thị xác minh và nhận lịch hẹn.`,
                  tone: "primary",
                })
              }
            >
              <BadgeCheck className="h-4 w-4" />
              Xác minh & Kích hoạt
            </Button>
          ) : (
            <Button
              variant="secondary"
              size="sm"
              onClick={() =>
                setPendingStatusAction({
                  verified: false,
                  title: "Gỡ huy hiệu xác minh",
                  description: `Gỡ trạng thái đã xác minh của garage "${data.name}" để kiểm tra lại hồ sơ.`,
                  tone: "danger",
                })
              }
            >
              Gỡ xác minh
            </Button>
          )}

          {data.status !== "ACTIVE" && (
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                setPendingStatusAction({
                  status: "ACTIVE",
                  title: "Mở hoạt động garage",
                  description: `Chuyển "${data.name}" sang trạng thái Đang hoạt động.`,
                  tone: "primary",
                })
              }
            >
              Bật hoạt động
            </Button>
          )}

          {data.status !== "SUSPENDED" && (
            <Button
              variant="danger"
              size="sm"
              onClick={() =>
                setPendingStatusAction({
                  status: "SUSPENDED",
                  title: "Đình chỉ hoạt động garage",
                  description: `Tạm đình chỉ garage "${data.name}" khỏi hệ thống đặt lịch mới.`,
                  tone: "danger",
                })
              }
            >
              Đình chỉ
            </Button>
          )}
        </div>
      </Card>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Profile Edit Form */}
        <Card className="lg:col-span-6">
          <CardHeader title="Chỉnh sửa hồ sơ garage" />
          <form
            onSubmit={(e) => {
              e.preventDefault();
              updateInfoMutation.mutate();
            }}
            className="space-y-4 p-5"
          >
            <div className="space-y-1">
              <label className="block text-xs font-semibold text-ink">
                Tên garage *
              </label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="space-y-1">
                <label className="block text-xs font-semibold text-ink">
                  Tỉnh / Thành phố
                </label>
                <Select
                  value={cityCode}
                  onChange={(e) =>
                    setCityCode(e.target.value as GarageCityCode)
                  }
                >
                  <option value="HCM">TP. Hồ Chí Minh</option>
                  <option value="HN">Hà Nội</option>
                  <option value="DN">Đà Nẵng</option>
                </Select>
              </div>
              <div className="space-y-1">
                <label className="block text-xs font-semibold text-ink">
                  Quận / Huyện *
                </label>
                <Input
                  value={district}
                  onChange={(e) => setDistrict(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-semibold text-ink">
                Địa chỉ đầy đủ *
              </label>
              <Input
                value={fullAddress}
                onChange={(e) => setFullAddress(e.target.value)}
                required
              />
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="space-y-1">
                <label className="block text-xs font-semibold text-ink">
                  Số điện thoại
                </label>
                <Input
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
              </div>
              <div className="space-y-1">
                <label className="block text-xs font-semibold text-ink">
                  Giờ mở cửa *
                </label>
                <Input
                  value={openHours}
                  onChange={(e) => setOpenHours(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="space-y-1">
                <label className="block text-xs font-semibold text-ink">
                  Số cầu nâng *
                </label>
                <Input
                  type="number"
                  min={1}
                  max={100}
                  value={bayCount}
                  onChange={(e) => setBayCount(Number(e.target.value))}
                  required
                />
              </div>
              <div className="space-y-1">
                <label className="block text-xs font-semibold text-ink">
                  Giá khởi điểm (VNĐ) *
                </label>
                <Input
                  type="number"
                  min={0}
                  step={10000}
                  value={startingPriceVnd}
                  onChange={(e) => setStartingPriceVnd(Number(e.target.value))}
                  required
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-semibold text-ink">
                Mô tả năng lực xưởng *
              </label>
              <Textarea
                rows={3}
                value={summary}
                onChange={(e) => setSummary(e.target.value)}
                required
              />
            </div>

            <Button
              type="submit"
              variant="primary"
              disabled={updateInfoMutation.isPending}
            >
              <Save className="h-4 w-4" />
              {updateInfoMutation.isPending ? "Đang lưu..." : "Lưu thay đổi"}
            </Button>
          </form>
        </Card>

        {/* Right: Offered Services & Related Bookings */}
        <div className="space-y-6 lg:col-span-6">
          <Card>
            <CardHeader
              title="Dịch vụ cung cấp tại garage"
              description={`${data.offeredServices.length} gói đang liên kết`}
            />
            <div className="divide-y divide-line">
              {data.offeredServices.length === 0 ? (
                <p className="p-5 text-xs text-ink-muted">
                  Chưa có gói dịch vụ nào được gán cho garage này.
                </p>
              ) : (
                data.offeredServices.map((srv) => (
                  <div
                    key={srv.serviceProductId}
                    className="flex items-center justify-between gap-3 px-5 py-3 text-xs"
                  >
                    <div>
                      <Link
                        href={`/services/${srv.serviceProductId}`}
                        className="font-semibold text-ink hover:text-brand"
                      >
                        {srv.name}
                      </Link>
                      <span className="block text-[11px] text-ink-muted">
                        {srv.sku} • {srv.categoryTitle}
                      </span>
                    </div>
                    <strong className="shrink-0 font-semibold text-brand tabular-nums">
                      {formatVnd(srv.customPriceVnd ?? srv.basePriceVnd)}
                    </strong>
                  </div>
                ))
              )}
            </div>
          </Card>

          <Card>
            <CardHeader title="Lịch hẹn gần đây tại garage" />
            <div className="divide-y divide-line">
              {data.recentBookings.length === 0 ? (
                <p className="p-5 text-xs text-ink-muted">
                  Garage này chưa có lịch hẹn nào.
                </p>
              ) : (
                data.recentBookings.map((b) => (
                  <div
                    key={b.id}
                    className="flex items-center justify-between gap-3 px-5 py-3 text-xs"
                  >
                    <div>
                      <Link
                        href={`/bookings/${b.id}`}
                        className="font-mono font-semibold text-brand hover:underline"
                      >
                        {b.orderCode}
                      </Link>
                      <span className="block text-[11px] text-ink-secondary">
                        {b.customerName} • {formatViDate(b.appointmentDate)} (
                        {b.appointmentTime})
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <BookingStatusBadge status={b.status} />
                      <strong className="tabular-nums text-ink">
                        {formatVnd(b.totalVnd)}
                      </strong>
                    </div>
                  </div>
                ))
              )}
            </div>
          </Card>
        </div>
      </div>

      {pendingStatusAction && (
        <ConfirmDialog
          open={true}
          title={pendingStatusAction.title}
          description={pendingStatusAction.description}
          confirmLabel="Xác nhận"
          tone={pendingStatusAction.tone}
          isPending={updateStatusMutation.isPending}
          onClose={() => setPendingStatusAction(null)}
          onConfirm={() =>
            updateStatusMutation.mutate({
              status: pendingStatusAction.status,
              verified: pendingStatusAction.verified,
            })
          }
        />
      )}
    </div>
  );
}
