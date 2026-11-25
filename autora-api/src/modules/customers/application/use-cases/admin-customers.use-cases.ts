import { Inject, Injectable } from "@nestjs/common";
import { ApiPropertyOptional } from "@nestjs/swagger";
import { Type } from "class-transformer";
import { IsIn, IsInt, IsOptional, IsString, Max, Min } from "class-validator";
import type { PaginatedResult } from "@core/domain/repository.interface";
import { EntityNotFoundException } from "@core/exceptions/domain.exception";
import {
  CUSTOMER_REPOSITORY,
  type CustomerListItemDto,
  type CustomerProfileDto,
  type CustomerStatusValue,
  type ICustomerRepository,
} from "../../domain/repositories/customer.repository.interface";

const CUSTOMER_STATUSES: readonly CustomerStatusValue[] = [
  "ACTIVE",
  "INACTIVE",
  "SUSPENDED",
];

export class AdminCustomerQueryDto {
  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page: number = 1;

  @ApiPropertyOptional({ default: 15 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit: number = 15;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ enum: CUSTOMER_STATUSES })
  @IsOptional()
  @IsIn(CUSTOMER_STATUSES)
  status?: CustomerStatusValue;
}

@Injectable()
export class AdminCustomersUseCases {
  constructor(
    @Inject(CUSTOMER_REPOSITORY)
    private readonly customerRepo: ICustomerRepository
  ) {}

  async listCustomers(
    query: AdminCustomerQueryDto
  ): Promise<PaginatedResult<CustomerListItemDto>> {
    return this.customerRepo.findManyAdmin({
      page: query.page,
      limit: query.limit,
      search: query.search,
      status: query.status,
    });
  }

  async getCustomerProfile(id: string): Promise<CustomerProfileDto> {
    const profile = await this.customerRepo.findProfileById(id);
    if (!profile) {
      throw new EntityNotFoundException("Khách hàng", id);
    }
    return profile;
  }
}

