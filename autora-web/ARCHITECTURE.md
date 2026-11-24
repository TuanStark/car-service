# AUTORA — Kiến trúc Frontend Thương mại Điện tử Dịch vụ Ô tô (Service E-Commerce Architecture)

Tài liệu mô tả kiến trúc kỹ thuật của nền tảng thương mại điện tử dịch vụ ô tô **AUTORA** (xây dựng bằng Next.js App Router, TypeScript, Tailwind CSS), được thiết kế chuẩn mực theo mô hình **Multi-Page Service E-Commerce & Multi-Vendor Marketplace**.

---

## 1. Cấu trúc Trang Thương mại Điện tử Đa tuyến (Multi-Route E-Commerce Sitemap)

Khác với một trang Landing Page đơn tuyến, AUTORA được tổ chức thành các phân khu thương mại điện tử thực thụ:

- **`/` (Storefront Homepage)**:
  - Thanh tìm kiếm chọn dịch vụ theo kiểu dáng xe (`Fitment Finder`), cụm 3 Banner khuyến mãi thương mại, Lưới danh mục dịch vụ, Lưới 8 sản phẩm/gói dịch vụ bán chạy có lọc theo tab, Gian hàng Garage nổi bật, Danh bạ xưởng theo tỉnh thành và Chuyên mục Cẩm nang chăm xe.
- **`/dich-vu` (PLP — Product/Service Listing Page)**:
  - Bộ lọc phân tầng bên trái (Từ khóa/SKU, Danh mục, Khoảng giá VNĐ, Kiểu dáng xe tương thích, Khuyến mãi), thanh công cụ sắp xếp (`Đặt nhiều nhất`, `Giá tăng/giảm dần`, `Đánh giá cao`, `Mức giảm giá`) và Lưới thẻ gói dịch vụ chuẩn E-commerce.
- **`/dich-vu/[slug]` (PDP — Product/Service Detail Page)**:
  - Thư viện ảnh, mã SKU, giá gốc & giá ưu đãi VNĐ, chọn chi nhánh Garage thực hiện, tùy chỉnh số lượng, nút **Thêm vào giỏ dịch vụ** & **Đặt lịch ngay**, hệ thống Tab thông số kỹ thuật / quy trình thực hiện / danh sách xưởng áp dụng, và Gợi ý gói dịch vụ mua kèm.
- **`/tim-garage` & `/garage/[slug]` (Multi-Vendor Garage Storefronts)**:
  - Danh bạ hệ thống xưởng xác minh và Trang gian hàng riêng của từng Garage hiển thị năng lực cầu nâng, chứng chỉ, đánh giá khách hàng và toàn bộ gói dịch vụ niêm yết tại xưởng đó.
- **`/bang-gia` (Combo Milestones & Reference Price Matrix)**:
  - Các gói Combo bảo dưỡng định kỳ (5.000 km, 20.000 km, 40.000 km) và bảng đối chiếu biểu phí toàn diện.
- **`/gio-hang` & `MiniCartDrawer` (Cart & Coupon Engine)**:
  - Giỏ dịch vụ đồng bộ `localStorage`, tăng/giảm số lượng, áp dụng mã giảm giá (`AUTORA10`) và tính tổng chi phí VNĐ tức thời.
- **`/thanh-toan` (Checkout & Workshop Slot Scheduling)**:
  - Quy trình 3 bước: Chọn chi nhánh & Khung giờ tiếp nhận → Khai báo thông tin xe (Biển số, ODO) → Chọn phương thức thanh toán (Thanh toán tại xưởng sau nghiệm thu, VietQR, VNPAY) & Xuất mã phiếu hẹn.
- **`/yeu-thich` & `/tai-khoan` (Wishlist, Order Tracking & My Vehicle Fitment)**:
  - Quản lý danh sách dịch vụ yêu thích, cập nhật hồ sơ phương tiện cá nhân trên Header và tra cứu Sổ bảo dưỡng điện tử.
- **`/tin-tuc`, `/tin-tuc/[slug]` & `/lien-he`**:
  - Chuyên trang kiến thức kỹ thuật ô tô và cổng liên hệ / đăng ký mở gian hàng Garage đối tác.

---

## 2. Phân tầng Thư mục Clean Feature-Sliced (`src/`)

```text
src/
├── app/                          # Next.js App Router (11 tuyến trang E-Commerce độc lập)
├── config/                       # Cấu hình đường dẫn (routes.config.ts) & thương hiệu (site.config.ts)
├── core/                         # Tầng tiện ích thuần khiết (VND/Date formatters, chuẩn hóa tiếng Việt)
├── components/
│   ├── layout/                   # Header 3 tầng chuẩn E-commerce (Topbar + Search/Tools + Mega-Nav), Breadcrumbs, Footer
│   └── ui/                       # Hệ thống UI Primitives (Button, Badge, Input, Dialog)
└── features/                     # Các miền nghiệp vụ E-Commerce đóng gói độc lập
    ├── catalog/                  # SKU sản phẩm/dịch vụ, Combo mốc km, Bộ lọc đa chiều, ProductCard, QuickViewModal, PLP, PDP
    ├── garages/                  # Dữ liệu đối tác xưởng, Bộ lọc khu vực, GarageStoreCard, GarageDirectory
    ├── cart/                     # StoreContext (Cart, Coupon, Wishlist, Orders, ActiveVehicle) & MiniCartDrawer
    └── content/                  # Hệ thống bài viết Cẩm nang chăm xe
```
