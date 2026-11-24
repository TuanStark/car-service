import { Injectable } from "@nestjs/common";
import type {
  ILlmProvider,
  LlmTurnRequest,
  LlmTurnResponse,
} from "./llm-provider.interface";

function normalizeVi(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .trim();
}

/**
 * Deterministic Smart Local Advisor:
 * Ensures zero-downtime operation in tests, CI, and offline dev environments,
 * exercising real Business Tools and Navigation Actions.
 */
@Injectable()
export class LocalFallbackProvider implements ILlmProvider {
  readonly name = "local-advisor";

  isAvailable(): boolean {
    return true;
  }

  async generateTurn(request: LlmTurnRequest): Promise<LlmTurnResponse> {
    const toolResults = request.messages.filter((m) => m.role === "tool");
    const lastUserMsg =
      [...request.messages].reverse().find((m) => m.role === "user")?.content ??
      "";
    const norm = normalizeVi(lastUserMsg);

    // Step 2: If tools have already been executed in this turn, synthesize answer + structured actions
    if (toolResults.length > 0) {
      const lastTool = toolResults[toolResults.length - 1];
      let parsedData: unknown = null;
      try {
        parsedData = JSON.parse(lastTool.content);
      } catch {
        parsedData = null;
      }

      if (lastTool.toolName === "search_garages" && Array.isArray(parsedData)) {
        if (parsedData.length === 0) {
          return {
            provider: this.name,
            text: "Hiện chưa tìm thấy garage nào khớp đúng khu vực bạn yêu cầu. Bạn có muốn mở danh bạ để xem toàn bộ hệ thống garage của AUTORA không?",
            toolCalls: [],
            proposedActions: [
              {
                type: "navigate",
                target: "garage.search",
                label: "Xem tất cả garage",
                requiresConfirmation: false,
                params: { city: "all" },
              },
            ],
          };
        }

        const first = parsedData[0] as {
          slug: string;
          name: string;
          district: string;
          startingPriceVnd: number;
          rating: number;
        };
        const formattedPrice = `${first.startingPriceVnd
          .toString()
          .replace(/\B(?=(\d{3})+(?!\d))/g, ".")}đ`;

        return {
          provider: this.name,
          text: `Tôi đã tìm thấy ${parsedData.length} garage uy tín phù hợp. Nổi bật nhất là **${first.name}** (${first.district}, đánh giá ${first.rating}/5.0, giá tham khảo từ ${formattedPrice}). Bạn có thể xem chi tiết xưởng hoặc chuyển tới trang lọc garage bên dưới.`,
          toolCalls: [],
          proposedActions: [
            {
              type: "navigate",
              target: "garage.show",
              label: `Xem ${first.name}`,
              requiresConfirmation: false,
              params: { garageSlug: first.slug },
            },
            {
              type: "filter",
              target: "garage.search",
              label: "Mở danh sách garage phù hợp",
              requiresConfirmation: false,
              params: { q: first.district.split(",")[0] },
            },
          ],
        };
      }

      if (lastTool.toolName === "search_services" && Array.isArray(parsedData)) {
        const first = parsedData[0] as
          | { slug: string; name: string; priceVnd: number }
          | undefined;
        if (!first) {
          return {
            provider: this.name,
            text: "Tôi chưa thấy gói dịch vụ nào khớp từ khóa này. Bạn có thể xem toàn bộ danh mục dịch vụ của AUTORA.",
            toolCalls: [],
            proposedActions: [
              {
                type: "navigate",
                target: "service.search",
                label: "Mở cửa hàng dịch vụ",
                requiresConfirmation: false,
                params: {},
              },
            ],
          };
        }
        const formattedPrice = `${first.priceVnd
          .toString()
          .replace(/\B(?=(\d{3})+(?!\d))/g, ".")}đ`;

        return {
          provider: this.name,
          text: `Gói phù hợp nhất cho nhu cầu của bạn là **${first.name}** với giá tham khảo từ **${formattedPrice}**. Tôi có thể mở trang chi tiết gói hoặc điền sẵn bản nháp đặt lịch để bạn kiểm tra.`,
          toolCalls: [],
          proposedActions: [
            {
              type: "navigate",
              target: "service.show",
              label: "Xem chi tiết gói dịch vụ",
              requiresConfirmation: false,
              params: { serviceSlug: first.slug },
            },
            {
              type: "prefill",
              target: "booking.fill_draft",
              label: "Điền sẵn lịch hẹn cho gói này",
              requiresConfirmation: true,
              params: {
                serviceSlug: first.slug,
                garageId: "grg-saigon-motorwerks",
                preferredDate: "2026-11-25",
                preferredTime: "09:30",
              },
            },
          ],
        };
      }

      if (lastTool.toolName === "prepare_booking_draft" && parsedData) {
        const draft = parsedData as {
          garageId: string;
          garageName: string;
          serviceSlug: string;
          serviceName: string;
          preferredDate: string;
          preferredTime: string;
        };
        return {
          provider: this.name,
          text: `Tôi đã chuẩn bị sẵn bản nháp đặt lịch **${draft.serviceName}** tại **${draft.garageName}** vào lúc **${draft.preferredTime} ngày ${draft.preferredDate}**. Vui lòng kiểm tra lại thông tin và tự bấm xác nhận ở bước tiếp theo.`,
          toolCalls: [],
          proposedActions: [
            {
              type: "prefill",
              target: "booking.fill_draft",
              label: "Mở biểu mẫu đã điền sẵn",
              requiresConfirmation: true,
              params: {
                garageId: draft.garageId,
                serviceSlug: draft.serviceSlug,
                preferredDate: draft.preferredDate,
                preferredTime: draft.preferredTime,
              },
            },
          ],
        };
      }

      return {
        provider: this.name,
        text: "Tôi đã kiểm tra dữ liệu hệ thống và sẵn sàng hỗ trợ bạn chọn dịch vụ hoặc garage phù hợp.",
        toolCalls: [],
        proposedActions: [],
      };
    }

    // Step 1: Intent detection -> Tool Calling
    if (norm.includes("dat lich") || norm.includes("hen")) {
      return {
        provider: this.name,
        text: "",
        toolCalls: [
          {
            id: "local_tc_booking",
            name: "prepare_booking_draft",
            arguments: {
              garageId: "grg-saigon-motorwerks",
              serviceSlug: norm.includes("ceramic")
                ? "hieu-chinh-son-phu-ceramic-9h-chuyen-nghiep"
                : "thay-dau-dong-co-tong-hop-5w30",
              preferredDate: "2026-11-25",
              preferredTime: "09:30",
            },
          },
        ],
        proposedActions: [],
      };
    }

    if (
      norm.includes("garage") ||
      norm.includes("gara") ||
      norm.includes("quan 7") ||
      norm.includes("binh thanh") ||
      norm.includes("cau giay") ||
      norm.includes("hai chau") ||
      norm.includes("ha noi") ||
      norm.includes("da nang")
    ) {
      const city = norm.includes("ha noi") || norm.includes("cau giay")
        ? "hn"
        : norm.includes("da nang") || norm.includes("hai chau")
        ? "dn"
        : norm.includes("quan 7") || norm.includes("binh thanh")
        ? "hcm"
        : "all";

      return {
        provider: this.name,
        text: "",
        toolCalls: [
          {
            id: "local_tc_garage",
            name: "search_garages",
            arguments: {
              city,
              query: norm.includes("quan 7")
                ? "Quận 7"
                : norm.includes("cau giay")
                ? "Cầu Giấy"
                : undefined,
            },
          },
        ],
        proposedActions: [],
      };
    }

    return {
      provider: this.name,
      text: "",
      toolCalls: [
        {
          id: "local_tc_service",
          name: "search_services",
          arguments: {
            query: norm.includes("ceramic")
              ? "ceramic"
              : norm.includes("phanh")
              ? "phanh"
              : norm.includes("lop") || norm.includes("thuoc lai")
              ? "3D"
              : "dau",
          },
        },
      ],
      proposedActions: [],
    };
  }
}
