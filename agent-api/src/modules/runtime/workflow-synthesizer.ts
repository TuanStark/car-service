import type {
  AgentAction,
  UiWorkflowPlan,
  UiWorkflowStep,
} from "@/common/contracts/agent.contract";

export interface GarageWorkflowHint {
  readonly slug?: string;
  readonly name?: string;
  readonly cityCode?: string;
  readonly district?: string;
  readonly searchQuery?: string;
}

export interface ServiceWorkflowHint {
  readonly slug?: string;
  readonly name?: string;
  readonly searchQuery?: string;
}

export interface BookingWorkflowHint {
  readonly garageId?: string;
  readonly garageName?: string;
  readonly serviceSlug?: string;
  readonly serviceName?: string;
  readonly preferredDate?: string;
  readonly preferredTime?: string;
  readonly notes?: string;
}

/**
 * Builds step-by-step UI Co-Browsing workflows for garage discovery.
 */
export function buildGarageSearchWorkflow(
  hint: GarageWorkflowHint
): UiWorkflowPlan {
  const steps: UiWorkflowStep[] = [
    {
      id: "step_nav_garages",
      action: "click",
      targetId: "nav.garages",
      fallbackRoute: "/tim-garage",
      narration: "Bước 1: Mở trang Hệ thống Garage trên thanh điều hướng",
      delayMs: 650,
    },
  ];

  const searchText = hint.searchQuery ?? hint.district?.split(",")[0]?.trim();
  if (searchText) {
    steps.push({
      id: "step_type_garage_search",
      action: "type",
      targetId: "garage.filter.search",
      value: searchText,
      narration: `Bước ${steps.length + 1}: Nhập "${searchText}" vào ô tìm kiếm xưởng`,
      delayMs: 550,
    });
  }

  if (hint.cityCode && hint.cityCode !== "all") {
    const cityNames: Record<string, string> = {
      hcm: "TP. Hồ Chí Minh",
      hn: "Hà Nội",
      dn: "Đà Nẵng",
    };
    const cityLabel = cityNames[hint.cityCode] ?? hint.cityCode;
    steps.push({
      id: "step_filter_city",
      action: "click",
      targetId: `garage.filter.city.${hint.cityCode}`,
      narration: `Bước ${steps.length + 1}: Chọn bộ lọc khu vực ${cityLabel}`,
      delayMs: 550,
    });
  }

  if (hint.slug) {
    steps.push({
      id: "step_open_garage_card",
      action: "click",
      targetId: `garage.card.${hint.slug}`,
      fallbackRoute: `/garage/${hint.slug}`,
      narration: `Bước ${steps.length + 1}: Mở chi tiết xưởng ${hint.name ?? hint.slug}`,
      delayMs: 650,
    });
  }

  return {
    title: "Hướng dẫn tìm & lọc Garage phù hợp",
    steps,
  };
}

/**
 * Builds step-by-step UI Co-Browsing workflows for service discovery & cart addition.
 */
export function buildServiceSearchWorkflow(
  hint: ServiceWorkflowHint
): UiWorkflowPlan {
  const steps: UiWorkflowStep[] = [
    {
      id: "step_nav_services",
      action: "click",
      targetId: "nav.services",
      fallbackRoute: "/dich-vu",
      narration: "Bước 1: Mở cửa hàng Sản phẩm & Dịch vụ",
      delayMs: 650,
    },
  ];

  if (hint.searchQuery) {
    steps.push({
      id: "step_type_service_search",
      action: "type",
      targetId: "service.filter.search",
      value: hint.searchQuery,
      narration: `Bước ${steps.length + 1}: Nhập "${hint.searchQuery}" vào ô tìm kiếm dịch vụ`,
      delayMs: 550,
    });
  }

  if (hint.slug) {
    steps.push({
      id: "step_highlight_service",
      action: "highlight",
      targetId: `service.card.${hint.slug}.view`,
      narration: `Bước ${steps.length + 1}: Xem gói ${hint.name ?? "dịch vụ"} phù hợp nhất`,
      delayMs: 750,
    });
    steps.push({
      id: "step_add_service_cart",
      action: "click",
      targetId: `service.card.${hint.slug}.add_to_cart`,
      narration: `Bước ${steps.length + 1}: Bấm thêm gói dịch vụ vào giỏ`,
      delayMs: 650,
    });
  }

  return {
    title: "Hướng dẫn tìm & chọn Gói dịch vụ",
    steps,
  };
}

/**
 * Builds step-by-step UI Co-Browsing workflow for L3 Booking Preparation,
 * always terminating at a safe handoff_confirm step before L4 submission.
 */
export function buildBookingDraftWorkflow(
  hint: BookingWorkflowHint
): UiWorkflowPlan {
  const steps: UiWorkflowStep[] = [];
  const serviceSlug =
    hint.serviceSlug ?? "thay-dau-dong-co-tong-hop-5w30";

  steps.push({
    id: "step_open_services",
    action: "click",
    targetId: "nav.services",
    fallbackRoute: "/dich-vu",
    narration: "Bước 1: Mở cửa hàng dịch vụ để chọn gói chăm sóc xe",
    delayMs: 600,
  });

  steps.push({
    id: "step_add_booking_service",
    action: "click",
    targetId: `service.card.${serviceSlug}.add_to_cart`,
    fallbackRoute: "/thanh-toan",
    narration: `Bước 2: Thêm gói ${hint.serviceName ?? "dịch vụ"} vào giỏ`,
    delayMs: 600,
  });

  steps.push({
    id: "step_open_checkout",
    action: "click",
    targetId: "nav.checkout",
    fallbackRoute: "/thanh-toan",
    narration: "Bước 3: Chuyển tới trang Đặt lịch & Thông tin xe",
    delayMs: 650,
  });

  if (hint.garageId) {
    steps.push({
      id: "step_select_garage",
      action: "select",
      targetId: "checkout.select.garage",
      value: hint.garageId,
      narration: `Bước ${steps.length + 1}: Chọn garage tiếp nhận ${hint.garageName ?? ""}`.trim(),
      delayMs: 550,
    });
  }

  if (hint.preferredDate) {
    steps.push({
      id: "step_input_date",
      action: "type",
      targetId: "checkout.input.date",
      value: hint.preferredDate,
      narration: `Bước ${steps.length + 1}: Điền ngày hẹn ${hint.preferredDate}`,
      delayMs: 500,
    });
  }

  if (hint.preferredTime) {
    steps.push({
      id: "step_select_slot",
      action: "click",
      targetId: `checkout.slot.${hint.preferredTime}`,
      narration: `Bước ${steps.length + 1}: Chọn khung giờ ${hint.preferredTime}`,
      delayMs: 550,
    });
  }

  steps.push({
    id: "step_type_notes",
    action: "type",
    targetId: "checkout.input.notes",
    value: hint.notes ?? "Đặt lịch hẹn chuẩn bị bởi Cố vấn AI AUTORA",
    narration: `Bước ${steps.length + 1}: Nhập ghi chú cho cố vấn dịch vụ`,
    delayMs: 500,
  });

  steps.push({
    id: "step_handoff_confirm",
    action: "handoff_confirm",
    targetId: "checkout.submit_booking",
    narration:
      "Bước cuối: Kiểm tra lại toàn bộ thông tin và bấm nút này để xác nhận đặt lịch",
  });

  return {
    title: "Hướng dẫn đặt lịch dịch vụ từng bước",
    steps,
  };
}

/**
 * Fallback synthesizer used when an LLM provider emits structured actions
 * without authoring a custom UI workflow block.
 */
export function synthesizeWorkflowFromActions(
  actions: readonly AgentAction[],
  collectedToolSnapshots: {
    garage?: GarageWorkflowHint;
    service?: ServiceWorkflowHint;
    booking?: BookingWorkflowHint;
  }
): UiWorkflowPlan | null {
  if (collectedToolSnapshots.booking) {
    return buildBookingDraftWorkflow(collectedToolSnapshots.booking);
  }
  if (collectedToolSnapshots.garage) {
    return buildGarageSearchWorkflow(collectedToolSnapshots.garage);
  }
  if (collectedToolSnapshots.service) {
    return buildServiceSearchWorkflow(collectedToolSnapshots.service);
  }

  const primary = actions[0];
  if (!primary) return null;

  switch (primary.target) {
    case "booking.fill_draft":
    case "booking.start":
      return buildBookingDraftWorkflow({
        garageId: primary.params.garageId
          ? String(primary.params.garageId)
          : undefined,
        serviceSlug: primary.params.serviceSlug
          ? String(primary.params.serviceSlug)
          : undefined,
        preferredDate: primary.params.preferredDate
          ? String(primary.params.preferredDate)
          : undefined,
        preferredTime: primary.params.preferredTime
          ? String(primary.params.preferredTime)
          : undefined,
        notes: primary.params.notes ? String(primary.params.notes) : undefined,
      });
    case "garage.show":
      return buildGarageSearchWorkflow({
        slug: primary.params.garageSlug
          ? String(primary.params.garageSlug)
          : undefined,
      });
    case "garage.search":
      return buildGarageSearchWorkflow({
        cityCode: primary.params.city ? String(primary.params.city) : undefined,
        searchQuery: primary.params.district
          ? String(primary.params.district)
          : primary.params.q
          ? String(primary.params.q)
          : undefined,
      });
    case "service.show":
      return buildServiceSearchWorkflow({
        slug: primary.params.serviceSlug
          ? String(primary.params.serviceSlug)
          : undefined,
      });
    case "service.search":
      return buildServiceSearchWorkflow({
        searchQuery: primary.params.q ? String(primary.params.q) : undefined,
      });
    default:
      return null;
  }
}

