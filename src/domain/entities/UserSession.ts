export interface UserSessionProps {
  id: string;
  userId: string;
  refreshTokenHash: string;
  ipAddress?: string | null;
  userAgent?: string | null;
  isRevoked: boolean;
  expiresAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

export class UserSession {
  public readonly id: string;
  public readonly userId: string;
  public readonly refreshTokenHash: string;
  public readonly ipAddress: string | null;
  public readonly userAgent: string | null;
  public isRevoked: boolean;
  public readonly expiresAt: Date;
  public readonly createdAt: Date;
  public readonly updatedAt: Date;

  constructor(props: UserSessionProps) {
    this.id = props.id;
    this.userId = props.userId;
    this.refreshTokenHash = props.refreshTokenHash;
    this.ipAddress = props.ipAddress ?? null;
    this.userAgent = props.userAgent ?? null;
    this.isRevoked = props.isRevoked;
    this.expiresAt = props.expiresAt;
    this.createdAt = props.createdAt;
    this.updatedAt = props.updatedAt;
  }

  public isValid(): boolean {
    if (this.isRevoked) return false;
    return new Date() < this.expiresAt;
  }

  public revoke(): void {
    this.isRevoked = true;
  }
}
