import { ROUTES } from "./routes.config";

export interface NavItem {
  readonly label: string;
  readonly href: string;
  readonly badge?: string;
}

export const SITE_CONFIG = {
  name: "AUTORA",
  tagline: "Chất garage. Tinh thần motorsport. Dịch vụ chuyên nghiệp. Trải nghiệm hiện đại.",
  title: "AUTORA — Sàn thương mại dịch vụ bảo dưỡng, sửa chữa & chăm sóc ô tô tại Việt Nam",
  description:
    "Đặt mua gói bảo dưỡng định kỳ, sửa chữa kỹ thuật, chăm sóc detailing và lốp ô tô với giá niêm yết VNĐ minh bạch tại hệ thống garage xác minh trên toàn quốc.",
  locale: "vi_VN",
  hotline: "1900 6889",
  technicalHotline: "0909 688 900",
  supportEmail: "cskh@autora.vn",
  headquarters: "Tòa nhà Deutsches Haus, 33 Lê Duẩn, Quận 1, TP.HCM",
  workingHours: "07:30 – 19:30 (Thứ 2 – Chủ Nhật)",
  navItems: [
    { label: "Trang chủ", href: ROUTES.HOME },
    { label: "Cửa hàng dịch vụ", href: ROUTES.SERVICES, badge: "HOT" },
    { label: "Hệ thống Garage", href: ROUTES.GARAGES },
    { label: "Bảng giá & Combo", href: ROUTES.PRICING, badge: "-15%" },
    { label: "Cẩm nang chăm xe", href: ROUTES.BLOG },
    { label: "Liên hệ", href: ROUTES.CONTACT },
  ] satisfies readonly NavItem[],
} as const;
