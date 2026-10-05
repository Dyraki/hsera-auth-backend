import { IUserRepository } from '../../domain/repositories/IUserRepository';
import { IUserSessionRepository } from '../../domain/repositories/IUserSessionRepository';
import { IKaryawanRepository } from '../../domain/repositories/IKaryawanRepository';
import { IOperationUnitRepository } from '../../domain/repositories/IOperationUnitRepository';
import { ITokenService, UserScopeContext } from './LoginUseCase';

export interface RefreshTokenRequestDto {
  refreshToken: string;
  ipAddress?: string | null;
  userAgent?: string | null;
}

export interface RefreshTokenResponseDto {
  accessToken: string;
  refreshToken: string;
}

export class RefreshTokenUseCase {
  constructor(
    private readonly userRepository: IUserRepository,
    private readonly sessionRepository: IUserSessionRepository,
    private readonly tokenService: ITokenService,
    private readonly karyawanRepository?: IKaryawanRepository,
    private readonly ouRepository?: IOperationUnitRepository
  ) {}

  async execute(request: RefreshTokenRequestDto): Promise<RefreshTokenResponseDto> {
    if (!request.refreshToken) {
      throw new Error('Refresh token wajib disertakan.');
    }

    const currentHash = this.tokenService.hashRefreshToken(request.refreshToken);
    const session = await this.sessionRepository.findByTokenHash(currentHash);

    // 1. Cek keberadaan sesi
    if (!session) {
      throw new Error('Sesi tidak valid atau telah berakhir. Silakan login kembali.');
    }

    // 2. Deteksi Token Reuse Attack:
    // Jika token sudah revoked tapi dicoba dipakai lagi, kemungkinan token dicuri!
    // Langsung matikan seluruh sesi pengguna tersebut demi keselamatan akun.
    if (session.isRevoked) {
      await this.sessionRepository.revokeAllForUser(session.userId);
      throw new Error('Aktivitas mencurigakan terdeteksi. Seluruh sesi Anda telah dinonaktifkan.');
    }

    // 3. Cek kedaluwarsa sesi
    if (!session.isValid()) {
      throw new Error('Sesi Anda telah kedaluwarsa. Silakan login kembali.');
    }

    // 4. Cek Akun Pengguna
    const user = await this.userRepository.findById(session.userId);
    if (!user || !user.isAccountActive()) {
      await this.sessionRepository.revoke(session.id);
      throw new Error('Akun pengguna dinonaktifkan atau masa aktif telah berakhir.');
    }

    // 5. Ambil data izin (ACL) & scope terbaru
    const permissions = await this.userRepository.findPermissionsByUserId(user.id);
    const isSuperAdmin = user.jenis === 'SA' || user.username === 'admin';
    let employeeData = null;
    let scopeContext: UserScopeContext = {
      isSuperAdmin,
      unitId: null,
      unitCode: null,
      unitName: null,
      unitType: null,
      allowedUnitIds: [],
    };

    if (user.idRelasi && this.karyawanRepository && this.ouRepository) {
      try {
        const emp = await this.karyawanRepository.findById(user.idRelasi);
        if (emp && emp.operationUnitId) {
          const unit = await this.ouRepository.findById(emp.operationUnitId);
          let lineage;
          try {
            lineage = await this.ouRepository.getHierarchyLineage(emp.operationUnitId);
          } catch {
            // fallback
          }

          let allowedUnitIds: string[] = [];
          if (isSuperAdmin) {
            const allUnits = await this.ouRepository.findAll();
            allowedUnitIds = allUnits.map((u) => u.id);
          } else {
            allowedUnitIds = await this.ouRepository.getAllDescendantIds(emp.operationUnitId);
          }

          employeeData = {
            id: emp.id,
            employeeNumber: emp.employeeNumber,
            nik: emp.nik,
            legalName: emp.legalName,
            operationUnitId: emp.operationUnitId,
            unitName: unit?.name,
            unitType: unit?.type,
            breadcrumb: lineage?.breadcrumb || unit?.name,
          };

          scopeContext = {
            isSuperAdmin,
            unitId: emp.operationUnitId,
            unitCode: unit?.code || null,
            unitName: unit?.name || null,
            unitType: unit?.type || null,
            allowedUnitIds,
          };
        }
      } catch (err) {
        console.error('Error fetching employee scope on refresh token:', err);
      }
    }

    // 6. Terbitkan Access Token baru (15 Menit)
    const tokenPayload = {
      sub: user.id,
      username: user.username,
      jenis: user.jenis,
      idRelasi: user.idRelasi,
      karyawan: employeeData,
      scope: scopeContext,
      permissions: permissions.map((p) => ({
        menuId: p.menuId,
        enable: p.enable,
        level: p.level,
      })),
    };

    const newAccessToken = this.tokenService.sign(tokenPayload);

    // 7. Refresh Token Rotation (RTR):
    // Buat refresh token baru & gantikan hash lama pada sesi aktif yang sama
    const newRawRefreshToken = this.tokenService.generateRefreshToken();
    const newRefreshTokenHash = this.tokenService.hashRefreshToken(newRawRefreshToken);
    const newExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // Perpanjang 7 hari

    await this.sessionRepository.updateTokenHash(session.id, newRefreshTokenHash, newExpiresAt);

    return {
      accessToken: newAccessToken,
      refreshToken: newRawRefreshToken,
    };
  }
}
