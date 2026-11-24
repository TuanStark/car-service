# AUTORA Agent API — Standalone Multi-Tenant AI Agent Platform (Phase 1)

Dịch vụ Backend độc lập (NestJS + Fastify + TypeScript + Zod + Prisma + pgvector) đóng vai trò "bộ não" điều phối hành trình khách hàng cho website `autora-web` và các website đối tác khác trong tương lai.

## Tính năng Phase 1 đã hoàn thiện
- **Multi-Provider LLM Router:**
  - `production`: **OpenRouter** (`OPENROUTER_API_KEY`).
  - `development`: **Gemini API** (`GEMINI_API_KEY`) → tự động fallback sang **AGY CLI** (`agy --print`) khi hết quota (`429`) → **Local Smart Advisor** khi offline/test.
- **3 Endpoints Chuẩn (`REST + SSE`):**
  - `POST /v1/sessions`
  - `POST /v1/sessions/:sessionId/messages` (JSON hoặc SSE streaming khi `Accept: text/event-stream`)
  - `GET /v1/sessions/:sessionId/events`
  - `GET /health`
- **RBAC 3 lớp (`guest`, `customer`, `partner_staff`):** `userId` & `tenantId` được khóa chặt ở Server, chống Prompt Injection và lọc PII trước khi đưa vào LLM.
- **Multi-tenant RBAC-aware RAG:** Truy xuất kiến thức lọc theo `tenantId` & `accessRole` (sẵn sàng chuyển sang `pgvector` qua `prisma/schema.prisma`).
- **Allowlist Navigation Contract Validator & Audit Trail + Rate Limiter.**

## Khởi chạy nhanh

```bash
# 1. Bật PostgreSQL (pgvector) & Redis
docker compose up -d

# 2. Cấu hình môi trường
cp .env.example .env

# 3. Chạy dev server (http://localhost:4100)
pnpm dev

# 4. Chạy kiểm thử
pnpm typecheck && pnpm lint && pnpm test && pnpm build
```

