import { OperationUnit, OperationUnitProps } from '../entities/OperationUnit';

export interface OperationUnitTreeNode extends OperationUnitProps {
  children?: OperationUnitTreeNode[];
}

export interface CreateOperationUnitDTO {
  parentId?: string | null;
  code: string;
  name: string;
  type: string;
  category?: string | null;
  distributionPoint?: string | null;
  address?: string | null;
  provinceId?: string | null;
  cityId?: string | null;
  districtId?: string | null;
  villageId?: string | null;
  postalCode?: string | null;
  phone?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  buildingStatus?: string | null;
  leaseCategory?: string | null;
  leaseStartDate?: Date | null;
  leaseEndDate?: Date | null;
  annualRent?: number | null;
  legalDocumentType?: string | null;
  legalDocumentNumber?: string | null;
  status?: boolean;
  createdBy?: string | null;
}

export interface UpdateOperationUnitDTO extends Partial<CreateOperationUnitDTO> {
  updatedBy?: string | null;
}

export interface IOperationUnitRepository {
  findById(id: string): Promise<OperationUnit | null>;
  findByCode(code: string): Promise<OperationUnit | null>;
  findAll(filters?: { type?: string; status?: boolean; search?: string }): Promise<OperationUnit[]>;
  findTree(): Promise<OperationUnitTreeNode[]>;
  getAllDescendantIds(unitId: string): Promise<string[]>;
  getHierarchyLineage(unitId: string): Promise<{
    unit: { id: string; code: string; name: string; type: string };
    areaOffice?: { id: string; code: string; name: string } | null;
    regional?: { id: string; code: string; name: string } | null;
    headOffice?: { id: string; code: string; name: string } | null;
    breadcrumb: string;
  }>;
  create(data: CreateOperationUnitDTO): Promise<OperationUnit>;
  update(id: string, data: UpdateOperationUnitDTO): Promise<OperationUnit>;
  delete(id: string): Promise<boolean>;
  countChildren(id: string): Promise<number>;
  countEmployees(id: string): Promise<number>;
}
