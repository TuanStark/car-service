import {
  apiData,
  apiPaginated,
  type PaginatedResponse,
} from "@/infrastructure/api/api-client";

export type StaffRoleCode = "admin" | "ops_staff" | "partner_staff" | "technician";
export type TechnicianSpecialty =
  | "GENERAL_MAINT"
  | "POWERTRAIN"
  | "CHASSIS_BRAKE"
  | "ELECTRICAL"
  | "DETAILING"
  | "TIRES";
export type TechnicianSkillLevel = "JUNIOR" | "SENIOR" | "MASTER";

export interface StaffMemberDto {
  readonly id: string;
  readonly email: string;
  readonly fullName: string;
  readonly phone: string | null;
  readonly status: string;
  readonly roles: readonly { readonly code: string; readonly name: string }[];
  readonly technicianProfile: {
    readonly primaryGarageId: string | null;
    readonly primaryGarageName: string | null;
    readonly specialty: TechnicianSpecialty;
    readonly skillLevel: TechnicianSkillLevel;
    readonly laborCommissionPct: number;
    readonly hourlyRateVnd: number;
    readonly isActive: boolean;
  } | null;
  readonly performance: {
    readonly completedBookingsCount: number;
    readonly inProgressBookingsCount: number;
    readonly avgDurationMinutes: number | null;
    readonly estimatedCommissionVnd: number;
    readonly activeToolCount: number;
  };
  readonly createdAt: string;
}

export function fetchAdminStaff(params?: {
  page?: number;
  limit?: number;
  roleCode?: StaffRoleCode;
  garageId?: string;
  search?: string;
}): Promise<PaginatedResponse<StaffMemberDto>> {
  const qs = new URLSearchParams({
    page: String(params?.page ?? 1),
    limit: String(params?.limit ?? 25),
  });
  if (params?.roleCode) qs.set("roleCode", params.roleCode);
  if (params?.garageId) qs.set("garageId", params.garageId);
  if (params?.search?.trim()) qs.set("search", params.search.trim());
  return apiPaginated<StaffMemberDto>(`/admin/staff?${qs.toString()}`);
}

export function createAdminStaff(payload: {
  email: string;
  fullName: string;
  phone?: string;
  password: string;
  roleCode: StaffRoleCode;
  primaryGarageId?: string;
  specialty?: TechnicianSpecialty;
  skillLevel?: TechnicianSkillLevel;
  laborCommissionPct?: number;
  hourlyRateVnd?: number;
}): Promise<StaffMemberDto> {
  return apiData<StaffMemberDto>("/admin/staff", {
    method: "POST",
    body: payload,
  });
}

export function updateTechnicianProfile(
  userId: string,
  payload: {
    primaryGarageId?: string | null;
    specialty?: TechnicianSpecialty;
    skillLevel?: TechnicianSkillLevel;
    laborCommissionPct?: number;
    hourlyRateVnd?: number;
    isActive?: boolean;
  }
): Promise<StaffMemberDto> {
  return apiData<StaffMemberDto>(`/admin/staff/${userId}/technician`, {
    method: "PATCH",
    body: payload,
  });
}

export function toggleStaffAccountStatus(
  userId: string,
  status: "ACTIVE" | "SUSPENDED"
): Promise<StaffMemberDto> {
  return apiData<StaffMemberDto>(`/admin/staff/${userId}/status`, {
    method: "PATCH",
    body: { status },
  });
}

