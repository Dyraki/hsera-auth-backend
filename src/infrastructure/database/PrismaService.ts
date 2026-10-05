import { PrismaClient } from '@prisma/client';

export class PrismaService {
  private static instance: PrismaClient;

  public static getClient(): PrismaClient {
    if (!this.instance) {
      let dbUrl = process.env.DATABASE_URL;

      // Jika dijalankan di host (macOS / Windows / test lokal di luar docker),
      // arahkan host container "db" ke "localhost"
      if (dbUrl && dbUrl.includes('@db:') && process.platform !== 'linux') {
        dbUrl = dbUrl.replace('@db:', '@localhost:');
      }

      this.instance = new PrismaClient({
        datasources: dbUrl ? { db: { url: dbUrl } } : undefined,
        log: ['error', 'warn'],
      });
    }
    return this.instance;
  }
}
