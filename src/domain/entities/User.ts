export class User {
  constructor(
    public readonly id: string,
    public readonly username: string,
    public readonly passwordHash: string,
    public readonly aktif: number,
    public readonly tglMulai: Date,
    public readonly tglSelesai: Date,
    public readonly jenis: string,
    public readonly idRelasi: string | null
  ) {}

  /**
   * Cek apakah akun user aktif secara status dan tanggal
   */
  public isAccountActive(): boolean {
    const now = new Date();
    // Set jam, menit, detik ke 0 untuk pencocokan tanggal murni
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    const startDate = new Date(this.tglMulai.getFullYear(), this.tglMulai.getMonth(), this.tglMulai.getDate());
    const endDate = new Date(this.tglSelesai.getFullYear(), this.tglSelesai.getMonth(), this.tglSelesai.getDate());

    return this.aktif === 1 && today >= startDate && today <= endDate;
  }
}
