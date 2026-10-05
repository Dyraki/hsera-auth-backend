import { ITokenService } from '../../application/use-cases/LoginUseCase';
import * as jwt from 'jsonwebtoken';
import * as crypto from 'crypto';

export class JwtService implements ITokenService {
  private readonly secret = process.env.JWT_SECRET || 'supersecretkeyframeworkv1coreauth';
  private readonly accessTokenExpiresIn = process.env.JWT_EXPIRES_IN || '15m';

  sign(payload: any, expiresIn?: string): string {
    return (jwt as any).sign(payload, this.secret, {
      expiresIn: expiresIn || this.accessTokenExpiresIn,
    });
  }

  verify(token: string): any {
    try {
      return jwt.verify(token, this.secret);
    } catch {
      return null;
    }
  }

  generateRefreshToken(): string {
    return crypto.randomBytes(40).toString('hex');
  }

  hashRefreshToken(token: string): string {
    return crypto.createHash('sha256').update(token).digest('hex');
  }
}
