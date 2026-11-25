import { Inject, Injectable } from "@nestjs/common";
import { EntityNotFoundException } from "@core/exceptions/domain.exception";
import { RedisService } from "@infra/redis/redis.service";
import type { ServiceProductEntity } from "../../domain/entities/service-product.entity";
import {
  type IServiceProductRepository,
  SERVICE_PRODUCT_REPOSITORY,
} from "../../domain/repositories/service-product.repository.interface";

const SERVICE_DETAIL_CACHE_TTL_SECONDS = 300;

@Injectable()
export class GetServiceBySlugUseCase {
  constructor(
    @Inject(SERVICE_PRODUCT_REPOSITORY)
    private readonly serviceRepo: IServiceProductRepository,
    private readonly redisService: RedisService
  ) {}

  async execute(slug: string): Promise<ReturnType<ServiceProductEntity["toJSON"]>> {
    const cacheKey = `catalog:service:slug:${slug}`;

    return this.redisService.getOrSet(cacheKey, SERVICE_DETAIL_CACHE_TTL_SECONDS, async () => {
      const found = await this.serviceRepo.findBySlug(slug);
      if (!found) {
        throw new EntityNotFoundException("Gói dịch vụ", slug);
      }
      return found.toJSON();
    });
  }
}
