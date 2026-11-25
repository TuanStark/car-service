import { describe, expect, it, vi } from "vitest";
import type { RedisService } from "@infra/redis/redis.service";
import { CatalogQueryDto } from "@modules/catalog/application/dto/catalog-query.dto";
import { ListServicesUseCase } from "@modules/catalog/application/use-cases/list-services.use-case";
import { ServiceProductEntity } from "@modules/catalog/domain/entities/service-product.entity";
import type { IServiceProductRepository } from "@modules/catalog/domain/repositories/service-product.repository.interface";

describe("ListServicesUseCase", () => {
  it("loads services via repository on cache miss and serializes domain entities", async () => {
    const sampleEntity = ServiceProductEntity.reconstitute("svc-1", {
      sku: "ATR-BD-001",
      slug: "thay-dau-dong-co-tong-hop-5w30",
      categoryId: "cat-1",
      categoryCode: "bao-duong-dinh-ky",
      categoryLabel: "Bảo dưỡng định kỳ",
      name: "Gói Thay Dầu 5W-30",
      shortSummary: "Bao gồm 4L dầu tổng hợp",
      description: "Chi tiết gói",
      imageUrl: "/images/service-maintenance.jpg",
      galleryUrls: ["/images/service-maintenance.jpg"],
      priceVnd: 450000,
      originalPriceVnd: 550000,
      discountPercent: 18,
      badge: "BEST_SELLER",
      ratingAvg: 4.9,
      reviewCount: 120,
      bookedCount: 540,
      estimatedDuration: "45 phút",
      warrantyLabel: "5.000 km",
      compatibleVehicles: ["SEDAN", "SUV"],
      compatibleBrandsLabel: "Mazda, Toyota",
      includedSteps: ["Xả nhớt cũ"],
      specifications: [{ label: "Cấp nhớt", value: "5W-30" }],
      isFeatured: true,
    });

    const repo: IServiceProductRepository = {
      findMany: vi.fn().mockResolvedValue({
        items: [sampleEntity],
        meta: {
          page: 1,
          limit: 12,
          totalItems: 1,
          totalPages: 1,
          hasNextPage: false,
          hasPrevPage: false,
        },
      }),
      findBySlug: vi.fn(),
    };

    const redis = {
      getOrSet: vi
        .fn()
        .mockImplementation(
          async (_key: string, _ttl: number, loader: () => Promise<unknown>) =>
            loader()
        ),
    } as unknown as RedisService;

    const useCase = new ListServicesUseCase(repo, redis);
    const query = new CatalogQueryDto();
    query.category = "bao-duong-dinh-ky";

    const result = await useCase.execute(query);

    expect(repo.findMany).toHaveBeenCalledTimes(1);
    expect(result.items).toHaveLength(1);
    expect(result.items[0]?.slug).toBe("thay-dau-dong-co-tong-hop-5w30");
    expect(result.meta.totalItems).toBe(1);
  });
});
