import { 
  IKaryawanRepository, 
  CreateKaryawanDTO, 
  UpdateKaryawanDTO, 
  KaryawanDetail, 
  FindKaryawanParams 
} from '../../../domain/repositories/IKaryawanRepository';
import { Karyawan, KaryawanProps } from '../../../domain/entities/Karyawan';
import { PrismaService } from '../PrismaService';

export class PrismaKaryawanRepository implements IKaryawanRepository {
  private readonly prisma = PrismaService.getClient();

  private toProps(db: any): KaryawanProps {
    return {
      id: db.id,
      operationUnitId: db.operationUnitId,
      divisionId: db.divisionId,
      supervisorId: db.supervisorId,
      employeeNumber: db.employeeNumber,
      nik: db.nik,
      legalName: db.legalName,
      email: db.email,
      phone: db.phone,
      sex: db.sex,
      maritalStatus: db.maritalStatus,
      religion: db.religion,
      placeOfBirth: db.placeOfBirth,
      dateOfBirth: db.dateOfBirth,
      lastEducation: db.lastEducation,
      address: db.address,
      provinceId: db.provinceId,
      cityId: db.cityId,
      districtId: db.districtId,
      villageId: db.villageId,
      postalCode: db.postalCode,
      originalDateOfHire: db.originalDateOfHire,
      permanentDate: db.permanentDate,
      actualTerminationDate: db.actualTerminationDate,
      bankId: db.bankId,
      accountName: db.accountName,
      accountNumber: db.accountNumber,
      status: db.status,
      createdAt: db.createdAt,
      createdBy: db.createdBy,
      updatedAt: db.updatedAt,
      updatedBy: db.updatedBy
    };
  }

  private toDetail(db: any): KaryawanDetail {
    const props = this.toProps(db);
    return {
      ...props,
      operationUnit: db.operationUnit ? {
        id: db.operationUnit.id,
        code: db.operationUnit.code,
        name: db.operationUnit.name,
        type: db.operationUnit.type
      } : undefined,
      supervisor: db.supervisor ? {
        id: db.supervisor.id,
        employeeNumber: db.supervisor.employeeNumber,
        legalName: db.supervisor.legalName
      } : null,
      userAccount: db.userAccount ? {
        id: db.userAccount.id,
        username: db.userAccount.username,
        aktif: db.userAccount.aktif
      } : null
    };
  }

  async findById(id: string): Promise<KaryawanDetail | null> {
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
    if (!isUuid) return null;

    const db = await this.prisma.karyawan.findUnique({
      where: { id },
      include: {
        operationUnit: {
          select: { id: true, code: true, name: true, type: true }
        },
        supervisor: {
          select: { id: true, employeeNumber: true, legalName: true }
        },
        userAccount: {
          select: { id: true, username: true, aktif: true }
        }
      }
    });

    if (!db) return null;
    return this.toDetail(db);
  }

  async findByNik(nik: string): Promise<Karyawan | null> {
    const db = await this.prisma.karyawan.findUnique({
      where: { nik }
    });

    if (!db) return null;
    return new Karyawan(this.toProps(db));
  }

  async findByEmployeeNumber(employeeNumber: string): Promise<Karyawan | null> {
    const db = await this.prisma.karyawan.findUnique({
      where: { employeeNumber }
    });

    if (!db) return null;
    return new Karyawan(this.toProps(db));
  }

  async findByEmail(email: string): Promise<Karyawan | null> {
    const db = await this.prisma.karyawan.findUnique({
      where: { email }
    });

    if (!db) return null;
    return new Karyawan(this.toProps(db));
  }

  async findAll(params: FindKaryawanParams): Promise<{
    data: KaryawanDetail[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const page = Math.max(1, params.page || 1);
    const limit = Math.max(1, Math.min(100, params.limit || 10));
    const skip = (page - 1) * limit;

    const where: any = {};

    if (params.status !== undefined) {
      where.status = params.status;
    }

    if (params.operationUnitId) {
      where.operationUnitId = params.operationUnitId;
    } else if (params.allowedUnitIds && params.allowedUnitIds.length > 0) {
      where.operationUnitId = { in: params.allowedUnitIds };
    }

    if (params.search) {
      where.OR = [
        { legalName: { contains: params.search, mode: 'insensitive' } },
        { employeeNumber: { contains: params.search, mode: 'insensitive' } },
        { nik: { contains: params.search, mode: 'insensitive' } },
        { email: { contains: params.search, mode: 'insensitive' } },
        { phone: { contains: params.search, mode: 'insensitive' } }
      ];
    }

    const [total, items] = await Promise.all([
      this.prisma.karyawan.count({ where }),
      this.prisma.karyawan.findMany({
        where,
        skip,
        take: limit,
        include: {
          operationUnit: {
            select: { id: true, code: true, name: true, type: true }
          },
          supervisor: {
            select: { id: true, employeeNumber: true, legalName: true }
          },
          userAccount: {
            select: { id: true, username: true, aktif: true }
          }
        },
        orderBy: [
          { legalName: 'asc' }
        ]
      })
    ]);

    return {
      data: items.map(i => this.toDetail(i)),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    };
  }

  async findSubordinates(supervisorId: string): Promise<Karyawan[]> {
    const items = await this.prisma.karyawan.findMany({
      where: { supervisorId },
      orderBy: { legalName: 'asc' }
    });

    return items.map(i => new Karyawan(this.toProps(i)));
  }

  async create(data: CreateKaryawanDTO): Promise<Karyawan> {
    const created = await this.prisma.karyawan.create({
      data: {
        operationUnitId: data.operationUnitId,
        divisionId: data.divisionId || null,
        supervisorId: data.supervisorId || null,
        employeeNumber: data.employeeNumber,
        nik: data.nik,
        legalName: data.legalName,
        email: data.email || null,
        phone: data.phone || null,
        sex: data.sex || null,
        maritalStatus: data.maritalStatus || null,
        religion: data.religion || null,
        placeOfBirth: data.placeOfBirth || null,
        dateOfBirth: data.dateOfBirth ? new Date(data.dateOfBirth) : null,
        lastEducation: data.lastEducation || null,
        address: data.address || null,
        provinceId: data.provinceId || null,
        cityId: data.cityId || null,
        districtId: data.districtId || null,
        villageId: data.villageId || null,
        postalCode: data.postalCode || null,
        originalDateOfHire: data.originalDateOfHire ? new Date(data.originalDateOfHire) : null,
        permanentDate: data.permanentDate ? new Date(data.permanentDate) : null,
        actualTerminationDate: data.actualTerminationDate ? new Date(data.actualTerminationDate) : null,
        bankId: data.bankId || null,
        accountName: data.accountName || null,
        accountNumber: data.accountNumber || null,
        status: data.status !== undefined ? data.status : true,
        createdBy: data.createdBy || null
      }
    });

    return new Karyawan(this.toProps(created));
  }

  async update(id: string, data: UpdateKaryawanDTO): Promise<Karyawan> {
    const updateData: any = {};
    if (data.operationUnitId !== undefined) updateData.operationUnitId = data.operationUnitId;
    if (data.divisionId !== undefined) updateData.divisionId = data.divisionId || null;
    if (data.supervisorId !== undefined) updateData.supervisorId = data.supervisorId || null;
    if (data.employeeNumber !== undefined) updateData.employeeNumber = data.employeeNumber;
    if (data.nik !== undefined) updateData.nik = data.nik;
    if (data.legalName !== undefined) updateData.legalName = data.legalName;
    if (data.email !== undefined) updateData.email = data.email || null;
    if (data.phone !== undefined) updateData.phone = data.phone || null;
    if (data.sex !== undefined) updateData.sex = data.sex || null;
    if (data.maritalStatus !== undefined) updateData.maritalStatus = data.maritalStatus || null;
    if (data.religion !== undefined) updateData.religion = data.religion || null;
    if (data.placeOfBirth !== undefined) updateData.placeOfBirth = data.placeOfBirth || null;
    if (data.dateOfBirth !== undefined) updateData.dateOfBirth = data.dateOfBirth ? new Date(data.dateOfBirth) : null;
    if (data.lastEducation !== undefined) updateData.lastEducation = data.lastEducation || null;
    if (data.address !== undefined) updateData.address = data.address || null;
    if (data.provinceId !== undefined) updateData.provinceId = data.provinceId || null;
    if (data.cityId !== undefined) updateData.cityId = data.cityId || null;
    if (data.districtId !== undefined) updateData.districtId = data.districtId || null;
    if (data.villageId !== undefined) updateData.villageId = data.villageId || null;
    if (data.postalCode !== undefined) updateData.postalCode = data.postalCode || null;
    if (data.originalDateOfHire !== undefined) updateData.originalDateOfHire = data.originalDateOfHire ? new Date(data.originalDateOfHire) : null;
    if (data.permanentDate !== undefined) updateData.permanentDate = data.permanentDate ? new Date(data.permanentDate) : null;
    if (data.actualTerminationDate !== undefined) updateData.actualTerminationDate = data.actualTerminationDate ? new Date(data.actualTerminationDate) : null;
    if (data.bankId !== undefined) updateData.bankId = data.bankId || null;
    if (data.accountName !== undefined) updateData.accountName = data.accountName || null;
    if (data.accountNumber !== undefined) updateData.accountNumber = data.accountNumber || null;
    if (data.status !== undefined) updateData.status = data.status;
    if (data.updatedBy !== undefined) updateData.updatedBy = data.updatedBy;

    const updated = await this.prisma.karyawan.update({
      where: { id },
      data: updateData
    });

    return new Karyawan(this.toProps(updated));
  }

  async delete(id: string): Promise<boolean> {
    await this.prisma.karyawan.delete({
      where: { id }
    });
    return true;
  }
}
