import { IUserRepository } from '../../domain/repositories/IUserRepository';
import { ILoginLogRepository } from '../../domain/repositories/ILoginLogRepository';
import { IKaryawanRepository } from '../../domain/repositories/IKaryawanRepository';
import { IOperationUnitRepository } from '../../domain/repositories/IOperationUnitRepository';
import { IUserSessionRepository } from '../../domain/repositories/IUserSessionRepository';

export interface LoginRequestDto {
  username: string;
  password: string;
  ipAddress?: string | null;
  userAgent?: string | null;
}

export interface UserScopeContext {
  isSuperAdmin: boolean;
  unitId?: string | null;
  unitCode?: string | null;
  unitName?: string | null;
  unitType?: string | null;
  allowedUnitIds: string[];
}

export interface LoginResponseDto {
  accessToken: string;
  refreshToken: string;
  user: {
    id: string;
    username: string;
    jenis: string;
    idRelasi: string | null;
    karyawan?: {
      id: string;
      employeeNumber: string;
      nik: string;
      legalName: string;
      operationUnitId: string;
      unitName?: string;
      unitType?: string;
      breadcrumb?: string;
    } | null;
    scope: UserScopeContext;
  };
}

export interface IPasswordHasher {
  compare(plain: string, hashed: string): boolean;
  hash(plain: string): string;
  hashLegacy?(plain: string): string;
  needsRehash?(hashed: string): boolean;
}

export interface ITokenService {
  sign(payload: any, expiresIn?: string): string;
  generateRefreshToken(): string;
  hashRefreshToken(token: string): string;
}

export class LoginUseCase {
  constructor(
    private readonly userRepository: IUserRepository,
    private readonly logRepository: ILoginLogRepository,
    private readonly passwordHasher: IPasswordHasher,
    private readonly tokenService: ITokenService,
    private readonly sessionRepository?: IUserSessionRepository,
    private readonly karyawanRepository?: IKaryawanRepository,
    private readonly ouRepository?: IOperationUnitRepository
  ) {}

  async execute(request: LoginRequestDto): Promise<LoginResponseDto> {
    const user = await this.userRepository.findByUsername(request.username);

    // 1. Cek User Exist
    if (!user) {
      throw new Error('Username atau password tidak cocok.');
    }

    // 2. Verifikasi Password (Bcrypt / Legacy SHA1)
    const isPasswordValid = this.passwordHasher.compare(request.password, user.passwordHash);
    if (!isPasswordValid) {
      await this.logRepository.create(user.id, 'GAGAL', null, 'Password salah');
      throw new Error('Username atau password tidak cocok.');
    }

    // 2.1 Transparent Lazy Migration: jika masih format legacy, otomatis re-hash ke bcrypt
    if (this.passwordHasher.needsRehash && this.passwordHasher.needsRehash(user.passwordHash)) {
      try {
        const newBcryptHash = this.passwordHasher.hash(request.password);
        await this.userRepository.update(user.id, { passwordHash: newBcryptHash });
      } catch (err) {
        console.error(`Gagal melakukan lazy rehash password untuk user ${user.username}:`, err);
      }
    }

    // 3. Verifikasi Akun Aktif (Status & Tanggal)
    if (!user.isAccountActive()) {
      await this.logRepository.create(user.id, 'GAGAL', null, 'Akun kadaluarsa / nonaktif');
      throw new Error('Akun Anda dinonaktifkan atau masa aktif telah berakhir.');
    }

    // 4. Ambil Hak Akses / ACL Menu
    const permissions = await this.userRepository.findPermissionsByUserId(user.id);

    // 5. Cek Scope Organisasi & Profil Karyawan
    const isSuperAdmin = user.jenis === 'SA' || user.username === 'admin';
    let employeeData = null;
    let scopeContext: UserScopeContext = {
      isSuperAdmin,
      unitId: null,
      unitCode: null,
      unitName: null,
      unitType: null,
      allowedUnitIds: []
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
            // Super Admin dapat mengakses semua unit
            const allUnits = await this.ouRepository.findAll();
            allowedUnitIds = allUnits.map(u => u.id);
          } else {
            // Mengambil unit penempatan dan seluruh descendant-nya
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
            breadcrumb: lineage?.breadcrumb || unit?.name
          };

          scopeContext = {
            isSuperAdmin,
            unitId: emp.operationUnitId,
            unitCode: unit?.code || null,
            unitName: unit?.name || null,
            unitType: unit?.type || null,
            allowedUnitIds
          };
        }
      } catch (err) {
        console.error('Error fetching employee scope on login:', err);
      }
    }

    // 6. Generate Short-Lived Access Token (15 menit)
    const tokenPayload = {
      sub: user.id,
      username: user.username,
      jenis: user.jenis,
      idRelasi: user.idRelasi,
      karyawan: employeeData,
      scope: scopeContext,
      permissions: permissions.map(p => ({
        menuId: p.menuId,
        enable: p.enable,
        level: p.level
      }))
    };

    const accessToken = this.tokenService.sign(tokenPayload);

    // 7. Generate Refresh Token & Simpan User Session (7 hari)
    const rawRefreshToken = this.tokenService.generateRefreshToken();
    const refreshTokenHash = this.tokenService.hashRefreshToken(rawRefreshToken);
    const sessionExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 Hari

    if (this.sessionRepository) {
      await this.sessionRepository.create({
        userId: user.id,
        refreshTokenHash,
        ipAddress: request.ipAddress || null,
        userAgent: request.userAgent || null,
        expiresAt: sessionExpiresAt,
      });
    }

    // 8. Catat Log Sukses
    await this.logRepository.create(user.id, 'SUKSES', null, 'Login berhasil');

    return {
      accessToken,
      refreshToken: rawRefreshToken,
      user: {
        id: user.id,
        username: user.username,
        jenis: user.jenis,
        idRelasi: user.idRelasi,
        karyawan: employeeData,
        scope: scopeContext
      }
    };
  }
}
