import { Controller, Get, Param, Query } from "@nestjs/common";
import { ApiOperation, ApiTags } from "@nestjs/swagger";
import { Public } from "@core/decorators/public.decorator";
import { CatalogQueryDto } from "../application/dto/catalog-query.dto";
import { GetServiceBySlugUseCase } from "../application/use-cases/get-service-by-slug.use-case";
import { ListServicesUseCase } from "../application/use-cases/list-services.use-case";

@ApiTags("Catalog")
@Controller({ path: "services", version: "1" })
export class CatalogController {
  constructor(
    private readonly listServicesUseCase: ListServicesUseCase,
    private readonly getServiceBySlugUseCase: GetServiceBySlugUseCase
  ) {}

  @Public()
  @Get()
  @ApiOperation({ summary: "Lấy danh sách gói dịch vụ ô tô có lọc & phân trang" })
  async listServices(@Query() query: CatalogQueryDto) {
    return this.listServicesUseCase.execute(query);
  }

  @Public()
  @Get(":slug")
  @ApiOperation({ summary: "Xem chi tiết gói dịch vụ theo slug" })
  async getServiceBySlug(@Param("slug") slug: string) {
    return this.getServiceBySlugUseCase.execute(slug);
  }
}
