export type OperationUnitType = 'HEAD_OFFICE' | 'REGIONAL' | 'AREA_OFFICE' | 'OPERATION_UNIT';

export interface OperationUnitProps {
  id: string;
  parentId: string | null;
  code: string;
  name: string;
  type: OperationUnitType | string;
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
  status: boolean;
  createdAt?: Date;
  createdBy?: string | null;
  updatedAt?: Date;
  updatedBy?: string | null;
  parentName?: string | null;
  parentCode?: string | null;
}

export class OperationUnit {
  constructor(public readonly props: OperationUnitProps) {}

  get id(): string { return this.props.id; }
  get parentId(): string | null { return this.props.parentId; }
  get code(): string { return this.props.code; }
  get name(): string { return this.props.name; }
  get type(): string { return this.props.type; }
  get category(): string | null | undefined { return this.props.category; }
  get distributionPoint(): string | null | undefined { return this.props.distributionPoint; }
  get address(): string | null | undefined { return this.props.address; }
  get phone(): string | null | undefined { return this.props.phone; }
  get latitude(): number | null | undefined { return this.props.latitude; }
  get longitude(): number | null | undefined { return this.props.longitude; }
  get status(): boolean { return this.props.status; }
  get createdAt(): Date | undefined { return this.props.createdAt; }
  get updatedAt(): Date | undefined { return this.props.updatedAt; }

  public isHeadOffice(): boolean {
    return this.props.type === 'HEAD_OFFICE' || !this.props.parentId;
  }
}
