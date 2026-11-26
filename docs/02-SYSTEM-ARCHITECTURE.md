# 02. Tài liệu Kiến trúc Hệ thống & Hợp đồng Tích hợp

Tài liệu này giải thích kiến trúc kỹ thuật của 4 dự án trong workspace `car-service`, ranh giới trách nhiệm giữa từng thành phần và các hợp đồng giao tiếp (contracts) cần giữ ổn định khi mở rộng.

---

## 1. Bản đồ thành phần & Ranh giới sở hữu (System Boundaries)

| Thành phần | Trách nhiệm chính | Dữ liệu sở hữu | Giao tiếp với |
| :--- | :--- | :--- | :--- |
| **`autora-web`** (Next.js 16) | Giao diện TMĐT cho chủ xe; quản lý UI state tạm (giỏ hàng/draft trên `localStorage`) | UI state, `localStorage` (`autora_ecommerce_v2`) | Gọi `autora-api` (`/api/v1/*`) & nhúng `agent-sdk` |
| **`autora-api`** (NestJS 11 + Fastify 5) | **Source of Truth** nghiệp vụ cốt lõi: IAM, Catalog, Garages, Bookings, Vehicles, Audit | PostgreSQL (`autora_db`) & Redis | Nhận REST từ `autora-web` (và `agent-api` ở Phase 2) |
| **`agent-api`** (NestJS 11 + Fastify 5) | Bộ não AI điều phối hội thoại, Multi-LLM Router, RBAC RAG, Tool Calling, Workflow Synthesizer | PostgreSQL (`autora_agent` + `pgvector`), Sessions, Audit | Giao tiếp REST/SSE với `agent-sdk` |
| **`agent-sdk`** (`@autora/agent-sdk`) | Client SDK + Widget chat + Động cơ Co-Browsing thao tác DOM | Không lưu DB; giữ trạng thái phiên & choreographer | Kết nối `agent-api` và điều khiển DOM của `autora-web` |

---

## 2. Kiến trúc nội bộ `autora-api` (Core Business Backend)

`autora-api` áp dụng **Modular Monolith + Clean/Hexagonal Architecture** với quy tắc phụ thuộc một chiều:

```text
presentation (Controllers, HTTP/Swagger)
     │
     ▼
application (Use-Cases, DTOs, CASL Policies)
     │
     ▼
domain (Entities, Repository Interfaces, Domain Events)
     ▲
     │ implements
infrastructure (Prisma Repositories, Redis, BullMQ, Pino, OpenTelemetry)
```

### 2.1. Các cơ chế nền tảng bắt buộc hiểu
1. **Prisma Client Extensions (`src/infrastructure/prisma/prisma.service.ts`):**
   - **Auto Soft Delete:** Tự động chèn `deletedAt: null` vào `findFirst`, `findMany`, `count`, `aggregate`, `groupBy`; tự động lọc kết quả `findUnique` nếu đã bị xóa mềm; chuyển `delete`/`deleteMany` thành `update`/`updateMany` với `deletedAt: new Date()`.
   - **Slow Query Warning:** Đo thời gian mọi truy vấn và log cảnh báo JSON nếu vượt ngưỡng `DATABASE_SLOW_QUERY_MS` (mặc định `200ms`).
2. **Unit of Work (`PrismaUnitOfWorkService`):**
   - Dùng `AsyncLocalStorage` bọc quanh `prisma.client.$transaction(...)`.
   - Mọi Repository gọi `this.uow.getClient()` sẽ tự động dùng chung transaction hiện tại nếu Use-Case đang chạy trong `unitOfWork.runInTransaction(...)`.
3. **Request Lifecycle & Cross-Cutting:**
   - `CorrelationIdMiddleware`: Đọc/sinh `x-request-id` (UUIDv7) và giữ trong `RequestContext` suốt vòng đời request.
   - `JwtAuthGuard` + Redis Blacklist (`bl:jti:<jti>`): Bảo vệ mặc định mọi route; route công khai phải gắn `@Public()`.
   - `PoliciesGuard` (CASL): Kiểm tra quyền RBAC + ABAC qua `@CheckPolicies(...)`.
   - `IdempotencyInterceptor`: Route gắn `@Idempotent()` bắt buộc gửi header `Idempotency-Key`, khóa phân tán qua Redis để chống tạo trùng đơn đặt lịch/thanh toán khi mạng lag/retry.
   - `TransformResponseInterceptor`: Bọc response thành `{ success: true, data, meta?, requestId, timestamp }`.
   - `AllExceptionsFilter`: Chuẩn hóa mọi lỗi (DomainException, Validation, HttpException, lỗi hệ thống) về chuẩn **RFC 7807** (`application/problem+json`).
4. **Refresh Token Rotation (`IamModule`):**
   - Refresh token được băm SHA-256 trước khi lưu DB (`refresh_tokens`) kèm `familyId`.
   - Nếu phát hiện dùng lại một Refresh Token đã bị thu hồi (`revokedAt !== null`), hệ thống tự động **thu hồi toàn bộ `familyId`** để vô hiệu hóa phiên bị đánh cắp.
5. **Giao tiếp liên module qua Domain Events:**
   - Ví dụ: `RegisterUseCase` phát `iam.user.registered` qua `EventEmitter2`; `AuditEventListener` ở `AuditModule` lắng nghe bất đồng bộ để ghi `audit_logs`. Hai module không import trực tiếp nhau.

---

## 3. Kiến trúc `agent-api` & `agent-sdk` (AI & Co-Browsing)

### 3.1. Luồng xử lý 1 lượt chat trên `agent-api` (`AgentRuntimeService`)
1. Xác thực `sessionId` từ `SessionsService` và lấy `SiteManifest` (`autora-vn`) từ `TenantRegistryService`.
2. Truy xuất ngữ cảnh kiến thức từ `RagService` lọc theo `tenantId` và `actorRole` (`guest` < `customer` < `partner_staff`).
3. Đóng gói ngữ cảnh trình duyệt (`current_page`, `vehicle`, `capabilities`) vào thẻ `<untrusted_host_context>` để LLM không hiểu nhầm dữ liệu người dùng thành chỉ thị hệ thống.
4. Chạy vòng lặp Tool Calling (`MAX_TOOL_STEPS = 4`) qua `LlmRouterService`:
   - `production`: `OpenRouter` → `LocalFallback`.
   - `development`: `Gemini API` → `AGY CLI` (khi `429`/lỗi) → `LocalFallback`.
5. Lọc đầu ra của Tool qua `stripSensitiveFields` (loại bỏ `password`, `token`, `secret`, `cccd`, ...).
6. Kiểm duyệt đầu ra trước khi trả về client qua `RbacService`:
   - `validateProposedActions`: Chỉ cho phép 6 target trong allowlist (`garage.search`, `garage.show`, `service.search`, `service.show`, `booking.start`, `booking.fill_draft`) và lọc params đúng `allowedParams`.
   - `validateWorkflowPlan`: Chỉ cho phép các `targetId` khớp mẫu trong `manifest.uiTargets`, và **cấm tuyệt đối** `click`/`type`/`select` trên target có `risk: "confirm_only"`.

### 3.2. Động cơ Co-Browsing trên `agent-sdk` (`UiChoreographer`)
- Tìm phần tử DOM qua selector `[data-agent-target="<targetId>"]` (`BrowserDomExecutor`).
- Nếu không tìm thấy trên trang hiện tại và bước đó có `fallbackRoute`, tự động gọi `adapter.navigateToRoute(fallbackRoute)` rồi dùng `MutationObserver` chờ phần tử xuất hiện.
- Khi điền vào input/select của React, dùng `setReactControlledValue` (gọi native prototype setter + dispatch `input`/`change`) để React state cập nhật chuẩn xác.
- Hỗ trợ 2 chế độ chạy: `auto` (tự động) và `step` (dạy từng bước, dừng chờ người dùng bấm Tiếp tục).

---

## 4. Hợp đồng đồng bộ giữa các dự án (Integration Contracts)

| Hợp đồng | Nơi định nghĩa | Nơi tiêu thụ | Lưu ý khi sửa |
| :--- | :--- | :--- | :--- |
| **Action Targets** | `agent-api/src/common/contracts/agent.contract.ts` | `agent-sdk/src/core/action-dispatcher.ts` & `autora-web/src/features/agent/autora-agent-host.tsx` | Phải cập nhật đồng bộ cả 3 nơi |
| **UI Co-Browsing Targets** | `autora.manifest.ts` (`uiTargets`) | `autora-agent-host.tsx` (`HOST_UI_TARGET_PATTERNS`) & các thuộc tính `data-agent-target` trên JSX | Đổi tên `data-agent-target` trên JSX mà quên sửa manifest sẽ làm AI Co-Browsing báo lỗi không tìm thấy phần tử |
| **Catalog Slugs & Garage IDs** | `autora-web/.../*.mock.ts` & `autora-api/prisma/seed.ts` | `agent-api/src/modules/connectors/mock-autora.connector.ts` | Slug dịch vụ/garage phải khớp nhau giữa 3 bên |

---

## 5. Trạng thái hiện tại & Lộ trình nâng cấp (Phase 1 → Phase 2)

Hiện tại hệ thống đang vận hành ổn định ở **Phase 1**:
- `autora-web` đang đọc dữ liệu mẫu từ `*.mock.ts` và lưu đơn hàng trên `localStorage`.
- `autora-api` đã hoàn thiện kiến trúc nền tảng + `IamModule` + `CatalogModule` + `AuditModule` + `prisma/schema.prisma` đầy đủ cho toàn bộ nghiệp vụ.
- `agent-api` đang dùng `MockAutoraConnector` và `SessionsService`/`RagService` in-memory (có ghi song song xuống Prisma khi bật `STORAGE_DRIVER=prisma`).

**Lộ trình Phase 2 (Production Integration):**
1. Implement nốt các module `garages`, `vehicles`, `cart`, `bookings`, `reviews`, `content` trong `autora-api`.
2. Chuyển `autora-web` gọi API thật của `autora-api` (`:4000/api/v1/*`) thay cho `*.mock.ts`.
3. Thay `MockAutoraConnector` trong `agent-api` bằng `AutoraHttpConnector` gọi sang `autora-api`, và lấy `actorRole`/`actorUserId` từ JWT đã xác thực thay vì hardcode ở `AutoraAgentHost`.
