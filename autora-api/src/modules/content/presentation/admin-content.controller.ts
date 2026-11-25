import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiTags } from "@nestjs/swagger";
import { CheckPolicies } from "@core/decorators/check-policies.decorator";
import {
  type AuthenticatedUser,
  CurrentUser,
} from "@core/decorators/current-user.decorator";
import { Public } from "@core/decorators/public.decorator";
import { PoliciesGuard } from "@core/guards/policies.guard";
import {
  ArticleQueryDto,
  CreateArticleDto,
  CreateContactInquiryDto,
  UpdateArticleDto,
  UpdateContactInquiryDto,
} from "../application/dto/content.dto";
import { ContentUseCases } from "../application/use-cases/content.use-cases";

@ApiTags("Admin Content & Leads")
@ApiBearerAuth()
@Controller({ path: "admin/content", version: "1" })
@UseGuards(PoliciesGuard)
@CheckPolicies((ability) => ability.can("manage", "all"))
export class AdminContentController {
  constructor(private readonly content: ContentUseCases) {}

  @Get("articles")
  @ApiOperation({ summary: "[Admin] Danh sách bài viết Cẩm nang" })
  async listArticles(@Query() query: ArticleQueryDto) {
    return this.content.listArticles(query);
  }

  @Post("articles")
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: "[Admin] Tạo bài viết Cẩm nang (auto-slug)" })
  async createArticle(
    @Body() dto: CreateArticleDto,
    @CurrentUser() actor: AuthenticatedUser
  ) {
    return this.content.createArticle(dto, actor);
  }

  @Patch("articles/:id")
  @ApiOperation({ summary: "[Admin] Cập nhật bài viết Cẩm nang" })
  async updateArticle(
    @Param("id", ParseUUIDPipe) id: string,
    @Body() dto: UpdateArticleDto,
    @CurrentUser() actor: AuthenticatedUser
  ) {
    return this.content.updateArticle(id, dto, actor);
  }

  @Delete("articles/:id")
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: "[Admin] Xóa bài viết Cẩm nang" })
  async deleteArticle(
    @Param("id", ParseUUIDPipe) id: string,
    @CurrentUser() actor: AuthenticatedUser
  ) {
    await this.content.deleteArticle(id, actor);
  }

  @Get("leads")
  @ApiOperation({ summary: "[Admin] Danh sách yêu cầu liên hệ từ web" })
  async listLeads() {
    return this.content.listLeads();
  }

  @Patch("leads/:id")
  @ApiOperation({ summary: "[Admin] Cập nhật trạng thái & ghi chú xử lý lead" })
  async updateLead(
    @Param("id", ParseUUIDPipe) id: string,
    @Body() dto: UpdateContactInquiryDto,
    @CurrentUser() actor: AuthenticatedUser
  ) {
    return this.content.updateLead(id, dto, actor);
  }
}

@ApiTags("Public Content & Contact")
@Controller({ path: "public", version: "1" })
export class PublicContentController {
  constructor(private readonly content: ContentUseCases) {}

  @Public()
  @Get("articles")
  @ApiOperation({ summary: "[Public] Danh sách bài viết đã xuất bản" })
  async listPublished(@Query() query: ArticleQueryDto) {
    return this.content.listArticles({ ...query, status: "PUBLISHED" });
  }

  @Public()
  @Post("contact-inquiries")
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: "[Public] Gửi form liên hệ từ autora-web" })
  async submitInquiry(@Body() dto: CreateContactInquiryDto) {
    return this.content.createPublicInquiry(dto);
  }
}

