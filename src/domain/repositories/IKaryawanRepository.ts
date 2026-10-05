import { Karyawan, KaryawanProps } from '../entities/Karyawan';

export interface CreateKaryawanDTO {
  operationUnitId: string;
  divisionId?: string | null;
  supervisorId?: string | null;
  employeeNumber: string;
  nik: string;
  legalName: string;
  email?: string | null;
  phone?: string | null;
  sex?: string | null;
  maritalStatus?: string | null;
  religion?: string | null;
  placeOfBirth?: string | null;
  dateOfBirth?: Date | null;
  lastEducation?: string | null;
  address?: string | null;
  provinceId?: string | null;
  cityId?: string | null;
  districtId?: string | null;
  villageId?: string | null;
  postalCode?: string | null;
  originalDateOfHire?: Date | null;
  permanentDate?: Date | null;
  actualTerminationDate?: Date | null;
  bankId?: string | null;
  accountName?: string | null;
  accountNumber?: string | null;
  status?: boolean;
  createdBy?: string | null;
}

export interface UpdateKaryawanDTO extends Partial<CreateKaryawanDTO> {
  updatedBy?: string | null;
}

export interface KaryawanDetail extends KaryawanProps {
  operationUnit?: {
    id: string;
    code: string;
    name: string;
    type: string;
    hierarchyPath?: string;
  };
  supervisor?: {
    id: string;
    employeeNumber: string;
    legalName: string;
  } | null;
  userAccount?: {
    id: string;
    username: string;
    aktif: number;
  } | null;
}

export interface FindKaryawanParams {
  page?: number;
  limit?: number;
  search?: string;
  operationUnitId?: string;
  allowedUnitIds?: string[];
  status?: boolean;
}

export interface IKaryawanRepository {
  findById(id: string): Promise<KaryawanDetail | null>;
  findByNik(nik: string): Promise<Karyawan | null>;
  findByEmployeeNumber(employeeNumber: string): Promise<Karyawan | null>;
  findByEmail(email: string): Promise<Karyawan | null>;
  findAll(params: FindKaryawanParams): Promise<{
    data: KaryawanDetail[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }>;
  findSubordinates(supervisorId: string): Promise<Karyawan[]>;
  create(data: CreateKaryawanDTO): Promise<Karyawan>;
  update(id: string, data: UpdateKaryawanDTO): Promise<Karyawan>;
  delete(id: string): Promise<boolean>;
}
