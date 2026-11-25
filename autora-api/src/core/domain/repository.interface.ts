export interface PaginationParams {
  readonly page: number;
  readonly limit: number;
}

export interface PaginationMeta {
  readonly page: number;
  readonly limit: number;
  readonly totalItems: number;
  readonly totalPages: number;
  readonly hasNextPage: boolean;
  readonly hasPrevPage: boolean;
}

export interface PaginatedResult<T> {
  readonly items: readonly T[];
  readonly meta: PaginationMeta;
}

export interface IBaseRepository<TEntity, TId = string> {
  findById(id: TId): Promise<TEntity | null>;
  save(entity: TEntity): Promise<TEntity>;
  softDelete(id: TId): Promise<void>;
}
