import { Inject, Injectable } from "@nestjs/common";
import { EventEmitter2 } from "@nestjs/event-emitter";
import { type IUnitOfWork, UNIT_OF_WORK } from "@core/domain/unit-of-work.interface";
import { EntityConflictException } from "@core/exceptions/domain.exception";
import { hashPassword } from "@core/utils/password-hasher";
import { UserEntity } from "../../domain/entities/user.entity";
import {
  USER_REGISTERED_EVENT,
  UserRegisteredEvent,
} from "../../domain/events/user-registered.event";
import {
  type IUserRepository,
  USER_REPOSITORY,
} from "../../domain/repositories/user.repository.interface";
import type { AuthTokensResponseDto, RegisterDto } from "../dto/auth.dto";
import { TokenIssuerService } from "../services/token-issuer.service";

@Injectable()
export class RegisterUseCase {
  constructor(
    @Inject(USER_REPOSITORY)
    private readonly userRepository: IUserRepository,
    @Inject(UNIT_OF_WORK)
    private readonly unitOfWork: IUnitOfWork,
    private readonly tokenIssuer: TokenIssuerService,
    private readonly eventEmitter: EventEmitter2
  ) {}

  async execute(
    dto: RegisterDto,
    meta?: { userAgent?: string; ipAddress?: string }
  ): Promise<AuthTokensResponseDto> {
    const normalizedEmail = dto.email.trim().toLowerCase();

    const result = await this.unitOfWork.runInTransaction(async () => {
      const existingByEmail = await this.userRepository.findByEmail(normalizedEmail);
      if (existingByEmail) {
        throw new EntityConflictException(
          `Email "${normalizedEmail}" đã được đăng ký.`
        );
      }

      if (dto.phone) {
        const existingByPhone = await this.userRepository.findByPhone(dto.phone.trim());
        if (existingByPhone) {
          throw new EntityConflictException(
            `Số điện thoại "${dto.phone}" đã được sử dụng.`
          );
        }
      }

      const passwordHash = await hashPassword(dto.password);
      const userEntity = UserEntity.createNew({
        email: normalizedEmail,
        phone: dto.phone,
        passwordHash,
        fullName: dto.fullName,
        roles: ["customer"],
      });

      const createdUser = await this.userRepository.createWithRoles(userEntity, [
        "customer",
      ]);

      const issued = await this.tokenIssuer.issueTokens({
        user: createdUser,
        userAgent: meta?.userAgent,
        ipAddress: meta?.ipAddress,
      });

      return { createdUser, tokens: issued.response };
    });

    this.eventEmitter.emit(
      USER_REGISTERED_EVENT,
      new UserRegisteredEvent(
        result.createdUser.id,
        result.createdUser.email,
        result.createdUser.fullName,
        result.createdUser.roles
      )
    );

    return result.tokens;
  }
}
