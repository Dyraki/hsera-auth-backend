import { LoginLog } from '../entities/LoginLog';

export interface ILoginLogRepository {
  create(
    userId: string,
    status: string,
    menuId?: string | null,
    menuNama?: string | null,
    tabelRelasi?: string | null,
    idRelasi?: string | null
  ): Promise<LoginLog>;
}
