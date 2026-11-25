import { Inject, Injectable } from "@nestjs/common";
import { EntityNotFoundException } from "@core/exceptions/domain.exception";
import {
  GARAGE_REPOSITORY,
  type GarageDetailDto,
  type IGarageRepository,
} from "../../domain/repositories/garage.repository.interface";

@Injectable()
export class GetAdminGarageDetailsUseCase {
  constructor(
    @Inject(GARAGE_REPOSITORY)
    private readonly garageRepo: IGarageRepository
  ) {}

  async execute(id: string): Promise<GarageDetailDto> {
    const detail = await this.garageRepo.findDetailById(id);
    if (!detail) {
      throw new EntityNotFoundException("Garage", id);
    }
    return detail;
  }
}

