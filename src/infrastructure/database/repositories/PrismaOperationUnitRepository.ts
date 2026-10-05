import { 
  IOperationUnitRepository, 
  CreateOperationUnitDTO, 
  UpdateOperationUnitDTO, 
  OperationUnitTreeNode 
} from '../../../domain/repositories/IOperationUnitRepository';
import { OperationUnit, OperationUnitProps } from '../../../domain/entities/OperationUnit';
import { PrismaService } from '../PrismaService';

export class PrismaOperationUnitRepository implements IOperationUnitRepository {
  private readonly prisma = PrismaService.getClient();

  private toProps(db: any): OperationUnitProps {
    return {
      id: db.id,
      parentId: db.parentId,
      code: db.code,
      name: db.name,
      type: db.type,
      category: db.category,
      distributionPoint: db.distributionPoint,
      address: db.address,
      provinceId: db.provinceId,
      cityId: db.cityId,
      districtId: db.districtId,
      villageId: db.villageId,
      postalCode: db.postalCode,
      phone: db.phone,
      latitude: db.latitude ? Number(db.latitude) : null,
      longitude: db.longitude ? Number(db.longitude) : null,
      buildingStatus: db.buildingStatus,
      leaseCategory: db.leaseCategory,
      leaseStartDate: db.leaseStartDate,
      leaseEndDate: db.leaseEndDate,
      annualRent: db.annualRent ? Number(db.annualRent) : null,
      legalDocumentType: db.legalDocumentType,
      legalDocumentNumber: db.legalDocumentNumber,
      status: db.status,
      createdAt: db.createdAt,
      createdBy: db.createdBy,
      updatedAt: db.updatedAt,
      updatedBy: db.updatedBy,
      parentName: db.parent?.name || null,
      parentCode: db.parent?.code || null,
    };
  }

  async findById(id: string): Promise<OperationUnit | null> {
    const db = await this.prisma.operationUnit.findUnique({
      where: { id },
      include: {
        parent: {
          select: { id: true, code: true, name: true, type: true }
        }
      }
    });

    if (!db) return null;
    return new OperationUnit(this.toProps(db));
  }

  async findByCode(code: string): Promise<OperationUnit | null> {
    const db = await this.prisma.operationUnit.findUnique({
      where: { code }
    });

    if (!db) return null;
    return new OperationUnit(this.toProps(db));
  }

  async findAll(filters?: { type?: string; status?: boolean; search?: string }): Promise<OperationUnit[]> {
    const where: any = {};
    if (filters?.type) where.type = filters.type;
    if (filters?.status !== undefined) where.status = filters.status;
    if (filters?.search) {
      where.OR = [
        { code: { contains: filters.search, mode: 'insensitive' } },
        { name: { contains: filters.search, mode: 'insensitive' } },
        { address: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    const items = await this.prisma.operationUnit.findMany({
      where,
      include: {
        parent: {
          select: { id: true, code: true, name: true, type: true }
        }
      },
      orderBy: [
        { type: 'asc' },
        { code: 'asc' }
      ]
    });

    return items.map(item => new OperationUnit(this.toProps(item)));
  }

  async findTree(): Promise<OperationUnitTreeNode[]> {
    const allUnits = await this.prisma.operationUnit.findMany({
      orderBy: [
        { type: 'asc' },
        { code: 'asc' }
      ]
    });

    const map = new Map<string, OperationUnitTreeNode>();
    const roots: OperationUnitTreeNode[] = [];

    // Inisialisasi semua node
    for (const item of allUnits) {
      map.set(item.id, {
        ...this.toProps(item),
        children: []
      });
    }

    // Bangun relasi parent-child
    for (const item of allUnits) {
      const node = map.get(item.id)!;
      if (item.parentId && map.has(item.parentId)) {
        map.get(item.parentId)!.children!.push(node);
      } else {
        roots.push(node);
      }
    }

    return roots;
  }

  async getAllDescendantIds(unitId: string): Promise<string[]> {
    const result = await this.prisma.$queryRaw<{ id: string }[]>`
      WITH RECURSIVE unit_hierarchy AS (
        SELECT id FROM operation_unit WHERE id = ${unitId}::uuid
        UNION ALL
        SELECT ou.id
        FROM operation_unit ou
        INNER JOIN unit_hierarchy uh ON ou.parent_id = uh.id
      )
      SELECT id::text FROM unit_hierarchy;
    `;

    return result.map(r => r.id);
  }

  async getHierarchyLineage(unitId: string): Promise<{
    unit: { id: string; code: string; name: string; type: string };
    areaOffice?: { id: string; code: string; name: string } | null;
    regional?: { id: string; code: string; name: string } | null;
    headOffice?: { id: string; code: string; name: string } | null;
    breadcrumb: string;
  }> {
    const rawChain = await this.prisma.$queryRaw<{
      id: string;
      code: string;
      name: string;
      type: string;
      parent_id: string | null;
      level: number;
    }[]>`
      WITH RECURSIVE chain AS (
        SELECT id, code, name, type, parent_id, 1 as level
        FROM operation_unit
        WHERE id = ${unitId}::uuid
        UNION ALL
        SELECT ou.id, ou.code, ou.name, ou.type, ou.parent_id, c.level + 1
        FROM operation_unit ou
        INNER JOIN chain c ON c.parent_id = ou.id
      )
      SELECT id::text, code, name, type, parent_id::text, level FROM chain ORDER BY level DESC;
    `;

    const breadcrumb = rawChain.map(n => n.name).join(' > ');
    const unitNode = rawChain[rawChain.length - 1];

    let headOffice = rawChain.find(n => n.type === 'HEAD_OFFICE') || null;
    let regional = rawChain.find(n => n.type === 'REGIONAL') || null;
    let areaOffice = rawChain.find(n => n.type === 'AREA_OFFICE') || null;

    return {
      unit: {
        id: unitNode.id,
        code: unitNode.code,
        name: unitNode.name,
        type: unitNode.type
      },
      headOffice: headOffice ? { id: headOffice.id, code: headOffice.code, name: headOffice.name } : null,
      regional: regional ? { id: regional.id, code: regional.code, name: regional.name } : null,
      areaOffice: areaOffice ? { id: areaOffice.id, code: areaOffice.code, name: areaOffice.name } : null,
      breadcrumb
    };
  }

  async create(data: CreateOperationUnitDTO): Promise<OperationUnit> {
    const created = await this.prisma.operationUnit.create({
      data: {
        parentId: data.parentId || null,
        code: data.code,
        name: data.name,
        type: data.type,
        category: data.category,
        distributionPoint: data.distributionPoint,
        address: data.address,
        provinceId: data.provinceId,
        cityId: data.cityId,
        districtId: data.districtId,
        villageId: data.villageId,
        postalCode: data.postalCode,
        phone: data.phone,
        latitude: data.latitude !== undefined && data.latitude !== null ? data.latitude : null,
        longitude: data.longitude !== undefined && data.longitude !== null ? data.longitude : null,
        buildingStatus: data.buildingStatus,
        leaseCategory: data.leaseCategory,
        leaseStartDate: data.leaseStartDate,
        leaseEndDate: data.leaseEndDate,
        annualRent: data.annualRent !== undefined && data.annualRent !== null ? data.annualRent : null,
        legalDocumentType: data.legalDocumentType,
        legalDocumentNumber: data.legalDocumentNumber,
        status: data.status !== undefined ? data.status : true,
        createdBy: data.createdBy || null
      },
      include: {
        parent: {
          select: { id: true, code: true, name: true, type: true }
        }
      }
    });

    return new OperationUnit(this.toProps(created));
  }

  async update(id: string, data: UpdateOperationUnitDTO): Promise<OperationUnit> {
    const updateData: any = {};
    if (data.parentId !== undefined) updateData.parentId = data.parentId || null;
    if (data.code !== undefined) updateData.code = data.code;
    if (data.name !== undefined) updateData.name = data.name;
    if (data.type !== undefined) updateData.type = data.type;
    if (data.category !== undefined) updateData.category = data.category;
    if (data.distributionPoint !== undefined) updateData.distributionPoint = data.distributionPoint;
    if (data.address !== undefined) updateData.address = data.address;
    if (data.provinceId !== undefined) updateData.provinceId = data.provinceId;
    if (data.cityId !== undefined) updateData.cityId = data.cityId;
    if (data.districtId !== undefined) updateData.districtId = data.districtId;
    if (data.villageId !== undefined) updateData.villageId = data.villageId;
    if (data.postalCode !== undefined) updateData.postalCode = data.postalCode;
    if (data.phone !== undefined) updateData.phone = data.phone;
    if (data.latitude !== undefined) updateData.latitude = data.latitude;
    if (data.longitude !== undefined) updateData.longitude = data.longitude;
    if (data.buildingStatus !== undefined) updateData.buildingStatus = data.buildingStatus;
    if (data.leaseCategory !== undefined) updateData.leaseCategory = data.leaseCategory;
    if (data.leaseStartDate !== undefined) updateData.leaseStartDate = data.leaseStartDate;
    if (data.leaseEndDate !== undefined) updateData.leaseEndDate = data.leaseEndDate;
    if (data.annualRent !== undefined) updateData.annualRent = data.annualRent;
    if (data.legalDocumentType !== undefined) updateData.legalDocumentType = data.legalDocumentType;
    if (data.legalDocumentNumber !== undefined) updateData.legalDocumentNumber = data.legalDocumentNumber;
    if (data.status !== undefined) updateData.status = data.status;
    if (data.updatedBy !== undefined) updateData.updatedBy = data.updatedBy;

    const updated = await this.prisma.operationUnit.update({
      where: { id },
      data: updateData,
      include: {
        parent: {
          select: { id: true, code: true, name: true, type: true }
        }
      }
    });

    return new OperationUnit(this.toProps(updated));
  }

  async delete(id: string): Promise<boolean> {
    await this.prisma.operationUnit.delete({
      where: { id }
    });
    return true;
  }

  async countChildren(id: string): Promise<number> {
    return this.prisma.operationUnit.count({
      where: { parentId: id }
    });
  }

  async countEmployees(id: string): Promise<number> {
    return this.prisma.karyawan.count({
      where: { operationUnitId: id }
    });
  }
}
