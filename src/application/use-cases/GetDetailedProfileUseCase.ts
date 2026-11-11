import { IUserRepository } from '../../domain/repositories/IUserRepository';
import { IKaryawanRepository } from '../../domain/repositories/IKaryawanRepository';
import { IOperationUnitRepository } from '../../domain/repositories/IOperationUnitRepository';

export interface DetailedProfileDto {
  user: {
    id: string;
    username: string;
    jenis: string;
    aktif: number;
    tgl1: Date;
    tgl2: Date;
    roleName: string | null;
    roles: Array<{ id: string; nama: string; aktif: number }>;
  };
  karyawan: {
    id: string;
    employeeNumber: string;
    nik: string;
    legalName: string;
    email: string | null;
    phone: string | null;
    sex: string | null;
    maritalStatus: string | null;
    religion: string | null;
    placeOfBirth: string | null;
    dateOfBirth: Date | null;
    lastEducation: string | null;
    address: string | null;
    postalCode: string | null;
    originalDateOfHire: Date | null;
    permanentDate: Date | null;
    bankId: string | null;
    accountName: string | null;
    accountNumber: string | null;
    status: boolean;
    operationUnit: {
      id: string;
      code: string;
      name: string;
      type: string;
      breadcrumb: string;
    } | null;
    supervisor: {
      id: string;
      employeeNumber: string;
      legalName: string;
    } | null;
  } | null;
}

export class GetDetailedProfileUseCase {
  constructor(
    private readonly userRepository: IUserRepository,
    private readonly karyawanRepository: IKaryawanRepository,
    private readonly ouRepository: IOperationUnitRepository
  ) {}

  async execute(userId: string): Promise<DetailedProfileDto> {
    const userWithRoles = await this.userRepository.findByIdWithRoles(userId);
    if (!userWithRoles) {
      throw new Error('Pengguna tidak ditemukan.');
    }

    const primaryRole = userWithRoles.roles.find((r) => r.aktif === 1)?.nama || userWithRoles.roles[0]?.nama || (userWithRoles.jenis === 'SA' ? 'SUPER ADMIN' : null);

    let karyawanDto: DetailedProfileDto['karyawan'] = null;

    if (userWithRoles.idRelasi) {
      const karyawanDetail = await this.karyawanRepository.findById(userWithRoles.idRelasi);

      if (karyawanDetail) {
        let breadcrumb = karyawanDetail.operationUnit?.name || '';

        if (karyawanDetail.operationUnitId) {
          try {
            const lineage = await this.ouRepository.getHierarchyLineage(karyawanDetail.operationUnitId);
            breadcrumb = lineage.breadcrumb || breadcrumb;
          } catch {
            // Fallback ke nama unit kerja jika lineage tidak tersedia
          }
        }

        karyawanDto = {
          id: karyawanDetail.id,
          employeeNumber: karyawanDetail.employeeNumber,
          nik: karyawanDetail.nik,
          legalName: karyawanDetail.legalName,
          email: karyawanDetail.email ?? null,
          phone: karyawanDetail.phone ?? null,
          sex: karyawanDetail.sex ?? null,
          maritalStatus: karyawanDetail.maritalStatus ?? null,
          religion: karyawanDetail.religion ?? null,
          placeOfBirth: karyawanDetail.placeOfBirth ?? null,
          dateOfBirth: karyawanDetail.dateOfBirth ?? null,
          lastEducation: karyawanDetail.lastEducation ?? null,
          address: karyawanDetail.address ?? null,
          postalCode: karyawanDetail.postalCode ?? null,
          originalDateOfHire: karyawanDetail.originalDateOfHire ?? null,
          permanentDate: karyawanDetail.permanentDate ?? null,
          bankId: karyawanDetail.bankId ?? null,
          accountName: karyawanDetail.accountName ?? null,
          accountNumber: karyawanDetail.accountNumber ?? null,
          status: karyawanDetail.status,
          operationUnit: karyawanDetail.operationUnit
            ? {
                id: karyawanDetail.operationUnit.id,
                code: karyawanDetail.operationUnit.code,
                name: karyawanDetail.operationUnit.name,
                type: karyawanDetail.operationUnit.type,
                breadcrumb,
              }
            : null,
          supervisor: karyawanDetail.supervisor
            ? {
                id: karyawanDetail.supervisor.id,
                employeeNumber: karyawanDetail.supervisor.employeeNumber,
                legalName: karyawanDetail.supervisor.legalName,
              }
            : null,
        };
      }
    }

    return {
      user: {
        id: userWithRoles.id,
        username: userWithRoles.username,
        jenis: userWithRoles.jenis,
        aktif: userWithRoles.aktif,
        tgl1: userWithRoles.tgl1,
        tgl2: userWithRoles.tgl2,
        roleName: primaryRole,
        roles: userWithRoles.roles,
      },
      karyawan: karyawanDto,
    };
  }
}
