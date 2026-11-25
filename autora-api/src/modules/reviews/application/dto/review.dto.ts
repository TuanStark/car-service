import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { Transform, Type } from "class-transformer";
import {
  IsBoolean,
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  MinLength,
} from "class-validator";

export class ReviewQueryDto {
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

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(5)
  ratingMax?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @Transform(({ value }) =>
    value === "true" ? true : value === "false" ? false : value
  )
  @IsBoolean()
  isHidden?: boolean;
}

export class ReplyReviewDto {
  @ApiProperty()
  @IsString()
  @MinLength(3)
  @MaxLength(1500)
  adminReply!: string;
}

export class ToggleReviewHiddenDto {
  @ApiProperty()
  @IsBoolean()
  isHidden!: boolean;
}

