"use client";

import React, { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Lock, Plus, Search, Settings2, Unlock, Wrench, X } from "lucide-react";
import { ApiError } from "@/infrastructure/api/api-client";
import { fetchAdminGarages } from "@/features/garages/api";
import { useDebouncedValue } from "@/shared/hooks/use-debounced-value";
import { Button } from "@/shared/ui/button";
import { Card } from "@/shared/ui/card";
import {
  EmptyState,
  ErrorState,
  Pagination,
  TableSkeleton,
} from "@/shared/ui/feedback";
import { Input, Select } from "@/shared/ui/input";
import { StatusPill } from "@/shared/ui/status-badge";
import { useToast } from "@/shared/ui/toast-provider";
import { formatVnd } from "@/shared/utils/format";
import {
  createAdminStaff,
  fetchAdminStaff,
  type StaffMemberDto,
  type StaffRoleCode,
  type TechnicianSkillLevel,
  type TechnicianSpecialty,
  toggleStaffAccountStatus,
  updateTechnicianProfile,
} from "../api";

const SPECIALTY_LABELS: Record<TechnicianSpecialty, string> = {
  GENERAL_MAINT: "Bảo dưỡng tổng quát",
  POWERTRAIN: "Động cơ & Hộp số",
  CHASSIS_BRAKE: "Gầm, Lái & Phanh",
  ELECTRICAL: "Điện & Chẩn đoán",
  DETAILING: "Detailing & Sơn phủ",
  TIRES: "Lốp & Cân bằng động",
};

const SKILL_LABELS: Record<TechnicianSkillLevel, string> = {
  JUNIOR: "Bậc 1 (Junior)",
  SENIOR: "Bậc 2 (Senior)",
  MASTER: "KTV Trưởng (Master)",
};

export function StaffView() {
  const [page, setPage] = useState(1);
  const [roleCode, setRoleCode] = useState<StaffRoleCode | "">("");
  const [search, setSearch] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<StaffMemberDto | null>(null);

  const debouncedSearch = useDebouncedValue(search, 300);
  const queryClient = useQueryClient();
  const { notifySuccess, notifyError } = useToast();

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: "ACTIVE" | "SUSPENDED" }) =>
      toggleStaffAccountStatus(id, status),
    onSuccess: (s) => {
      notifySuccess(
        s.status === "SUSPENDED"
          ? `Đã khóa tài khoản ${s.email} & thu hồi phiên đăng nhập`
          : `Đã mở khóa tài khoản ${s.email}`
      );
      void queryClient.invalidateQueries({ queryKey: ["admin", "staff"] });
    },
    onError: (err) => {
      notifyError(err instanceof ApiError ? err.message : "Thao tác thất bại.");
    },
  });

  const { data: garagesData } = useQuery({
    queryKey: ["admin", "garages", "staff"],
    queryFn: () => fetchAdminGarages({ page: 1, limit: 50 }),
  });
  const garages = garagesData?.items ?? [];

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ["admin", "staff", { page, roleCode, search: debouncedSearch }],
    queryFn: () =>
      fetchAdminStaff({
        page,
        limit: 20,
        roleCode: roleCode || undefined,
        search: debouncedSearch || undefined,
      }),
  });

  const items = data?.items ?? [];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-ink">
            Nhân sự & Kỹ thuật viên (Workforce)
          </h1>
          <p className="text-xs text-ink-secondary">
            Quản lý đội ngũ Cố vấn dịch vụ (SA), Kỹ thuật viên (KTV), chuyên môn và hoa hồng công thợ
          </p>
        </div>

        <Button size="md" onClick={() => setCreateOpen(true)}>
          <Plus className="h-4 w-4" />
          Thêm nhân sự / KTV
        </Button>
      </div>

      {/* Filter Bar */}
      <Card className="p-4">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-12">
          <div className="relative md:col-span-7">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-muted" />
            <Input
              className="pl-9"
              placeholder="Tìm theo họ tên, email, số điện thoại..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
            />
          </div>
          <div className="md:col-span-5">
            <Select
              value={roleCode}
              onChange={(e) => {
                setRoleCode(e.target.value as StaffRoleCode | "");
                setPage(1);
              }}
            >
              <option value="">Tất cả vai trò</option>
              <option value="technician">Kỹ thuật viên (KTV)</option>
              <option value="ops_staff">Cố vấn dịch vụ (SA)</option>
              <option value="partner_staff">Quản lý Garage đối tác</option>
              <option value="admin">Quản trị viên hệ thống</option>
            </Select>
          </div>
        </div>
      </Card>

      <Card className="overflow-hidden">
        {isLoading ? (
          <TableSkeleton rows={5} cols={6} />
        ) : isError ? (
          <ErrorState
            message={
              error instanceof ApiError
                ? error.message
                : "Không thể tải danh sách nhân sự."
            }
            onRetry={() => void refetch()}
          />
        ) : items.length === 0 ? (
          <EmptyState
            title="Chưa có nhân sự phù hợp"
            description="Hãy thêm tài khoản nhân sự hoặc kỹ thuật viên mới."
          />
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="border-b border-line bg-surface-subtle text-[11px] font-bold uppercase tracking-wider text-ink-secondary">
                  <tr>
                    <th className="px-4 py-3">Nhân sự & Vai trò</th>
                    <th className="px-4 py-3">Chuyên môn & Garage chính</th>
                    <th className="px-4 py-3 text-right">Hoa hồng / Lương giờ</th>
                    <th className="px-4 py-3 text-right">Hiệu suất RO</th>
                    <th className="px-4 py-3 text-right">Hoa hồng tạm tính</th>
                    <th className="px-4 py-3 text-right">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {items.map((staff) => (
                    <tr key={staff.id} className="hover:bg-surface-subtle/60">
                      <td className="px-4 py-3">
                        <div className="font-semibold text-ink">{staff.fullName}</div>
                        <div className="text-[11px] text-ink-secondary">
                          {staff.email} {staff.phone ? `• ${staff.phone}` : ""}
                        </div>
                        <div className="mt-1 flex flex-wrap gap-1">
                          {staff.roles.map((r) => (
                            <StatusPill
                              key={r.code}
                              label={r.name}
                              tone={r.code === "technician" ? "info" : "neutral"}
                            />
                          ))}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        {staff.technicianProfile ? (
                          <div>
                            <div className="font-semibold text-ink">
                              {SPECIALTY_LABELS[staff.technicianProfile.specialty]}
                            </div>
                            <div className="text-[11px] text-ink-secondary">
                              {SKILL_LABELS[staff.technicianProfile.skillLevel]} •{" "}
                              {staff.technicianProfile.primaryGarageName ?? "Chưa gán garage"}
                            </div>
                          </div>
                        ) : (
                          <span className="text-ink-muted">Nhân sự văn phòng / SA</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right font-mono tabular-nums">
                        {staff.technicianProfile ? (
                          <div>
                            <div className="font-bold text-brand">
                              {staff.technicianProfile.laborCommissionPct}%
                            </div>
                            <div className="text-[11px] text-ink-muted">
                              {formatVnd(staff.technicianProfile.hourlyRateVnd)}/giờ
                            </div>
                          </div>
                        ) : (
                          "—"
                        )}
                      </td>
                      <td className="px-4 py-3 text-right tabular-nums">
                        <div className="font-semibold text-ink">
                          {staff.performance.completedBookingsCount} hoàn tất /{" "}
                          {staff.performance.inProgressBookingsCount} đang làm
                        </div>
                        <div className="text-[11px] text-ink-muted">
                          {staff.performance.avgDurationMinutes !== null
                            ? `TB ${staff.performance.avgDurationMinutes} phút/RO`
                            : "Chưa có dữ liệu TG"}
                          {staff.performance.activeToolCount > 0 && (
                            <span className="ml-1 inline-flex items-center gap-0.5 text-warning">
                              <Wrench className="h-3 w-3" />
                              Đang mượn {staff.performance.activeToolCount}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right font-mono font-bold tabular-nums text-success">
                        {formatVnd(staff.performance.estimatedCommissionVnd)}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="inline-flex items-center gap-1.5">
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={() => setEditTarget(staff)}
                          >
                            <Settings2 className="h-3.5 w-3.5" />
                            Cấu hình KTV
                          </Button>
                          {!staff.roles.some((r) => r.code === "admin") && (
                            <Button
                              size="sm"
                              variant="ghost"
                              disabled={statusMutation.isPending}
                              onClick={() =>
                                statusMutation.mutate({
                                  id: staff.id,
                                  status:
                                    staff.status === "ACTIVE"
                                      ? "SUSPENDED"
                                      : "ACTIVE",
                                })
                              }
                            >
                              {staff.status === "ACTIVE" ? (
                                <>
                                  <Lock className="h-3.5 w-3.5 text-danger" />
                                  Khóa
                                </>
                              ) : (
                                <>
                                  <Unlock className="h-3.5 w-3.5 text-success" />
                                  Mở khóa
                                </>
                              )}
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {data?.meta && (
              <div className="border-t border-line px-4 py-3">
                <Pagination meta={data.meta} onPageChange={setPage} />
              </div>
            )}
          </>
        )}
      </Card>

      {createOpen && (
        <CreateStaffModal
          garages={garages}
          onClose={() => setCreateOpen(false)}
        />
      )}

      {editTarget && (
        <EditTechnicianModal
          staff={editTarget}
          garages={garages}
          onClose={() => setEditTarget(null)}
        />
      )}
    </div>
  );
}

function CreateStaffModal({
  garages,
  onClose,
}: {
  readonly garages: readonly { id: string; name: string }[];
  readonly onClose: () => void;
}) {
  const queryClient = useQueryClient();
  const { notifySuccess, notifyError } = useToast();
  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("AutoraStaff@2026");
  const [roleCode, setRoleCode] = useState<StaffRoleCode>("technician");
  const [primaryGarageId, setPrimaryGarageId] = useState(garages[0]?.id ?? "");
  const [specialty, setSpecialty] = useState<TechnicianSpecialty>("GENERAL_MAINT");
  const [skillLevel, setSkillLevel] = useState<TechnicianSkillLevel>("SENIOR");
  const [laborCommissionPct, setLaborCommissionPct] = useState("15");

  const mutation = useMutation({
    mutationFn: () =>
      createAdminStaff({
        email: email.trim(),
        fullName: fullName.trim(),
        phone: phone.trim() || undefined,
        password,
        roleCode,
        primaryGarageId: primaryGarageId || undefined,
        specialty: roleCode === "technician" ? specialty : undefined,
        skillLevel: roleCode === "technician" ? skillLevel : undefined,
        laborCommissionPct:
          roleCode === "technician" ? Number(laborCommissionPct) : undefined,
      }),
    onSuccess: (s) => {
      notifySuccess(`Đã tạo tài khoản ${s.fullName} (${s.email})`);
      void queryClient.invalidateQueries({ queryKey: ["admin", "staff"] });
      onClose();
    },
    onError: (err) => {
      notifyError(err instanceof ApiError ? err.message : "Tạo nhân sự thất bại.");
    },
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
      <div className="w-full max-w-lg rounded-2xl border border-line bg-surface-elevated p-5 shadow-xl">
        <div className="flex items-center justify-between border-b border-line pb-3">
          <h3 className="text-base font-bold text-ink">Thêm Nhân sự / Kỹ thuật viên</h3>
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
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs font-semibold text-ink">Họ tên *</label>
              <Input required value={fullName} onChange={(e) => setFullName(e.target.value)} />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-ink">Email *</label>
              <Input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs font-semibold text-ink">Số điện thoại</label>
              <Input value={phone} onChange={(e) => setPhone(e.target.value)} />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-ink">Vai trò *</label>
              <Select
                value={roleCode}
                onChange={(e) => setRoleCode(e.target.value as StaffRoleCode)}
              >
                <option value="technician">Kỹ thuật viên (KTV)</option>
                <option value="ops_staff">Cố vấn dịch vụ (SA)</option>
                <option value="partner_staff">Quản lý Garage</option>
              </Select>
            </div>
          </div>

          <div>
            <label className="mb-1 block text-xs font-semibold text-ink">Mật khẩu khởi tạo *</label>
            <Input
              type="text"
              required
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          {roleCode === "technician" && (
            <div className="grid grid-cols-2 gap-3 rounded-lg border border-line bg-surface-subtle p-3">
              <div>
                <label className="mb-1 block text-xs font-semibold text-ink">Garage chính</label>
                <Select
                  value={primaryGarageId}
                  onChange={(e) => setPrimaryGarageId(e.target.value)}
                >
                  {garages.map((g) => (
                    <option key={g.id} value={g.id}>
                      {g.name}
                    </option>
                  ))}
                </Select>
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold text-ink">Chuyên môn</label>
                <Select
                  value={specialty}
                  onChange={(e) => setSpecialty(e.target.value as TechnicianSpecialty)}
                >
                  {Object.entries(SPECIALTY_LABELS).map(([k, l]) => (
                    <option key={k} value={k}>
                      {l}
                    </option>
                  ))}
                </Select>
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold text-ink">Tay nghề</label>
                <Select
                  value={skillLevel}
                  onChange={(e) => setSkillLevel(e.target.value as TechnicianSkillLevel)}
                >
                  {Object.entries(SKILL_LABELS).map(([k, l]) => (
                    <option key={k} value={k}>
                      {l}
                    </option>
                  ))}
                </Select>
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold text-ink">Hoa hồng (%)</label>
                <Input
                  type="number"
                  min={0}
                  max={80}
                  value={laborCommissionPct}
                  onChange={(e) => setLaborCommissionPct(e.target.value)}
                />
              </div>
            </div>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="ghost" onClick={onClose}>
              Hủy
            </Button>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? "Đang tạo..." : "Tạo nhân sự"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

function EditTechnicianModal({
  staff,
  garages,
  onClose,
}: {
  readonly staff: StaffMemberDto;
  readonly garages: readonly { id: string; name: string }[];
  readonly onClose: () => void;
}) {
  const queryClient = useQueryClient();
  const { notifySuccess, notifyError } = useToast();
  const [primaryGarageId, setPrimaryGarageId] = useState(
    staff.technicianProfile?.primaryGarageId ?? garages[0]?.id ?? ""
  );
  const [specialty, setSpecialty] = useState<TechnicianSpecialty>(
    staff.technicianProfile?.specialty ?? "GENERAL_MAINT"
  );
  const [skillLevel, setSkillLevel] = useState<TechnicianSkillLevel>(
    staff.technicianProfile?.skillLevel ?? "SENIOR"
  );
  const [laborCommissionPct, setLaborCommissionPct] = useState(
    String(staff.technicianProfile?.laborCommissionPct ?? 15)
  );
  const [hourlyRateVnd, setHourlyRateVnd] = useState(
    String(staff.technicianProfile?.hourlyRateVnd ?? 80000)
  );

  const mutation = useMutation({
    mutationFn: () =>
      updateTechnicianProfile(staff.id, {
        primaryGarageId: primaryGarageId || null,
        specialty,
        skillLevel,
        laborCommissionPct: Number(laborCommissionPct),
        hourlyRateVnd: Number(hourlyRateVnd),
      }),
    onSuccess: () => {
      notifySuccess(`Đã cập nhật hồ sơ KTV ${staff.fullName}`);
      void queryClient.invalidateQueries({ queryKey: ["admin", "staff"] });
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
            Cấu hình KTV — {staff.fullName}
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
            <label className="mb-1 block text-xs font-semibold text-ink">Garage chính</label>
            <Select
              value={primaryGarageId}
              onChange={(e) => setPrimaryGarageId(e.target.value)}
            >
              {garages.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.name}
                </option>
              ))}
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs font-semibold text-ink">Chuyên môn</label>
              <Select
                value={specialty}
                onChange={(e) => setSpecialty(e.target.value as TechnicianSpecialty)}
              >
                {Object.entries(SPECIALTY_LABELS).map(([k, l]) => (
                  <option key={k} value={k}>
                    {l}
                  </option>
                ))}
              </Select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-ink">Cấp bậc</label>
              <Select
                value={skillLevel}
                onChange={(e) => setSkillLevel(e.target.value as TechnicianSkillLevel)}
              >
                {Object.entries(SKILL_LABELS).map(([k, l]) => (
                  <option key={k} value={k}>
                    {l}
                  </option>
                ))}
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs font-semibold text-ink">Hoa hồng (%)</label>
              <Input
                type="number"
                min={0}
                max={80}
                step="0.5"
                value={laborCommissionPct}
                onChange={(e) => setLaborCommissionPct(e.target.value)}
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-ink">Đơn giá giờ công</label>
              <Input
                type="number"
                min={0}
                value={hourlyRateVnd}
                onChange={(e) => setHourlyRateVnd(e.target.value)}
              />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="ghost" onClick={onClose}>
              Hủy
            </Button>
            <Button type="submit" disabled={mutation.isPending}>
              Lưu cấu hình
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

