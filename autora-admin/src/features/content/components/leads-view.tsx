"use client";

import React, { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CheckCircle2, PhoneCall, X } from "lucide-react";
import { ApiError } from "@/infrastructure/api/api-client";
import { Button } from "@/shared/ui/button";
import { Card } from "@/shared/ui/card";
import { EmptyState, ErrorState, TableSkeleton } from "@/shared/ui/feedback";
import { Select, Textarea } from "@/shared/ui/input";
import { StatusPill } from "@/shared/ui/status-badge";
import { useToast } from "@/shared/ui/toast-provider";
import { formatViDateTime } from "@/shared/utils/format";
import {
  type ContactInquiryDto,
  type ContactInquiryStatus,
  fetchAdminLeads,
  updateAdminLead,
} from "../api";

const STATUS_META: Record<
  ContactInquiryStatus,
  { label: string; tone: "warning" | "info" | "success" }
> = {
  NEW: { label: "Mới tiếp nhận", tone: "warning" },
  CONTACTED: { label: "Đã liên hệ", tone: "info" },
  RESOLVED: { label: "Đã xử lý", tone: "success" },
};

export function LeadsView() {
  const [editTarget, setEditTarget] = useState<ContactInquiryDto | null>(null);

  const { data = [], isLoading, isError, error, refetch } = useQuery({
    queryKey: ["admin", "content", "leads"],
    queryFn: fetchAdminLeads,
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold tracking-tight text-ink">
          Yêu cầu Liên hệ & Tư vấn từ Web (Leads)
        </h1>
        <p className="text-xs text-ink-secondary">
          Tiếp nhận form liên hệ từ `/public/contact-inquiries` và theo dõi tiến độ tư vấn của Cố vấn dịch vụ
        </p>
      </div>

      <Card className="overflow-hidden">
        {isLoading ? (
          <TableSkeleton rows={4} cols={5} />
        ) : isError ? (
          <ErrorState
            message={
              error instanceof ApiError
                ? error.message
                : "Không thể tải danh sách yêu cầu liên hệ."
            }
            onRetry={() => void refetch()}
          />
        ) : data.length === 0 ? (
          <EmptyState
            title="Chưa có yêu cầu liên hệ nào"
            description="Khi khách hàng gửi form tư vấn trên website, thông tin sẽ xuất hiện tại đây."
          />
        ) : (
          <div className="divide-y divide-line">
            {data.map((lead) => {
              const meta = STATUS_META[lead.status];
              return (
                <div
                  key={lead.id}
                  className="flex flex-col gap-3 p-5 sm:flex-row sm:items-start sm:justify-between"
                >
                  <div className="space-y-1 text-xs">
                    <div className="flex flex-wrap items-center gap-2">
                      <StatusPill label={meta.label} tone={meta.tone} />
                      <strong className="text-sm text-ink">{lead.fullName}</strong>
                      <span className="font-mono text-brand">{lead.phone}</span>
                      {lead.vehicleInfo && (
                        <span className="text-ink-muted">• {lead.vehicleInfo}</span>
                      )}
                    </div>
                    <p className="text-sm text-ink-secondary">{lead.message}</p>
                    <div className="text-[11px] text-ink-muted">
                      Gửi lúc: {formatViDateTime(lead.createdAt)}
                      {lead.assignedToEmail && ` • Phụ trách: ${lead.assignedToEmail}`}
                    </div>
                    {lead.staffNote && (
                      <div className="mt-1 rounded border border-line bg-surface-subtle px-3 py-1.5 text-[11px] text-ink">
                        Ghi chú SA: {lead.staffNote}
                      </div>
                    )}
                  </div>

                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => setEditTarget(lead)}
                  >
                    <PhoneCall className="h-3.5 w-3.5" />
                    Cập nhật xử lý
                  </Button>
                </div>
              );
            })}
          </div>
        )}
      </Card>

      {editTarget && (
        <UpdateLeadModal lead={editTarget} onClose={() => setEditTarget(null)} />
      )}
    </div>
  );
}

function UpdateLeadModal({
  lead,
  onClose,
}: {
  readonly lead: ContactInquiryDto;
  readonly onClose: () => void;
}) {
  const queryClient = useQueryClient();
  const { notifySuccess, notifyError } = useToast();
  const [status, setStatus] = useState<ContactInquiryStatus>(lead.status);
  const [staffNote, setStaffNote] = useState(lead.staffNote ?? "");

  const mutation = useMutation({
    mutationFn: () =>
      updateAdminLead(lead.id, {
        status,
        staffNote: staffNote.trim() || undefined,
      }),
    onSuccess: () => {
      notifySuccess(`Đã cập nhật trạng thái liên hệ của ${lead.fullName}`);
      void queryClient.invalidateQueries({ queryKey: ["admin", "content", "leads"] });
      onClose();
    },
    onError: (err) => {
      notifyError(err instanceof ApiError ? err.message : "Cập nhật thất bại.");
    },
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
      <div className="w-full max-w-md rounded-2xl border border-line bg-surface-elevated p-5 shadow-xl">
        <div className="flex items-center justify-between border-b border-line pb-3">
          <h3 className="text-base font-bold text-ink">
            Xử lý Lead — {lead.fullName}
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
          <div>
            <label className="mb-1 block text-xs font-semibold text-ink">Trạng thái xử lý</label>
            <Select
              value={status}
              onChange={(e) => setStatus(e.target.value as ContactInquiryStatus)}
            >
              <option value="NEW">Mới tiếp nhận</option>
              <option value="CONTACTED">Đã gọi tư vấn</option>
              <option value="RESOLVED">Đã đặt lịch / Hoàn tất</option>
            </Select>
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold text-ink">Ghi chú của Cố vấn</label>
            <Textarea
              rows={3}
              value={staffNote}
              onChange={(e) => setStaffNote(e.target.value)}
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="ghost" onClick={onClose}>
              Hủy
            </Button>
            <Button type="submit" disabled={mutation.isPending}>
              <CheckCircle2 className="h-4 w-4" />
              Lưu cập nhật
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

