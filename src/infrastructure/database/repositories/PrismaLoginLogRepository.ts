import { ILoginLogRepository } from '../../../domain/repositories/ILoginLogRepository';
import { LoginLog } from '../../../domain/entities/LoginLog';
import { PrismaService } from '../PrismaService';

export class PrismaLoginLogRepository implements ILoginLogRepository {
  private readonly prisma = PrismaService.getClient();

  async create(
    userId: string,
    status: string,
    menuId?: string | null,
    menuNama?: string | null,
    tabelRelasi?: string | null,
    idRelasi?: string | null
  ): Promise<LoginLog> {
    const log = await this.prisma.loginLog.create({
      data: {
        loginUsrId: userId,
        status,
        menuId: menuId && menuId.trim() !== '' ? menuId.trim() : null,
        menuNama: menuNama || null,
        tabelRelasi: tabelRelasi || null,
        idRelasi: idRelasi || null
      }
    });

    return new LoginLog(
      log.id,
      log.loginUsrId,
      log.menuId,
      log.menuNama,
      log.status,
      log.tabelRelasi,
      log.idRelasi,
      log.createdAt
    );
  }
}
