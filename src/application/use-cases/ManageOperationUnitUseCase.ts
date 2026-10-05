import { 
  IOperationUnitRepository, 
  CreateOperationUnitDTO, 
  UpdateOperationUnitDTO, 
  OperationUnitTreeNode 
} from '../../domain/repositories/IOperationUnitRepository';
import { OperationUnit } from '../../domain/entities/OperationUnit';

export class ManageOperationUnitUseCase {
  constructor(private readonly ouRepo: IOperationUnitRepository) {}

  async getAll(filters?: { type?: string; status?: boolean; search?: string }): Promise<OperationUnit[]> {
    return this.ouRepo.findAll(filters);
  }

  async getTree(): Promise<OperationUnitTreeNode[]> {
    return this.ouRepo.findTree();
  }

  async getById(id: string): Promise<{
    unit: OperationUnit;
    lineage?: {
      areaOffice?: { id: string; code: string; name: string } | null;
      regional?: { id: string; code: string; name: string } | null;
      headOffice?: { id: string; code: string; name: string } | null;
      breadcrumb: string;
    };
  }> {
    const unit = await this.ouRepo.findById(id);
    if (!unit) {
      throw new Error(`Operation Unit dengan ID ${id} tidak ditemukan.`);
    }

    const lineage = await this.ouRepo.getHierarchyLineage(id);
    return { unit, lineage };
  }

  async create(dto: CreateOperationUnitDTO): Promise<OperationUnit> {
    if (!dto.code || !dto.name || !dto.type) {
      throw new Error('Kode, Nama, dan Tipe Unit wajib diisi.');
    }

    const existingCode = await this.ouRepo.findByCode(dto.code);
    if (existingCode) {
      throw new Error(`Unit dengan kode "${dto.code}" sudah digunakan.`);
    }

    // Jika tipe bukan HEAD_OFFICE, wajib memiliki parentId
    if (dto.type !== 'HEAD_OFFICE') {
      if (!dto.parentId) {
        throw new Error(`Unit dengan tipe "${dto.type}" wajib menginduk ke unit parent.`);
      }

      const parent = await this.ouRepo.findById(dto.parentId);
      if (!parent) {
        throw new Error(`Parent unit dengan ID ${dto.parentId} tidak ditemukan.`);
      }
    }

    return this.ouRepo.create(dto);
  }

  async update(id: string, dto: UpdateOperationUnitDTO): Promise<OperationUnit> {
    const existing = await this.ouRepo.findById(id);
    if (!existing) {
      throw new Error(`Operation Unit dengan ID ${id} tidak ditemukan.`);
    }

    if (dto.code && dto.code !== existing.code) {
      const codeTaken = await this.ouRepo.findByCode(dto.code);
      if (codeTaken) {
        throw new Error(`Unit dengan kode "${dto.code}" sudah digunakan.`);
      }
    }

    // Hindari circular parent (unit tidak boleh menjadi parent dirinya sendiri)
    if (dto.parentId) {
      if (dto.parentId === id) {
        throw new Error('Unit tidak dapat menginduk ke dirinya sendiri.');
      }
      const parent = await this.ouRepo.findById(dto.parentId);
      if (!parent) {
        throw new Error(`Parent unit dengan ID ${dto.parentId} tidak ditemukan.`);
      }
    }

    return this.ouRepo.update(id, dto);
  }

  async delete(id: string): Promise<boolean> {
    const existing = await this.ouRepo.findById(id);
    if (!existing) {
      throw new Error(`Operation Unit dengan ID ${id} tidak ditemukan.`);
    }

    const childCount = await this.ouRepo.countChildren(id);
    if (childCount > 0) {
      throw new Error(`Unit tidak dapat dihapus karena masih memiliki ${childCount} unit bawahan.`);
    }

    const employeeCount = await this.ouRepo.countEmployees(id);
    if (employeeCount > 0) {
      throw new Error(`Unit tidak dapat dihapus karena masih memiliki ${employeeCount} karyawan terdaftar.`);
    }

    return this.ouRepo.delete(id);
  }
}
