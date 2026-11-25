import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { Type } from "class-transformer";
import {
  IsEmail,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  MinLength,
} from "class-validator";

const ARTICLE_STATUSES = ["DRAFT", "PUBLISHED"] as const;
const INQUIRY_STATUSES = ["NEW", "CONTACTED", "RESOLVED"] as const;

export class ArticleQueryDto {
  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page: number = 1;

  @ApiPropertyOptional({ default: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit: number = 20;

  @ApiPropertyOptional({ enum: ARTICLE_STATUSES })
  @IsOptional()
  @IsIn(ARTICLE_STATUSES)
  status?: (typeof ARTICLE_STATUSES)[number];
}

export class CreateArticleDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(200)
  slug?: string;

  @ApiProperty()
  @IsString()
  @MinLength(4)
  @MaxLength(240)
  title!: string;

  @ApiProperty()
  @IsString()
  @MinLength(10)
  @MaxLength(500)
  excerpt!: string;

  @ApiProperty()
  @IsString()
  @MinLength(10)
  contentMarkdown!: string;

  @ApiProperty()
  @IsString()
  @MaxLength(500)
  coverImageUrl!: string;

  @ApiProperty()
  @IsString()
  @MinLength(2)
  @MaxLength(80)
  category!: string;

  @ApiPropertyOptional({ enum: ARTICLE_STATUSES })
  @IsOptional()
  @IsIn(ARTICLE_STATUSES)
  status?: (typeof ARTICLE_STATUSES)[number];
}

export class UpdateArticleDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MinLength(4)
  @MaxLength(240)
  title?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(500)
  excerpt?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  contentMarkdown?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(500)
  coverImageUrl?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(80)
  category?: string;

  @ApiPropertyOptional({ enum: ARTICLE_STATUSES })
  @IsOptional()
  @IsIn(ARTICLE_STATUSES)
  status?: (typeof ARTICLE_STATUSES)[number];
}

export class CreateContactInquiryDto {
  @ApiProperty()
  @IsString()
  @MinLength(2)
  @MaxLength(150)
  fullName!: string;

  @ApiProperty()
  @IsString()
  @MinLength(8)
  @MaxLength(20)
  phone!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(200)
  vehicleInfo?: string;

  @ApiProperty()
  @IsString()
  @MinLength(5)
  @MaxLength(2000)
  message!: string;
}

export class UpdateContactInquiryDto {
  @ApiPropertyOptional({ enum: INQUIRY_STATUSES })
  @IsOptional()
  @IsIn(INQUIRY_STATUSES)
  status?: (typeof INQUIRY_STATUSES)[number];

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(1500)
  staffNote?: string;
}

