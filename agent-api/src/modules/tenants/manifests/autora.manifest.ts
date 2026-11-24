import type { SiteManifest } from "@/common/contracts/agent.contract";

export const AUTORA_TENANT_MANIFEST: SiteManifest = {
  tenantId: "autora-vn",
  brandName: "AUTORA Car Service Vietnam",
  domain: "automotive_service",
  language: "vi",
  persona:
    "Bạn là Cố vấn Dịch vụ Số (Digital Service Advisor) của AUTORA tại Việt Nam. Bạn tư vấn chăm sóc ô tô bằng tiếng Việt tự nhiên, thân thiện, minh bạch giá bằng VNĐ (ví dụ: 450.000đ), luôn ưu tiên an toàn kỹ thuật, không bịa đặt số liệu và luôn nhắc người dùng kiểm tra kỹ trước khi xác nhận đặt lịch.",
  allowedOrigins: [
    "http://localhost:3000",
    "http://localhost:3030",
    "https://autora.vn",
  ],
  tools: [
    {
      name: "search_services",
      description:
        "Tìm kiếm các gói dịch vụ bảo dưỡng, sửa chữa, detailing, lốp và giá tham khảo VNĐ.",
      allowedRoles: ["guest", "customer", "partner_staff"],
    },
    {
      name: "search_garages",
      description:
        "Tìm kiếm danh sách garage uy tín theo thành phố (hcm/hn/dn), quận hoặc dịch vụ.",
      allowedRoles: ["guest", "customer", "partner_staff"],
    },
    {
      name: "compare_garages",
      description:
        "So sánh chi tiết 2 hoặc nhiều garage về giá khởi điểm, đánh giá và dịch vụ.",
      allowedRoles: ["guest", "customer", "partner_staff"],
    },
    {
      name: "check_availability",
      description:
        "Kiểm tra khung giờ cầu nâng còn trống tại một garage theo ngày (YYYY-MM-DD).",
      allowedRoles: ["guest", "customer", "partner_staff"],
    },
    {
      name: "prepare_booking_draft",
      description:
        "Tạo bản nháp đặt lịch (L3) đã điền sẵn dịch vụ, garage, thời gian và thông tin xe để người dùng tự kiểm tra xác nhận.",
      allowedRoles: ["guest", "customer", "partner_staff"],
    },
    {
      name: "get_my_vehicles",
      description:
        "Lấy danh sách xe và số ODO của chính chủ xe đang đăng nhập.",
      allowedRoles: ["customer"],
    },
    {
      name: "get_my_orders",
      description:
        "Xem lịch sử bảo dưỡng và lịch hẹn sắp tới của chính chủ xe đang đăng nhập.",
      allowedRoles: ["customer"],
    },
  ],
  navigationContract: [
    {
      target: "garage.search",
      description: "Chuyển tới trang tìm garage với bộ lọc khu vực hoặc dịch vụ",
      allowedParams: ["city", "district", "service", "q"],
      requiresConfirmation: false,
    },
    {
      target: "garage.show",
      description: "Mở trang chi tiết gian hàng của một garage cụ thể",
      allowedParams: ["garageSlug"],
      requiresConfirmation: false,
    },
    {
      target: "service.search",
      description: "Chuyển tới trang cửa hàng dịch vụ với bộ lọc danh mục hoặc từ khóa",
      allowedParams: ["category", "q", "vehicleType"],
      requiresConfirmation: false,
    },
    {
      target: "service.show",
      description: "Mở trang chi tiết gói dịch vụ cụ thể",
      allowedParams: ["serviceSlug"],
      requiresConfirmation: false,
    },
    {
      target: "booking.start",
      description: "Mở luồng đặt lịch cho gói dịch vụ đã chọn",
      allowedParams: ["serviceSlug", "garageId"],
      requiresConfirmation: false,
    },
    {
      target: "booking.fill_draft",
      description: "Điền sẵn biểu mẫu đặt lịch để người dùng kiểm tra và tự bấm xác nhận",
      allowedParams: [
        "garageId",
        "serviceSlug",
        "vehicleBrand",
        "vehicleModel",
        "preferredDate",
        "preferredTime",
        "notes",
      ],
      requiresConfirmation: true,
    },
  ],
  uiTargets: [
    {
      targetPattern: "nav.garages",
      route: "*",
      interactions: ["click"],
      risk: "safe",
      description: "Nút Tìm gara trên thanh điều hướng",
    },
    {
      targetPattern: "nav.services",
      route: "*",
      interactions: ["click"],
      risk: "safe",
      description: "Nút Tìm dịch vụ trên thanh điều hướng",
    },
    {
      targetPattern: "nav.cart",
      route: "*",
      interactions: ["click"],
      risk: "safe",
      description: "Nút mở giỏ dịch vụ",
    },
    {
      targetPattern: "nav.checkout",
      route: "*",
      interactions: ["click"],
      risk: "safe",
      description: "Nút Tiến hành đặt lịch / thanh toán trong giỏ dịch vụ",
    },
    {
      targetPattern: "garage.filter.search",
      route: "/tim-garage",
      interactions: ["type", "focus"],
      risk: "safe",
      description: "Ô tìm kiếm tên xưởng hoặc quận huyện",
    },
    {
      targetPattern: "garage.filter.city.*",
      route: "/tim-garage",
      interactions: ["click"],
      risk: "safe",
      description: "Nút chọn tỉnh/thành phố (hcm, hn, dn, all)",
    },
    {
      targetPattern: "garage.filter.category.*",
      route: "/tim-garage",
      interactions: ["click"],
      risk: "safe",
      description: "Nút chọn chuyên môn kỹ thuật của garage",
    },
    {
      targetPattern: "garage.card.*",
      route: "/tim-garage",
      interactions: ["click", "focus"],
      risk: "safe",
      description: "Nút Xem cửa hàng xưởng theo slug garage",
    },
    {
      targetPattern: "service.filter.search",
      route: "/dich-vu",
      interactions: ["type", "focus"],
      risk: "safe",
      description: "Ô tìm kiếm từ khóa dịch vụ",
    },
    {
      targetPattern: "service.filter.category.*",
      route: "/dich-vu",
      interactions: ["click"],
      risk: "safe",
      description: "Nút lọc danh mục dịch vụ",
    },
    {
      targetPattern: "service.card.*.add_to_cart",
      route: "/dich-vu",
      interactions: ["click"],
      risk: "safe",
      description: "Nút Thêm vào giỏ dịch vụ của gói theo slug",
    },
    {
      targetPattern: "service.card.*.view",
      route: "/dich-vu",
      interactions: ["click", "focus"],
      risk: "safe",
      description: "Link xem chi tiết gói dịch vụ theo slug",
    },
    {
      targetPattern: "checkout.select.garage",
      route: "/thanh-toan",
      interactions: ["select", "focus"],
      risk: "safe",
      description: "Dropdown chọn garage tiếp nhận",
    },
    {
      targetPattern: "checkout.input.date",
      route: "/thanh-toan",
      interactions: ["type", "focus"],
      risk: "safe",
      description: "Ô chọn ngày hẹn (YYYY-MM-DD)",
    },
    {
      targetPattern: "checkout.slot.*",
      route: "/thanh-toan",
      interactions: ["click"],
      risk: "safe",
      description: "Nút chọn khung giờ đưa xe đến (vd: 09:30)",
    },
    {
      targetPattern: "checkout.input.notes",
      route: "/thanh-toan",
      interactions: ["type", "focus"],
      risk: "safe",
      description: "Ô nhập ghi chú triệu chứng kỹ thuật",
    },
    {
      targetPattern: "checkout.submit_booking",
      route: "/thanh-toan",
      interactions: ["focus"],
      risk: "confirm_only",
      description:
        "Nút Xác nhận đặt lịch dịch vụ (chỉ highlight & bàn giao để khách tự bấm)",
    },
  ],
};

