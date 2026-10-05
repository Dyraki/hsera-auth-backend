import { Request, Response } from 'express';
import { LoginUseCase } from '../../application/use-cases/LoginUseCase';
import { RefreshTokenUseCase } from '../../application/use-cases/RefreshTokenUseCase';
import { LogoutUseCase } from '../../application/use-cases/LogoutUseCase';
import { SessionManagementUseCase } from '../../application/use-cases/SessionManagementUseCase';
import { PrismaUserRepository } from '../../infrastructure/database/repositories/PrismaUserRepository';
import { PrismaLoginLogRepository } from '../../infrastructure/database/repositories/PrismaLoginLogRepository';
import { PrismaUserSessionRepository } from '../../infrastructure/database/repositories/PrismaUserSessionRepository';
import { PrismaKaryawanRepository } from '../../infrastructure/database/repositories/PrismaKaryawanRepository';
import { PrismaOperationUnitRepository } from '../../infrastructure/database/repositories/PrismaOperationUnitRepository';
import { LegacyHasher } from '../../infrastructure/security/LegacyHasher';
import { JwtService } from '../../infrastructure/security/JwtService';

const COOKIE_NAME = 'refreshToken';
const REFRESH_COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  path: '/',
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 hari
};

export class AuthController {
  private static readonly userRepository = new PrismaUserRepository();
  private static readonly logRepository = new PrismaLoginLogRepository();
  private static readonly sessionRepository = new PrismaUserSessionRepository();
  private static readonly karyawanRepository = new PrismaKaryawanRepository();
  private static readonly ouRepository = new PrismaOperationUnitRepository();
  private static readonly passwordHasher = new LegacyHasher();
  private static readonly tokenService = new JwtService();

  private static readonly loginUseCase = new LoginUseCase(
    AuthController.userRepository,
    AuthController.logRepository,
    AuthController.passwordHasher,
    AuthController.tokenService,
    AuthController.sessionRepository,
    AuthController.karyawanRepository,
    AuthController.ouRepository
  );

  private static readonly refreshTokenUseCase = new RefreshTokenUseCase(
    AuthController.userRepository,
    AuthController.sessionRepository,
    AuthController.tokenService,
    AuthController.karyawanRepository,
    AuthController.ouRepository
  );

  private static readonly logoutUseCase = new LogoutUseCase(
    AuthController.sessionRepository,
    AuthController.tokenService
  );

  private static readonly sessionManagementUseCase = new SessionManagementUseCase(
    AuthController.sessionRepository,
    AuthController.tokenService
  );

  public static async login(req: Request, res: Response): Promise<void> {
    try {
      const { username, password } = req.body;
      const ipAddress = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || req.ip;
      const userAgent = req.headers['user-agent'] || null;

      const result = await AuthController.loginUseCase.execute({
        username,
        password,
        ipAddress: typeof ipAddress === 'string' ? ipAddress.split(',')[0].trim() : null,
        userAgent,
      });

      // Simpan refresh token ke dalam HttpOnly cookie untuk keamanan Anti-XSS
      res.cookie(COOKIE_NAME, result.refreshToken, REFRESH_COOKIE_OPTIONS);

      res.status(200).json(result);
    } catch (error: any) {
      res.status(400).json({ message: error.message || 'Proses masuk gagal.' });
    }
  }

  public static async refresh(req: Request, res: Response): Promise<void> {
    try {
      // Ambil token dari HttpOnly cookie atau body fallback
      const token = req.cookies?.[COOKIE_NAME] || req.body?.refreshToken;
      if (!token) {
        res.status(401).json({ message: 'Refresh token tidak ditemukan. Silakan login kembali.' });
        return;
      }

      const ipAddress = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || req.ip;
      const userAgent = req.headers['user-agent'] || null;

      const result = await AuthController.refreshTokenUseCase.execute({
        refreshToken: token,
        ipAddress: typeof ipAddress === 'string' ? ipAddress.split(',')[0].trim() : null,
        userAgent,
      });

      // Set cookie baru hasil rotasi token (Refresh Token Rotation)
      res.cookie(COOKIE_NAME, result.refreshToken, REFRESH_COOKIE_OPTIONS);

      res.status(200).json(result);
    } catch (error: any) {
      res.clearCookie(COOKIE_NAME, { path: '/' });
      res.status(401).json({ message: error.message || 'Sesi tidak valid.' });
    }
  }

  public static async logout(req: Request, res: Response): Promise<void> {
    try {
      const token = req.cookies?.[COOKIE_NAME] || req.body?.refreshToken;
      const sessionId = req.body?.sessionId;

      await AuthController.logoutUseCase.execute({
        refreshToken: token,
        sessionId,
      });

      res.clearCookie(COOKIE_NAME, { path: '/' });
      res.status(200).json({ message: 'Berhasil keluar.' });
    } catch (error: any) {
      res.clearCookie(COOKIE_NAME, { path: '/' });
      res.status(200).json({ message: 'Berhasil keluar.' });
    }
  }

  public static async profile(req: any, res: Response): Promise<void> {
    res.status(200).json({ user: req.user });
  }

  public static async getSessions(req: any, res: Response): Promise<void> {
    try {
      const userId = req.user.sub;
      const currentToken = req.cookies?.[COOKIE_NAME] || req.headers['x-refresh-token'];

      const sessions = await AuthController.sessionManagementUseCase.getActiveSessions(
        userId,
        typeof currentToken === 'string' ? currentToken : undefined
      );

      res.status(200).json(sessions);
    } catch (error: any) {
      res.status(400).json({ message: error.message || 'Gagal mengambil daftar sesi.' });
    }
  }

  public static async revokeSession(req: any, res: Response): Promise<void> {
    try {
      const userId = req.user.sub;
      const { sessionId } = req.params;

      await AuthController.sessionManagementUseCase.revokeSession(userId, sessionId);

      res.status(200).json({ message: 'Sesi berhasil dinonaktifkan.' });
    } catch (error: any) {
      res.status(400).json({ message: error.message || 'Gagal menonaktifkan sesi.' });
    }
  }

  public static async logoutAll(req: any, res: Response): Promise<void> {
    try {
      const userId = req.user.sub;

      await AuthController.sessionManagementUseCase.revokeAllSessions(userId);
      res.clearCookie(COOKIE_NAME, { path: '/' });

      res.status(200).json({ message: 'Seluruh sesi perangkat berhasil dicabut.' });
    } catch (error: any) {
      res.status(400).json({ message: error.message || 'Gagal mencabut sesi.' });
    }
  }
}
