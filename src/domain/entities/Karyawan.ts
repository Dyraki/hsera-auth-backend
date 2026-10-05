export interface KaryawanProps {
  id: string;
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
  status: boolean;
  createdAt?: Date;
  createdBy?: string | null;
  updatedAt?: Date;
  updatedBy?: string | null;
}

export class Karyawan {
  constructor(public readonly props: KaryawanProps) {}

  get id(): string { return this.props.id; }
  get operationUnitId(): string { return this.props.operationUnitId; }
  get divisionId(): string | null | undefined { return this.props.divisionId; }
  get supervisorId(): string | null | undefined { return this.props.supervisorId; }
  get employeeNumber(): string { return this.props.employeeNumber; }
  get nik(): string { return this.props.nik; }
  get legalName(): string { return this.props.legalName; }
  get email(): string | null | undefined { return this.props.email; }
  get phone(): string | null | undefined { return this.props.phone; }
  get sex(): string | null | undefined { return this.props.sex; }
  get status(): boolean { return this.props.status; }

  public isActive(): boolean {
    return this.props.status === true && !this.props.actualTerminationDate;
  }
}
