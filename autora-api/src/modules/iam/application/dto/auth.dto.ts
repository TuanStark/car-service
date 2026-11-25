import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import {
  IsEmail,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from "class-validator";

export class RegisterDto {
  @ApiProperty({ example: "khoa.nguyen@autora.vn" })
  @IsEmail({}, { message: "Email không đúng định dạng." })
  @MaxLength(255)
  email!: string;

  @ApiProperty({ example: "Autora@2026", minLength: 8 })
  @IsString()
  @MinLength(8, { message: "Mật khẩu phải có tối thiểu 8 ký tự." })
  @MaxLength(72)
  @Matches(/^(?=.*[A-Za-z])(?=.*\d).+$/, {
    message: "Mật khẩu phải bao gồm ít nhất 1 chữ cái và 1 chữ số.",
  })
  password!: string;

  @ApiProperty({ example: "Nguyễn Đăng Khoa" })
  @IsString()
  @MinLength(2)
  @MaxLength(150)
  fullName!: string;

  @ApiPropertyOptional({ example: "0909688912" })
  @IsOptional()
  @IsString()
  @Matches(/^(0|\+84)[0-9]{8,10}$/, {
    message: "Số điện thoại Việt Nam không hợp lệ.",
  })
  phone?: string;
}

export class LoginDto {
  @ApiProperty({ example: "khoa.nguyen@autora.vn" })
  @IsEmail({}, { message: "Email không đúng định dạng." })
  email!: string;

  @ApiProperty({ example: "Autora@2026" })
  @IsString()
  @MinLength(1)
  password!: string;
}

export class RefreshTokenDto {
  @ApiPropertyOptional({
    description: "Refresh token (có thể truyền qua body hoặc HttpOnly cookie)",
  })
  @IsOptional()
  @IsString()
  refreshToken?: string;
}

export class UserProfileResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  email!: string;

  @ApiProperty()
  fullName!: string;

  @ApiPropertyOptional({ nullable: true })
  phone!: string | null;

  @ApiProperty({ type: [String] })
  roles!: readonly string[];
}

export class AuthTokensResponseDto {
  @ApiProperty()
  accessToken!: string;

  @ApiProperty()
  refreshToken!: string;

  @ApiProperty({ example: "Bearer" })
  tokenType!: "Bearer";

  @ApiProperty({ type: UserProfileResponseDto })
  user!: UserProfileResponseDto;
}
