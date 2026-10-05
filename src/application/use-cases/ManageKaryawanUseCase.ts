import { 
  IKaryawanRepository, 
  CreateKaryawanDTO, 
  UpdateKaryawanDTO, 
  KaryawanDetail, 
  FindKaryawanParams 
} from '../../domain/repositories/IKaryawanRepository';
import { IOperationUnitRepository } from '../../domain/repositories/IOperationUnitRepository';
import { Karyawan } from '../../domain/entities/Karyawan';

export class ManageKaryawanUseCase {
  constructor(
    private readonly karyawanRepo: IKaryawanRepository,
    private readonly ouRepo: IOperationUnitRepository
  ) {}

  async getAll(params: FindKaryawanParams, scopeContext?: { isSuperAdmin: boolean; allowedUnitIds?: string[] }): Promise<{
    data: KaryawanDetail[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const finalParams = { ...params };

    // Jika bukan Super Admin dan memiliki scope wilayah, batasi query sesuai unit yang diizinkan
    if (scopeContext && !scopeContext.isSuperAdmin && scopeContext.allowedUnitIds && scopeContext.allowedUnitIds.length > 0) {
      finalParams.allowedUnitIds = scopeContext.allowedUnitIds;
    }

    const result = await this.karyawanRepo.findAll(finalParams);

    // Lengkapi breadcrumb path untuk setiap karyawan
    for (const item of result.data) {
      if (item.operationUnit?.id) {
        try {
          const lineage = await this.ouRepo.getHierarchyLineage(item.operationUnit.id);
          item.operationUnit.hierarchyPath = lineage.breadcrumb;
        } catch {
          item.operationUnit.hierarchyPath = item.operationUnit.name;
        }
      }
    }

    return result;
  }

  async getById(id: string): Promise<{
    karyawan: KaryawanDetail;
    lineage?: {
      areaOffice?: { id: string; code: string; name: string } | null;
      regional?: { id: string; code: string; name: string } | null;
      headOffice?: { id: string; code: string; name: string } | null;
      breadcrumb: string;
    };
  }> {
    const karyawan = await this.karyawanRepo.findById(id);
    if (!karyawan) {
      throw new Error(`Karyawan dengan ID ${id} tidak ditemukan.`);
    }

    let lineage;
    if (karyawan.operationUnit?.id) {
      try {
        lineage = await this.ouRepo.getHierarchyLineage(karyawan.operationUnit.id);
        karyawan.operationUnit.hierarchyPath = lineage.breadcrumb;
      } catch {
        // Fallback jika tidak ada lineage
      }
    }

    return { karyawan, lineage };
  }

  async create(dto: CreateKaryawanDTO): Promise<Karyawan> {
    if (!dto.operationUnitId || !dto.employeeNumber || !dto.nik || !dto.legalName) {
      throw new Error('Unit Penempatan, Nomor Karyawan, NIK, dan Nama Lengkap wajib diisi.');
    }

    // Validasi unit
    const unit = await this.ouRepo.findById(dto.operationUnitId);
    if (!unit) {
      throw new Error(`Operation Unit dengan ID ${dto.operationUnitId} tidak ditemukan.`);
    }

    // Validasi keunikan employeeNumber
    const existingEmpNum = await this.karyawanRepo.findByEmployeeNumber(dto.employeeNumber);
    if (existingEmpNum) {
      throw new Error(`Nomor Karyawan "${dto.employeeNumber}" sudah digunakan.`);
    }

    // Validasi keunikan NIK
    const existingNik = await this.karyawanRepo.findByNik(dto.nik);
    if (existingNik) {
      throw new Error(`NIK "${dto.nik}" sudah terdaftar.`);
    }

    // Validasi keunikan Email jika diisi
    if (dto.email) {
      const existingEmail = await this.karyawanRepo.findByEmail(dto.email);
      if (existingEmail) {
        throw new Error(`Email "${dto.email}" sudah digunakan karyawan lain.`);
      }
    }

    // Validasi supervisor jika diisi
    if (dto.supervisorId) {
      const supervisor = await this.karyawanRepo.findById(dto.supervisorId);
      if (!supervisor) {
        throw new Error(`Supervisor dengan ID ${dto.supervisorId} tidak ditemukan.`);
      }
    }

    return this.karyawanRepo.create(dto);
  }

  async update(id: string, dto: UpdateKaryawanDTO): Promise<Karyawan> {
    const existing = await this.karyawanRepo.findById(id);
    if (!existing) {
      throw new Error(`Karyawan dengan ID ${id} tidak ditemukan.`);
    }

    if (dto.operationUnitId && dto.operationUnitId !== existing.operationUnitId) {
      const unit = await this.ouRepo.findById(dto.operationUnitId);
      if (!unit) {
        throw new Error(`Operation Unit dengan ID ${dto.operationUnitId} tidak ditemukan.`);
      }
    }

    if (dto.employeeNumber && dto.employeeNumber !== existing.employeeNumber) {
      const existingEmpNum = await this.karyawanRepo.findByEmployeeNumber(dto.employeeNumber);
      if (existingEmpNum) {
        throw new Error(`Nomor Karyawan "${dto.employeeNumber}" sudah digunakan.`);
      }
    }

    if (dto.nik && dto.nik !== existing.nik) {
      const existingNik = await this.karyawanRepo.findByNik(dto.nik);
      if (existingNik) {
        throw new Error(`NIK "${dto.nik}" sudah terdaftar.`);
      }
    }

    if (dto.email && dto.email !== existing.email) {
      const existingEmail = await this.karyawanRepo.findByEmail(dto.email);
      if (existingEmail) {
        throw new Error(`Email "${dto.email}" sudah digunakan karyawan lain.`);
      }
    }

    if (dto.supervisorId) {
      if (dto.supervisorId === id) {
        throw new Error('Karyawan tidak dapat menjadi supervisor untuk dirinya sendiri.');
      }
      const supervisor = await this.karyawanRepo.findById(dto.supervisorId);
      if (!supervisor) {
        throw new Error(`Supervisor dengan ID ${dto.supervisorId} tidak ditemukan.`);
      }
    }

    return this.karyawanRepo.update(id, dto);
  }

  async delete(id: string): Promise<boolean> {
    const existing = await this.karyawanRepo.findById(id);
    if (!existing) {
      throw new Error(`Karyawan dengan ID ${id} tidak ditemukan.`);
    }

    const subordinates = await this.karyawanRepo.findSubordinates(id);
    if (subordinates.length > 0) {
      throw new Error(`Karyawan tidak dapat dihapus karena masih menjadi supervisor untuk ${subordinates.length} karyawan lain.`);
    }

    return this.karyawanRepo.delete(id);
  }

  async getSubordinates(supervisorId: string): Promise<Karyawan[]> {
    return this.karyawanRepo.findSubordinates(supervisorId);
  }
}
