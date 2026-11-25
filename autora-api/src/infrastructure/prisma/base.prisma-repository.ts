import type {
  PaginatedResult,
  PaginationMeta,
  PaginationParams,
} from "@core/domain/repository.interface";

export abstract class BasePrismaRepository {
  protected buildPaginationMeta(
    params: PaginationParams,
    totalItems: number
  ): PaginationMeta {
    const safeLimit = Math.max(1, params.limit);
    const totalPages = Math.max(1, Math.ceil(totalItems / safeLimit));
    const safePage = Math.min(Math.max(1, params.page), totalPages);

    return {
      page: safePage,
      limit: safeLimit,
      totalItems,
      totalPages,
      hasNextPage: safePage < totalPages,
      hasPrevPage: safePage > 1,
    };
  }

  protected toPaginatedResult<T>(
    items: readonly T[],
    params: PaginationParams,
    totalItems: number
  ): PaginatedResult<T> {
    return {
      items,
      meta: this.buildPaginationMeta(params, totalItems),
    };
  }
}
