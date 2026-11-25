# AUTORA API (`autora-api`)

Backend chuẩn Enterprise cho nền tảng thương mại điện tử dịch vụ ô tô **AUTORA** (`autora-web`), xây dựng theo kiến trúc **Modular Monolith + Clean/Hexagonal Architecture** với **NestJS 11 + Fastify 5 + Prisma 6 + PostgreSQL + Redis + BullMQ**.

## Điểm nhấn kiến trúc
- **Clean Architecture 4 tầng** trong mỗi module (`domain` → `application` → `infrastructure` → `presentation`).
- **Prisma Client Extensions**: tự động áp dụng Soft Delete (`deletedAt`) và cảnh báo Slow Query.
- **Unit of Work (`$transaction` + `AsyncLocalStorage`)**: đảm bảo tính toàn vẹn giao dịch mà không làm rò rỉ Prisma Client vào Use-Case.
- **Security & Observability**: JWT + Refresh Token Rotation (reuse detection), Redis blacklist, CASL RBAC/ABAC, Idempotency-Key (`@Idempotent()`), RFC 7807 Problem Details (`AllExceptionsFilter`), Pino JSON logging kèm `x-request-id`, OpenTelemetry, Health probes (`/health/live`, `/health/ready`).

## Khởi chạy nhanh (Local)

```bash
# 1. Cài đặt dependencies
pnpm install

# 2. Tạo file .env từ mẫu
cp .env.example .env

# 3. Khởi động PostgreSQL, Redis, Mailpit, Adminer
pnpm docker:up

# 4. Sinh Prisma Client, đẩy schema & seed dữ liệu mẫu
pnpm prisma:generate
pnpm prisma:migrate:dev --name init
pnpm prisma:seed

# 5. Chạy server development (http://localhost:4000/api/v1)
# Swagger Docs: http://localhost:4000/docs
pnpm dev
```

## Kiểm thử & Chất lượng mã nguồn

```bash
pnpm typecheck && pnpm lint && pnpm test && pnpm build
```
