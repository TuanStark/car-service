import { Inject, Injectable } from "@nestjs/common";
import type { PaginatedResult } from "@core/domain/repository.interface";
import { RedisService } from "@infra/redis/redis.service";
import type { ServiceProductEntity } from "../../domain/entities/service-product.entity";
import {
  type IServiceProductRepository,
  SERVICE_PRODUCT_REPOSITORY,
} from "../../domain/repositories/service-product.repository.interface";
import type { CatalogQueryDto } from "../dto/catalog-query.dto";

const CATALOG_LIST_CACHE_TTL_SECONDS = 120;

@Injectable()
export class ListServicesUseCase {
  constructor(
    @Inject(SERVICE_PRODUCT_REPOSITORY)
    private readonly serviceRepo: IServiceProductRepository,
    private readonly redisService: RedisService
  ) {}

  async execute(
    query: CatalogQueryDto
  ): Promise<PaginatedResult<ReturnType<ServiceProductEntity["toJSON"]>>> {
    const cacheKey = `catalog:services:${JSON.stringify({
      q: query.q ?? "",
      cat: query.category ?? "all",
      pr: query.priceRange ?? "all",
      vt: query.vehicleType ?? "ALL",
      disc: Boolean(query.onlyDiscounted),
      sort: query.sortBy ?? "popular",
      p: query.page,
      l: query.limit,
    })}`;

    return this.redisService.getOrSet(cacheKey, CATALOG_LIST_CACHE_TTL_SECONDS, async () => {
      const result = await this.serviceRepo.findMany({
        query: query.q,
        categoryCode: query.category,
        priceRange: query.priceRange,
        vehicleType: query.vehicleType,
        onlyDiscounted: query.onlyDiscounted,
        sortBy: query.sortBy,
        page: query.page,
        limit: query.limit,
      });

      return {
        items: result.items.map((item) => item.toJSON()),
        meta: result.meta,
      };
    });
  }
}
