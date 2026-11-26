# 03. Cẩm nang Onboarding & Quy tắc Code An toàn

Tài liệu này dành cho kỹ sư mới tham gia dự án `car-service`. Hãy đọc kỹ trước khi sửa hoặc thêm tính năng mới để **không làm gãy luồng dữ liệu, bảo mật hoặc AI Co-Browsing**.

---

## 1. Những điều TUYỆT ĐỐI KHÔNG LÀM (Golden Rules)

### ❌ 1. Không import `PrismaService` trực tiếp vào Controller hoặc Use-Case nghiệp vụ (`autora-api`)
- **Sai:** Inject `PrismaService` vào `AuthController` hoặc `RegisterUseCase` để gọi `prisma.user.findUnique(...)`.
- **Đúng:** Định nghĩa Interface trong `domain/repositories/*.interface.ts` với DI Token (`Symbol`), implement bằng `Prisma*Repository` trong `infrastructure/` sử dụng `this.uow.getClient()`, và inject qua `@Inject(TOKEN)` vào Use-Case.
- **Lý do:** Nếu gọi trực tiếp `PrismaService` bên ngoài `PrismaUnitOfWorkService`, các thao tác ghi sẽ **không nằm trong chung interactive transaction (`$transaction`)** khi có rollback.

### ❌ 2. Không tự ý đổi tên hoặc xóa thuộc tính `data-agent-target` trong `autora-web`
- Các chuỗi như `nav.garages`, `nav.services`, `nav.cart`, `nav.checkout`, `garage.filter.search`, `service.card.<slug>.add_to_cart`, `checkout.select.garage`, `checkout.submit_booking` đang được dùng bởi `UiChoreographer` của `agent-sdk`.
- **Nếu bắt buộc phải đổi UI:** Hãy kiểm tra danh sách toàn bộ `data-agent-target` bằng tìm kiếm trong `autora-web/src`, cập nhật đồng thời:
  1. JSX trong `autora-web`
  2. `HOST_UI_TARGET_PATTERNS` trong `autora-web/src/features/agent/autora-agent-host.tsx`
  3. `uiTargets` trong `agent-api/src/modules/tenants/manifests/autora.manifest.ts`
  4. `agent-api/src/modules/runtime/workflow-synthesizer.ts`

### ❌ 3. Không đưa nút Xác nhận đặt lịch / Thanh toán ra khỏi danh sách `confirm_only`
- `checkout.submit_booking` bắt buộc phải nằm trong `CONFIRM_ONLY_TARGET_PATTERNS` (ở `autora-agent-host.tsx` và `AgentWidget`) và `risk: "confirm_only"` (ở `autora.manifest.ts`).
- Không bao giờ để AI Agent tự động gọi API tạo booking cuối hoặc tự click nút submit thanh toán.

### ❌ 4. Không bỏ qua `ValidationPipe` hoặc tạo endpoint không có DTO (`autora-api`)
- `main.ts` bật `whitelist: true` và `forbidNonWhitelisted: true`. Mọi field không khai báo decorator của `class-validator` trong DTO sẽ bị Fastify/Nest từ chối với lỗi `400 Bad Request`.
- Mọi endpoint mới phải:
  - Dùng URI versioning (`@Controller({ path: "...", version: "1" })`).
  - Gắn `@Public()` nếu không yêu cầu đăng nhập (mặc định mọi route đều bị `JwtAuthGuard` khóa).
  - Gắn `@Idempotent()` nếu là API tạo giao dịch/đặt lịch/thanh toán (`POST`).

### ❌ 5. Không tạo circular dependency giữa các module trong `autora-api`
- Ví dụ: `BookingsModule` hoàn tất đơn hàng và muốn cập nhật `VehiclesModule` hoặc ghi `AuditModule` → **phát Domain Event** qua `EventEmitter2` (`@OnEvent`), không import chéo module lẫn nhau.

### ❌ 6. Không dùng `||` / `&&` khi chạy lệnh PowerShell trên Windows nếu dùng PS 5.1, và chú ý `pnpm` sandbox
- Trên máy Windows của dự án, `pnpm.ps1` có thể bị chặn ExecutionPolicy → dùng `pnpm.cmd`.
- Các lệnh chạy trên `autora-api` nhớ chạy đủ: `pnpm.cmd --dir autora-api typecheck`, `lint`, `test`, `build`.

---

## 2. Hướng dẫn thực hành (How-To Recipes)

### Recipe A: Thêm một Module nghiệp vụ mới vào `autora-api` (ví dụ: `BookingsModule`)
1. Tạo cấu trúc 4 thư mục trong `src/modules/bookings/`:
   - `domain/entities/booking.entity.ts` (kế thừa `BaseEntity`)
   - `domain/repositories/booking.repository.interface.ts` (khai báo `BOOKING_REPOSITORY = Symbol(...)`)
   - `domain/events/booking-confirmed.event.ts` (kế thừa `BaseDomainEvent`)
   - `application/dto/create-booking.dto.ts` (có `class-validator` + `@ApiProperty`)
   - `application/use-cases/create-booking.use-case.ts` (bọc bằng `this.unitOfWork.runInTransaction(...)`, phát event qua `EventEmitter2`)
   - `infrastructure/prisma-booking.repository.ts` (kế thừa `BasePrismaRepository`, dùng `this.uow.getClient()`)
   - `presentation/bookings.controller.ts` (gắn `@Idempotent()`, `@UseGuards(PoliciesGuard)`, `@CheckPolicies(...)`)
   - `bookings.module.ts`
2. Đăng ký `BookingsModule` vào `src/app.module.ts`.
3. Viết Unit Test trong `test/unit/bookings/create-booking.use-case.spec.ts` (mock repository interface & `IUnitOfWork`).

### Recipe B: Thêm một gói dịch vụ hoặc Garage mới (giữ đồng bộ 3 nơi)
1. **`autora-web`:** Thêm vào `services.mock.ts` hoặc `garages.mock.ts` (chú ý `slug` chuẩn kebab-case không dấu).
2. **`autora-api`:** Thêm vào `prisma/seed.ts` với đúng `slug` và `sku` tương ứng.
3. **`agent-api`:** Cập nhật `agent-api/src/modules/connectors/mock-autora.connector.ts` (cho tới khi chuyển sang HTTP connector gọi `autora-api`) để AI gợi ý đúng `slug`.

### Recipe C: Thêm một Tool mới cho AI Agent (`agent-api`)
1. Khai báo tool + `allowedRoles` trong `agent-api/src/modules/tenants/manifests/autora.manifest.ts`.
2. Khai báo Zod schema validate tham số và case xử lý trong `agent-api/src/modules/tools/tool-registry.service.ts`.
3. Implement phương thức truy xuất dữ liệu trong Connector (`mock-autora.connector.ts` hoặc HTTP connector).
4. Viết test phân quyền trong `agent-api/test/rbac-and-rag.spec.ts` để đảm bảo role thấp hơn (vd `guest`) không thể gọi tool nhạy cảm.

---

## 3. Checklist kiểm tra trước khi tạo Pull Request

- [ ] **Không có `any` mới:** `pnpm lint` (`@typescript-eslint/no-explicit-any: error`) chạy pass với `--max-warnings=0`.
- [ ] **Không rò rỉ dữ liệu nhạy cảm:** Mọi log mới không in password/token/CCCD; dữ liệu trả về từ tool của `agent-api` đi qua `stripSensitiveFields`.
- [ ] **Kiểm tra toàn bộ project bị ảnh hưởng:**
  - Nếu sửa `autora-api`: `pnpm.cmd --dir autora-api prisma:generate` (nếu sửa schema), `typecheck`, `lint`, `test`, `build`.
  - Nếu sửa `agent-sdk`: `pnpm.cmd --dir agent-sdk typecheck`, `test`, `build` → sau đó kiểm tra lại `autora-web`.
  - Nếu sửa `agent-api`: `pnpm.cmd --dir agent-api typecheck`, `lint`, `test`, `build`.
  - Nếu sửa `autora-web`: `pnpm.cmd --dir autora-web lint`, `build`.
