import { BaseEntity } from "@core/domain/entity.base";
import { generateUuidV7 } from "@core/utils/uuid.util";

export type UserStatusType = "ACTIVE" | "INACTIVE" | "SUSPENDED";

export interface UserProps {
  email: string;
  phone: string | null;
  passwordHash: string;
  fullName: string;
  avatarUrl: string | null;
  status: UserStatusType;
  roles: string[];
  lastLoginAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}

export class UserEntity extends BaseEntity<UserProps> {
  private constructor(id: string, props: UserProps) {
    super(id, props);
  }

  static createNew(params: {
    email: string;
    phone?: string;
    passwordHash: string;
    fullName: string;
    roles?: string[];
  }): UserEntity {
    const now = new Date();
    return new UserEntity(generateUuidV7(), {
      email: params.email.trim().toLowerCase(),
      phone: params.phone?.trim() || null,
      passwordHash: params.passwordHash,
      fullName: params.fullName.trim(),
      avatarUrl: null,
      status: "ACTIVE",
      roles: params.roles && params.roles.length > 0 ? [...params.roles] : ["customer"],
      lastLoginAt: null,
      createdAt: now,
      updatedAt: now,
      deletedAt: null,
    });
  }

  static reconstitute(id: string, props: UserProps): UserEntity {
    return new UserEntity(id, props);
  }

  get email(): string {
    return this.props.email;
  }

  get phone(): string | null {
    return this.props.phone;
  }

  get passwordHash(): string {
    return this.props.passwordHash;
  }

  get fullName(): string {
    return this.props.fullName;
  }

  get avatarUrl(): string | null {
    return this.props.avatarUrl;
  }

  get status(): UserStatusType {
    return this.props.status;
  }

  get roles(): readonly string[] {
    return this.props.roles;
  }

  get lastLoginAt(): Date | null {
    return this.props.lastLoginAt;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  isActive(): boolean {
    return this.props.status === "ACTIVE" && this.props.deletedAt === null;
  }

  markLoggedIn(): void {
    this.props.lastLoginAt = new Date();
    this.props.updatedAt = new Date();
  }
}
