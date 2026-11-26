# CAR-SERVICE — Hệ sinh thái Dịch vụ Ô tô AUTORA

Không gian làm việc tổng hợp (Multi-Project Workspace) chứa toàn bộ mã nguồn của nền tảng thương mại điện tử dịch vụ ô tô **AUTORA**, bao gồm Frontend Storefront, Core Business Backend API, AI Agent Platform Backend và Co-Browsing Client SDK.

---

## 1. Danh sách các Source Code

| Thư mục | Tên gói / Vai trò | Công nghệ chính | Cổng mặc định |
| :--- | :--- | :--- | :--- |
| [`autora-web/`](./autora-web) | Website TMĐT Dịch vụ Ô tô **AUTORA** (Storefront, Tìm Garage, Giỏ dịch vụ, Đặt lịch, Sổ bảo dưỡng) | Next.js 16, React 19, TypeScript, Tailwind CSS v4 | `:3000` |
| [`autora-admin/`](./autora-admin) | **Admin Dashboard Vận hành AUTORA** (Tổng quan KPI, Lịch hẹn, Garage, Dịch vụ & Bảng giá, Khách hàng, Nhật ký) | Next.js 16, React 19, TypeScript, TanStack Query, Tailwind CSS v4 | `:3001` |
| [`autora-api/`](./autora-api) | **Core Business Backend** (IAM, CASL RBAC/ABAC, Catalog, Garages, Bookings, Audit, Observability) | NestJS 11, Fastify 5, Prisma 6, PostgreSQL, Redis, BullMQ | `:4000` |
| [`agent-api/`](./agent-api) | **AI Agent Platform Backend** (Multi-tenant, Multi-LLM Router, RBAC-aware RAG, SSE, Guardrails) | NestJS 11, Fastify 5, Prisma 6 (pgvector), Zod, Redis | `:4100` |
| [`agent-sdk/`](./agent-sdk) | `@autora/agent-sdk` — Client & UI Co-Browsing SDK kết nối `autora-web` với `agent-api` | TypeScript, React 18/19 (`AgentWidget`, `UiChoreographer`) | Package nội bộ (`file:../agent-sdk`) |

---

## 2. Kiến trúc tổng thể & Luồng tích hợp

```text
                        ┌─────────────────────────────────────────┐
                        │           autora-web (:3000)            │
                        │  Next.js App Router + Feature-Sliced    │
                        │  + data-agent-target DOM Bindings       │
                        └───────────┬─────────────────┬───────────┘
                                    │                 │
                         REST (/api/v1/*)     @autora/agent-sdk
                                    │         (AgentWidget + Co-Browsing)
                                    ▼                 │
                        ┌───────────────────┐         ▼
                        │ autora-api (:4000)│ ◄──► ┌──────────────────┐
                        │ Core Business BE  │      │ agent-api (:4100)│
                        │ NestJS + Fastify  │      │ AI Orchestrator  │
                        │ PostgreSQL+Redis  │      │ Multi-LLM + RAG  │
                        └───────────────────┘      └──────────────────┘
```

- **`autora-web`** đóng vai trò giao diện thương mại điện tử cho chủ xe, nhúng `<AutoraAgentHost />` để kết nối với `@autora/agent-sdk`.
- **`autora-api`** là nguồn dữ liệu nghiệp vụ chuẩn (Source of Truth) theo kiến trúc **Modular Monolith + Clean/Hexagonal Architecture** (`domain` → `application` → `infrastructure` → `presentation`), chuẩn bị sẵn Soft Delete, Unit of Work, Idempotency-Key, RFC 7807 Problem Details, Pino JSON logging và OpenTelemetry.
- **`agent-sdk`** quản lý phiên chat SSE với `agent-api`, kiểm tra capability hợp lệ qua `ActionDispatcher`, và điều phối thao tác UI từng bước (`UiChoreographer` + `BrowserDomExecutor`), luôn dừng bàn giao ở nút `checkout.submit_booking` (`confirm_only`).
- **`agent-api`** điều phối hội thoại AI, định tuyến LLM (OpenRouter / Gemini / AGY CLI / Local Fallback), truy xuất RAG theo quyền (`guest` / `customer` / `partner_staff`), và kiểm soát allowlist điều hướng.

---

## 3. Hướng dẫn khởi chạy nhanh

### 3.1. Chạy `autora-api` (Core Backend — `:4000`)

```bash
cd autora-api
pnpm install
cp .env.example .env

# Bật PostgreSQL (:5433), Redis (:6380), Mailpit (:8025), Adminer (:8080)
pnpm docker:up

# Sinh Prisma Client, chạy migration & seed dữ liệu mẫu
pnpm prisma:generate
pnpm prisma:migrate:dev --name init
pnpm prisma:seed

# Khởi chạy dev server (API: http://localhost:4000/api/v1 | Swagger: http://localhost:4000/docs)
pnpm dev
```

### 3.2. Chạy `agent-api` (AI Agent Backend — `:4100`)

```bash
cd agent-api
pnpm install
cp .env.example .env

# Bật PostgreSQL (pgvector) & Redis
docker compose up -d

# Khởi chạy dev server (http://localhost:4100)
pnpm dev
```

> **Lưu ý tránh xung đột cổng Docker:** Cả `autora-api/docker-compose.yml` và `agent-api/docker-compose.yml` đều cấu hình cổng mặc định Postgres `5433` và Redis `6380`. Nếu chạy cả hai cụm Docker cùng lúc trên máy local, hãy đặt `POSTGRES_PORT=5434` và `REDIS_PORT=6381` trong `agent-api/.env` trước khi chạy `docker compose up -d`.

### 3.3. Build `agent-sdk` (nếu chỉnh sửa SDK)

```bash
cd agent-sdk
pnpm install
pnpm build
```

### 3.4. Chạy `autora-web` (Frontend — `:3000`)

```bash
cd autora-web
pnpm install
pnpm dev
```

Truy cập website tại `http://localhost:3000`.

### 3.5. Chạy `autora-admin` (Admin Dashboard — `:3001`)

```bash
cd autora-admin
pnpm install
cp .env.example .env.local
pnpm dev
```

Truy cập trang quản trị tại `http://localhost:3001` (tài khoản Admin dev từ seed: `admin@autora.vn` / `AutoraAdmin@2026`).

---

## 4. Lệnh kiểm thử & Kiểm tra chất lượng

| Dự án | Lệnh kiểm tra chuẩn |
| :--- | :--- |
| **`autora-api`** | `pnpm typecheck && pnpm lint && pnpm test && pnpm build` |
| **`agent-api`** | `pnpm typecheck && pnpm lint && pnpm test && pnpm build` |
| **`agent-sdk`** | `pnpm typecheck && pnpm test && pnpm build` |
| **`autora-web`** | `pnpm lint && pnpm build` |
| **`autora-admin`** | `pnpm typecheck && pnpm lint && pnpm build` |

---

## 5. Bộ Tài liệu Nghiệp vụ & Kỹ thuật (Dành cho Team & Onboarding)

- **Nghiệp vụ & Quy tắc bất biến:** [`docs/01-BUSINESS-DOMAIN.md`](./docs/01-BUSINESS-DOMAIN.md)
- **Kiến trúc Hệ thống & Hợp đồng Tích hợp:** [`docs/02-SYSTEM-ARCHITECTURE.md`](./docs/02-SYSTEM-ARCHITECTURE.md)
- **Cẩm nang Onboarding & Quy tắc Code An toàn:** [`docs/03-DEVELOPER-ONBOARDING-AND-SAFETY-GUIDE.md`](./docs/03-DEVELOPER-ONBOARDING-AND-SAFETY-GUIDE.md)

### Tài liệu chi tiết từng thành phần

- Kiến trúc Frontend: [`autora-web/ARCHITECTURE.md`](./autora-web/ARCHITECTURE.md)
- Tài liệu Core Backend: [`autora-api/README.md`](./autora-api/README.md)
- Tài liệu AI Agent Backend: [`agent-api/README.md`](./agent-api/README.md)
- Tài liệu Agent SDK: [`agent-sdk/README.md`](./agent-sdk/README.md)
