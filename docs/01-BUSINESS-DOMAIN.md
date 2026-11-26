# 01. Tài liệu Nghiệp vụ & Domain Rules — AUTORA (`car-service`)

Tài liệu này mô tả toàn bộ **bài toán kinh doanh, các thực thể cốt lõi, luồng nghiệp vụ và quy tắc bất biến (invariants)** của hệ sinh thái dịch vụ ô tô **AUTORA**. Mọi thay đổi về code trên `autora-web`, `autora-api`, `agent-api` và `agent-sdk` đều phải tuân thủ các quy tắc trong tài liệu này.

---

## 1. Tổng quan mô hình kinh doanh

**AUTORA** là nền tảng **Thương mại Điện tử Dịch vụ Ô tô & Sàn kết nối Garage Đa nhà cung cấp (Multi-Vendor Service E-Commerce)** tại Việt Nam (tập trung ở 3 khu vực chính: `TP.HCM` (`hcm`), `Hà Nội` (`hn`), `Đà Nẵng` (`dn`)).

Khác với website giới thiệu garage truyền thống, AUTORA chuẩn hóa **dịch vụ sửa chữa/bảo dưỡng thành các gói SKU niêm yết giá VNĐ minh bạch**, cho phép chủ xe:
1. Tìm gói dịch vụ phù hợp theo kiểu dáng xe (`all`, `sedan`, `suv`, `mpv`, `ev`) hoặc mốc ODO.
2. So sánh và chọn Garage đối tác đã xác minh (`verified`) gần khu vực.
3. Thêm nhiều gói dịch vụ vào **Giỏ dịch vụ**, áp dụng mã ưu đãi, chọn khung giờ cầu nâng và đặt lịch hẹn.
4. Theo dõi lịch sử chăm sóc xe trong **Sổ bảo dưỡng điện tử**.
5. Nhận tư vấn và hướng dẫn thao tác từng bước trên giao diện thông qua **Cố vấn Dịch vụ Số (AI Co-Browsing Agent)**.

---

## 2. Các thực thể nghiệp vụ cốt lõi (Core Domain Entities)

### 2.1. Danh mục & Gói dịch vụ (`Catalog`)
Hệ thống chia dịch vụ thành **6 danh mục chuẩn** (`ServiceCategoryId`):
1. `bao-duong-dinh-ky` — Bảo dưỡng định kỳ (thay dầu, lọc gió, mốc 5.000 – 40.000 km).
2. `sua-chua-o-to` — Sửa chữa ô tô (OBD-II, phanh, gầm treo, động cơ).
3. `cham-soc-detailing` — Chăm sóc & Detailing (hơi nước nóng, hiệu chỉnh sơn, phủ Ceramic 9H).
4. `lop-va-mam-xe` — Lốp & Mâm xe (thay lốp, cân bằng động, căn chỉnh thước lái Hunter 3D).
5. `dien-va-dieu-hoa` — Điện & Điều hòa (ắc quy, máy phát, nội soi dàn lạnh).
6. `dau-nhot-phu-tung` — Phụ tùng & Vật tư thay nhanh (ắc quy, má phanh, bugi, lọc gió).

Mỗi gói dịch vụ (`ServiceProduct`) có các thuộc tính bắt buộc:
- Định danh duy nhất: `id`, `sku` (ví dụ `ATR-BD-001`), `slug` (dùng cho URL `/dich-vu/[slug]` và `data-agent-target`).
- Giá niêm yết bằng VNĐ: `priceVnd` (bắt buộc > 0), `originalPriceVnd`, `discountPercent`.
- Thông số kỹ thuật: `estimatedDuration`, `warrantyLabel`, `compatibleVehicles`, `includedSteps`.
- Danh sách xưởng hỗ trợ (`supportedGarageIds` / bảng `garage_services` trong DB).

Ngoài ra có **Combo theo mốc km** (`MaintenanceCombo`): các gói định kỳ tiêu chuẩn như `5.000 km`, `20.000 km`, `40.000 km` liên kết trực tiếp tới `linkedProductSlug`.

### 2.2. Hệ thống Garage đối tác (`Garages`)
Mỗi xưởng (`GarageEntity`) đại diện cho một nhà cung cấp dịch vụ trên sàn:
- Định danh: `id` (vd: `grg-saigon-motorwerks`), `slug` (vd: `saigon-motorwerks-quan-7`).
- Phân vùng địa lý: `cityCode` (`hcm` | `hn` | `dn`), `cityLabel`, `district`, `fullAddress`.
- Năng lực vận hành: `bayCount` (số khoang cầu nâng), `openHours`, `verified`, `certifications`, `startingPriceVnd`.
- Bảng giá tham chiếu & danh mục chuyên môn (`categories`, `referencePrices`).

### 2.3. Hồ sơ phương tiện & Sổ bảo dưỡng (`Customer Vehicles`)
Chủ xe lưu thông tin xe cá nhân (`CustomerVehicle`):
- `brand` (Hãng xe, vd: Mazda), `model` (vd: CX-5 2.0 Premium), `year`, `licensePlate` (Biển số, vd: `51K-682.39`), `currentOdoKm`.
- Thông tin xe đang chọn (`activeVehicle`) được truyền làm ngữ cảnh cho cả trang Checkout và AI Agent (`PageContext.vehicle`) để AI tư vấn đúng mốc ODO và dòng xe.

### 2.4. Giỏ dịch vụ, Mã ưu đãi & Đặt lịch (`Cart`, `Coupon`, `Booking / ServiceOrder`)
- **Coupon Engine:** Hiện hỗ trợ mã `AUTORA10` và `CHAMXE10` — **giảm 10% tổng giá trị đơn, tối đa `300.000đ`**.
- **Khung giờ tiếp nhận chuẩn (`TIME_SLOTS`):** `08:00`, `09:30`, `11:00`, `13:30`, `15:00`, `16:30`.
- **Phương thức thanh toán:**
  1. `pay-at-garage` (`PAY_AT_GARAGE`): Thanh toán tại garage sau nghiệm thu xe (khuyên dùng).
  2. `vietqr` (`VIETQR`): Chuyển khoản nhanh VietQR 24/7 tại quầy.
  3. `vnpay` (`VNPAY`): Cổng VNPAY / Thẻ nội địa & quốc tế (hỗ trợ xuất VAT).
- **Trạng thái đơn dịch vụ (`ServiceOrder.status` / `BookingStatus`):**
  - Frontend hiện tại: `DA_XAC_NHAN` → `DANG_THUC_HIEN` → `HOAN_TAT`.
  - Backend `autora-api`: `PENDING_CONFIRMATION` → `CONFIRMED` → `IN_PROGRESS` → `COMPLETED` (hoặc `CANCELLED`).

---

## 3. Luồng nghiệp vụ đầu-cuối (End-to-End User Journeys)

### Luồng 1: Tự tìm dịch vụ & đặt lịch trực tuyến
1. Khách hàng vào `/` hoặc `/dich-vu`, lọc theo từ khóa/danh mục/khoảng giá/kiểu dáng xe.
2. Xem chi tiết tại `/dich-vu/[slug]`, chọn Garage thực hiện, bấm **Thêm vào giỏ dịch vụ** (`MiniCartDrawer` mở ra hoặc vào `/gio-hang`).
3. Nhập mã ưu đãi (`AUTORA10`) nếu có, chuyển sang `/thanh-toan`.
4. Hoàn tất quy trình 3 bước tại `/thanh-toan`:
   - **Bước 1:** Chọn Garage & Ngày/Khung giờ tiếp nhận.
   - **Bước 2:** Xác nhận thông tin chủ xe & Phương tiện (Biển số, ODO, ghi chú triệu chứng).
   - **Bước 3:** Chọn phương thức thanh toán & bấm **Xác nhận đặt lịch** → Sinh mã phiếu hẹn `ATR-xxxx` và lưu vào Sổ bảo dưỡng (`/tai-khoan`).

### Luồng 2: Đặt lịch với Cố vấn Dịch vụ AI (Co-Browsing)
1. Khách mở Widget AI (`AgentWidget`) và hỏi (ví dụ: *"Tìm gara uy tín Quận 7"* hoặc *"Đặt lịch thay dầu sáng mai"*).
2. `agent-api` truy xuất RAG + gọi Tool (`search_services`, `search_garages`, `check_availability`, `prepare_booking_draft`).
3. `agent-api` trả về:
   - Câu trả lời tiếng Việt minh bạch giá VNĐ.
   - Thẻ gợi ý (`ui.cards`) + Hành động (`action.proposed`) + Kịch bản Co-Browsing (`workflow.plan`).
4. `agent-sdk` (`UiChoreographer`) tự động dẫn dắt người dùng qua từng trang, tự điền ô tìm kiếm, chọn garage/ngày/giờ/ghi chú, **nhưng BẮT BUỘC dừng lại ở nút cuối (`checkout.submit_booking`)** với trạng thái `awaiting_user_confirm` để khách hàng tự kiểm tra và bấm xác nhận.

---

## 4. Quy tắc nghiệp vụ bất biến (Business Invariants — CẤM VI PHẠM)

1. **Minh bạch giá & Không đặt cọc bắt buộc:** Mọi gói dịch vụ phải hiển thị giá tham khảo bằng VNĐ. Khách đặt lịch hẹn không bị ép đặt cọc trước; mọi phát sinh ngoài gói tại xưởng phải được báo giá & có sự đồng ý của chủ xe trước khi thực hiện.
2. **Nguyên tắc ranh giới tự động hóa AI (`L3` vs `L4`):**
   - AI được phép **L3 (Chuẩn bị bản nháp)**: tìm kiếm, lọc, điều hướng, thêm gói vào giỏ, điền sẵn thông tin form đặt lịch.
   - AI **TUYỆT ĐỐI KHÔNG ĐƯỢC PHÉP L4 (Tự xác nhận giao dịch)**: không được tự động gửi request tạo booking/thanh toán hay tự `click` vào các phần tử `confirm_only` (`checkout.submit_booking`). Mọi thao tác xác nhận cuối cùng phải do con người tự bấm (`handoff_confirm`).
3. **Không bịa đặt dữ liệu kỹ thuật/giá cả:** AI Agent chỉ được trả lời giá, tên gói, tên garage từ kết quả Tool hoặc Knowledge Base thuộc đúng `tenantId` và `actorRole` của phiên hiện tại.
4. **Bảo vệ dữ liệu cá nhân (RBAC & PII):**
   - Khách vãng lai (`guest`) không thể gọi tool cá nhân (`get_my_vehicles`, `get_my_orders`) hoặc đọc tài liệu nội bộ (`accessRole: "customer"`).
   - `userId` và `tenantId` luôn được khóa ở tầng server (`TrustedActorContext`), LLM không bao giờ có quyền ghi đè.
5. **Xóa mềm (Soft Delete) cho dữ liệu lõi:** Trong `autora-api`, các bảng nghiệp vụ chính (`users`, `service_products`, `garages`, `bookings`, `customer_vehicles`, `coupons`, `reviews`) không xóa cứng (`DELETE`) để bảo toàn lịch sử bảo dưỡng và đối soát tài chính.
