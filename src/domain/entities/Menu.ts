export class Menu {
  constructor(
    public readonly id: string,
    public readonly upline: string | null,
    public readonly urut: number,
    public readonly nama: string,
    public readonly tipe: string,
    public readonly level: number,
    public readonly link: string,
    public readonly icon: string,
    public readonly aktif: number
  ) {}
}
