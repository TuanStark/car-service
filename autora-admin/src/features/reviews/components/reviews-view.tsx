"use client";

import React, { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Eye, EyeOff, MessageSquareReply, Star, X } from "lucide-react";
import { ApiError } from "@/infrastructure/api/api-client";
import { Button } from "@/shared/ui/button";
import { Card } from "@/shared/ui/card";
import {
  EmptyState,
  ErrorState,
  Pagination,
  TableSkeleton,
} from "@/shared/ui/feedback";
import { Select, Textarea } from "@/shared/ui/input";
import { StatusPill } from "@/shared/ui/status-badge";
import { useToast } from "@/shared/ui/toast-provider";
import { formatViDateTime } from "@/shared/utils/format";
import {
  type AdminReviewDto,
  fetchAdminReviews,
  replyAdminReview,
  toggleAdminReviewHidden,
} from "../api";

export function ReviewsView() {
  const [page, setPage] = useState(1);
  const [ratingFilter, setRatingFilter] = useState<string>("");
  const [replyTarget, setReplyTarget] = useState<AdminReviewDto | null>(null);

  const queryClient = useQueryClient();
  const { notifySuccess, notifyError } = useToast();

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ["admin", "reviews", { page, ratingFilter }],
    queryFn: () =>
      fetchAdminReviews({
        page,
        limit: 20,
        ratingMax: ratingFilter ? Number(ratingFilter) : undefined,
      }),
  });

  const hideMutation = useMutation({
    mutationFn: ({ id, isHidden }: { id: string; isHidden: boolean }) =>
      toggleAdminReviewHidden(id, isHidden),
    onSuccess: (r) => {
      notifySuccess(
        r.isHidden
          ? "Đã ẩn đánh giá & cập nhật lại điểm trung bình"
          : "Đã hiển thị lại đánh giá"
      );
      void queryClient.invalidateQueries({ queryKey: ["admin", "reviews"] });
    },
    onError: (err) => {
      notifyError(err instanceof ApiError ? err.message : "Thao tác thất bại.");
    },
  });

  const items = data?.items ?? [];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-ink">
            Kiểm duyệt Đánh giá & Chất lượng dịch vụ
          </h1>
          <p className="text-xs text-ink-secondary">
            Theo dõi đánh giá 1–2 sao, phản hồi từ Garage/Admin và ẩn đánh giá vi phạm (tự động tính lại ratingAvg)
          </p>
        </div>

        <div className="w-56">
          <Select
            value={ratingFilter}
            onChange={(e) => {
              setRatingFilter(e.target.value);
              setPage(1);
            }}
          >
            <option value="">Tất cả số sao</option>
            <option value="2">Ưu tiên: ≤ 2 sao</option>
            <option value="3">≤ 3 sao</option>
          </Select>
        </div>
      </div>

      <Card className="overflow-hidden">
        {isLoading ? (
          <TableSkeleton rows={5} cols={5} />
        ) : isError ? (
          <ErrorState
            message={
              error instanceof ApiError
                ? error.message
                : "Không thể tải danh sách đánh giá."
            }
            onRetry={() => void refetch()}
          />
        ) : items.length === 0 ? (
          <EmptyState
            title="Chưa có đánh giá nào phù hợp"
            description="Các đánh giá từ khách hàng sau khi hoàn tất dịch vụ sẽ hiển thị tại đây."
          />
        ) : (
          <>
            <div className="divide-y divide-line">
              {items.map((r) => (
                <div
                  key={r.id}
                  className="flex flex-col gap-3 p-5 sm:flex-row sm:items-start sm:justify-between"
                >
                  <div className="space-y-1.5 text-xs">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="inline-flex items-center gap-1 rounded-full bg-warning/15 px-2.5 py-0.5 font-bold text-warning">
                        <Star className="h-3.5 w-3.5 fill-current" />
                        {r.rating}/5
                      </span>
                      <strong className="text-ink">{r.customerName}</strong>
                      <span className="text-ink-muted">({r.vehicleLabel})</span>
                      {r.isHidden && (
                        <StatusPill label="Đã ẩn" tone="danger" />
                      )}
                    </div>

                    <p className="text-sm text-ink">{r.comment}</p>

                    <div className="text-[11px] text-ink-muted">
                      {r.garageName ?? "—"} {r.serviceName ? `• ${r.serviceName}` : ""} •{" "}
                      {formatViDateTime(r.createdAt)}
                    </div>

                    {r.adminReply && (
                      <div className="mt-2 rounded-lg border border-line bg-surface-subtle p-3 text-xs">
                        <div className="font-semibold text-brand">
                          Phản hồi từ Garage / Admin ({r.repliedByEmail ?? "Admin"}):
                        </div>
                        <p className="mt-0.5 text-ink-secondary">{r.adminReply}</p>
                      </div>
                    )}
                  </div>

                  <div className="flex shrink-0 items-center gap-2">
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => setReplyTarget(r)}
                    >
                      <MessageSquareReply className="h-3.5 w-3.5" />
                      {r.adminReply ? "Sửa phản hồi" : "Phản hồi"}
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      disabled={hideMutation.isPending}
                      onClick={() =>
                        hideMutation.mutate({
                          id: r.id,
                          isHidden: !r.isHidden,
                        })
                      }
                    >
                      {r.isHidden ? (
                        <>
                          <Eye className="h-3.5 w-3.5" />
                          Hiện lại
                        </>
                      ) : (
                        <>
                          <EyeOff className="h-3.5 w-3.5 text-danger" />
                          Ẩn đánh giá
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              ))}
            </div>

            {data?.meta && (
              <div className="border-t border-line px-4 py-3">
                <Pagination meta={data.meta} onPageChange={setPage} />
              </div>
            )}
          </>
        )}
      </Card>

      {replyTarget && (
        <ReplyReviewModal
          review={replyTarget}
          onClose={() => setReplyTarget(null)}
        />
      )}
    </div>
  );
}

function ReplyReviewModal({
  review,
  onClose,
}: {
  readonly review: AdminReviewDto;
  readonly onClose: () => void;
}) {
  const queryClient = useQueryClient();
  const { notifySuccess, notifyError } = useToast();
  const [adminReply, setAdminReply] = useState(review.adminReply ?? "");

  const mutation = useMutation({
    mutationFn: () => replyAdminReview(review.id, adminReply),
    onSuccess: () => {
      notifySuccess("Đã lưu phản hồi đánh giá");
      void queryClient.invalidateQueries({ queryKey: ["admin", "reviews"] });
      onClose();
    },
    onError: (err) => {
      notifyError(err instanceof ApiError ? err.message : "Gửi phản hồi thất bại.");
    },
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
      <div className="w-full max-w-md rounded-2xl border border-line bg-surface-elevated p-5 shadow-xl">
        <div className="flex items-center justify-between border-b border-line pb-3">
          <h3 className="text-base font-bold text-ink">
            Phản hồi đánh giá ({review.rating}/5★)
          </h3>
          <button type="button" onClick={onClose} className="text-ink-muted hover:text-ink">
            <X className="h-4 w-4" />
          </button>
        </div>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            mutation.mutate();
          }}
          className="mt-4 space-y-3"
        >
          <p className="rounded-lg border border-line bg-surface-subtle p-3 text-xs text-ink-secondary">
            “{review.comment}”
          </p>
          <div>
            <label className="mb-1 block text-xs font-semibold text-ink">Nội dung phản hồi *</label>
            <Textarea
              required
              rows={4}
              placeholder="Cảm ơn quý khách đã góp ý..."
              value={adminReply}
              onChange={(e) => setAdminReply(e.target.value)}
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="ghost" onClick={onClose}>
              Hủy
            </Button>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? "Đang gửi..." : "Gửi phản hồi"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

