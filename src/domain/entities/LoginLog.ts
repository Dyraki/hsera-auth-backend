export class LoginLog {
  constructor(
    public readonly id: string,
    public readonly loginUsrId: string,
    public readonly menuId: string | null,
    public readonly menuNama: string | null,
    public readonly status: string,
    public readonly tabelRelasi: string | null,
    public readonly idRelasi: string | null,
    public readonly createdAt: Date
  ) {}
}
