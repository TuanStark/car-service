import { Inject, Injectable } from "@nestjs/common";
import type { PaginatedResult } from "@core/domain/repository.interface";
import {
  GARAGE_REPOSITORY,
  type GarageListItemDto,
  type IGarageRepository,
} from "../../domain/repositories/garage.repository.interface";
import type { AdminGarageQueryDto } from "../dto/admin-garage.dto";

@Injectable()
export class GetAdminGarageListUseCase {
  constructor(
    @Inject(GARAGE_REPOSITORY)
    private readonly garageRepo: IGarageRepository
  ) {}

  async execute(
    query: AdminGarageQueryDto
  ): Promise<PaginatedResult<GarageListItemDto>> {
    return this.garageRepo.findManyAdmin({
      page: query.page,
      limit: query.limit,
      search: query.search,
      cityCode: query.cityCode,
      status: query.status,
      verified: query.verified,
    });
  }
}

