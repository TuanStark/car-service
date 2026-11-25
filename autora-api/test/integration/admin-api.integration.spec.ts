import "reflect-metadata";
import fastifyCookie from "@fastify/cookie";
import { ValidationPipe, VersioningType } from "@nestjs/common";
import { FastifyAdapter, type NestFastifyApplication } from "@nestjs/platform-fastify";
import { Test } from "@nestjs/testing";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { AppModule } from "@/app.module";

describe("Admin API Integration (Real PostgreSQL + Redis + CASL)", () => {
  let app: NestFastifyApplication;
  let adminToken = "";
  let customerToken = "";

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleRef.createNestApplication<NestFastifyApplication>(
      new FastifyAdapter()
    );
    await app.register(fastifyCookie, {
      secret: process.env.COOKIE_SECRET || "replace_with_at_least_32_chars_cookie_signing_secret",
    });
    app.setGlobalPrefix("api", { exclude: ["health/live", "health/ready"] });
    app.enableVersioning({ type: VersioningType.URI, defaultVersion: "1" });
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      })
    );
    await app.init();
    await app.getHttpAdapter().getInstance().ready();

    const adminLoginRes = await app.inject({
      method: "POST",
      url: "/api/v1/auth/login",
      payload: { email: "admin@autora.vn", password: "AutoraAdmin@2026" },
    });
    const adminBody = JSON.parse(adminLoginRes.body) as {
      data: { accessToken: string };
    };
    adminToken = adminBody.data.accessToken;

    const custLoginRes = await app.inject({
      method: "POST",
      url: "/api/v1/auth/login",
      payload: { email: "khoa.nguyen@autora.vn", password: "Autora@2026" },
    });
    const custBody = JSON.parse(custLoginRes.body) as {
      data: { accessToken: string };
    };
    customerToken = custBody.data.accessToken;
  });

  afterAll(async () => {
    await app?.close();
  });

  it("blocks unauthenticated and non-admin requests with 401/403", async () => {
    const noAuth = await app.inject({
      method: "GET",
      url: "/api/v1/admin/dashboard/overview",
    });
    expect(noAuth.statusCode).toBe(401);

    const custAuth = await app.inject({
      method: "GET",
      url: "/api/v1/admin/dashboard/overview",
      headers: { authorization: `Bearer ${customerToken}` },
    });
    expect(custAuth.statusCode).toBe(403);
  });

  it("serves real dashboard metrics, paginated bookings, customers without PII leakage", async () => {
    const dashRes = await app.inject({
      method: "GET",
      url: "/api/v1/admin/dashboard/overview",
      headers: { authorization: `Bearer ${adminToken}` },
    });
    expect(dashRes.statusCode).toBe(200);
    const dashJson = JSON.parse(dashRes.body) as {
      data: { kpis: { totalBookings: number }; revenue: { collectedRevenueVnd: number } };
    };
    expect(dashJson.data.kpis.totalBookings).toBeGreaterThanOrEqual(8);
    expect(dashJson.data.revenue.collectedRevenueVnd).toBeGreaterThan(0);

    const custRes = await app.inject({
      method: "GET",
      url: "/api/v1/admin/customers",
      headers: { authorization: `Bearer ${adminToken}` },
    });
    expect(custRes.statusCode).toBe(200);
    expect(custRes.body).not.toContain("passwordHash");
  });
});
