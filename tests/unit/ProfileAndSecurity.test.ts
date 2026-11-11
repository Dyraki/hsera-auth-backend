import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GetDetailedProfileUseCase } from '../../src/application/use-cases/GetDetailedProfileUseCase';
import { UpdateProfileContactUseCase } from '../../src/application/use-cases/UpdateProfileContactUseCase';
import { ChangeUserPasswordUseCase } from '../../src/application/use-cases/ChangeUserPasswordUseCase';
import { User } from '../../src/domain/entities/User';

describe('Profile and Security Use Cases Unit Tests', () => {
  let mockUserRepo: any;
  let mockKaryawanRepo: any;
  let mockOURepo: any;
  let mockHasher: any;

  beforeEach(() => {
    mockUserRepo = {
      findById: vi.fn(),
      findByIdWithRoles: vi.fn(),
      update: vi.fn().mockResolvedValue({}),
    };
    mockKaryawanRepo = {
      findById: vi.fn(),
      update: vi.fn().mockResolvedValue({}),
    };
    mockOURepo = {
      getHierarchyLineage: vi.fn().mockResolvedValue({
        breadcrumb: 'HO > REGIONAL 2 > CAB-TGK',
      }),
    };
    mockHasher = {
      compare: vi.fn(),
      hash: vi.fn().mockResolvedValue('$2b$12$hashedNewPassword123'),
    };
  });

  describe('GetDetailedProfileUseCase', () => {
    it('harus mengembalikan profil lengkap user beserta data karyawan dan hierarki unit', async () => {
      mockUserRepo.findByIdWithRoles.mockResolvedValue({
        id: 'usr-1',
        username: 'fauzi',
        aktif: 1,
        tgl1: new Date('2021-01-01'),
        tgl2: new Date('2035-12-31'),
        jenis: 'pegawai',
        idRelasi: 'karyawan-1',
        roles: [{ id: 'role-1', nama: 'SALESMAN', aktif: 1 }],
      });

      mockKaryawanRepo.findById.mockResolvedValue({
        id: 'karyawan-1',
        employeeNumber: 'EMP-001',
        nik: '3201019000010001',
        legalName: 'Ahmad Fauzi',
        email: 'fauzi@hsera.co.id',
        phone: '081234567890',
        sex: 'L',
        maritalStatus: 'Menikah',
        religion: 'Islam',
        placeOfBirth: 'Bandung',
        dateOfBirth: new Date('1990-05-14'),
        lastEducation: 'S1',
        address: 'Jl. Sukajadi No. 12',
        postalCode: '40162',
        originalDateOfHire: new Date('2021-01-12'),
        permanentDate: new Date('2021-07-12'),
        bankId: 'BCA',
        accountName: 'Ahmad Fauzi',
        accountNumber: '8270192819',
        status: true,
        operationUnitId: 'unit-1',
        operationUnit: {
          id: 'unit-1',
          code: 'CAB-TGK',
          name: 'Cabang Tagog',
          type: 'OPERATION_UNIT',
        },
        supervisor: {
          id: 'sup-1',
          employeeNumber: 'EMP-0001',
          legalName: 'Budi Santoso',
        },
      });

      const useCase = new GetDetailedProfileUseCase(mockUserRepo, mockKaryawanRepo, mockOURepo);
      const result = await useCase.execute('usr-1');

      expect(result.user.username).toBe('fauzi');
      expect(result.user.roleName).toBe('SALESMAN');
      expect(result.karyawan).not.toBeNull();
      expect(result.karyawan?.employeeNumber).toBe('EMP-001');
      expect(result.karyawan?.operationUnit?.breadcrumb).toBe('HO > REGIONAL 2 > CAB-TGK');
      expect(result.karyawan?.supervisor?.legalName).toBe('Budi Santoso');
    });

    it('harus tetap mengembalikan data user jika akun tidak terhubung dengan karyawan (Super Admin)', async () => {
      mockUserRepo.findByIdWithRoles.mockResolvedValue({
        id: 'usr-sa',
        username: 'superadmin',
        aktif: 1,
        tgl1: new Date('2020-01-01'),
        tgl2: new Date('2030-12-31'),
        jenis: 'SA',
        idRelasi: null,
        roles: [],
      });

      const useCase = new GetDetailedProfileUseCase(mockUserRepo, mockKaryawanRepo, mockOURepo);
      const result = await useCase.execute('usr-sa');

      expect(result.user.username).toBe('superadmin');
      expect(result.user.roleName).toBe('SUPER ADMIN');
      expect(result.karyawan).toBeNull();
    });

    it('harus melempar error jika pengguna tidak ditemukan', async () => {
      mockUserRepo.findByIdWithRoles.mockResolvedValue(null);

      const useCase = new GetDetailedProfileUseCase(mockUserRepo, mockKaryawanRepo, mockOURepo);
      await expect(useCase.execute('non-existent')).rejects.toThrow('Pengguna tidak ditemukan.');
    });
  });

  describe('UpdateProfileContactUseCase', () => {
    it('harus berhasil memperbarui data email, hp, dan alamat karyawan', async () => {
      mockUserRepo.findById.mockResolvedValue(new User('usr-1', 'fauzi', 'hash', 1, new Date(), new Date(), 'pegawai', 'karyawan-1'));

      const useCase = new UpdateProfileContactUseCase(mockUserRepo, mockKaryawanRepo);
      const res = await useCase.execute('usr-1', {
        email: 'fauzi.baru@hsera.co.id',
        phone: '081298765432',
        address: 'Jl. Riau No. 45',
        postalCode: '40115',
      });

      expect(res.message).toContain('berhasil');
      expect(mockKaryawanRepo.update).toHaveBeenCalledWith('karyawan-1', {
        email: 'fauzi.baru@hsera.co.id',
        phone: '081298765432',
        address: 'Jl. Riau No. 45',
        postalCode: '40115',
        updatedBy: 'fauzi',
      });
    });

    it('harus menolak format email yang tidak valid', async () => {
      mockUserRepo.findById.mockResolvedValue(new User('usr-1', 'fauzi', 'hash', 1, new Date(), new Date(), 'pegawai', 'karyawan-1'));

      const useCase = new UpdateProfileContactUseCase(mockUserRepo, mockKaryawanRepo);
      await expect(useCase.execute('usr-1', { email: 'format-salah' })).rejects.toThrow('Format alamat email tidak valid.');
    });

    it('harus menolak format nomor telepon yang tidak valid', async () => {
      mockUserRepo.findById.mockResolvedValue(new User('usr-1', 'fauzi', 'hash', 1, new Date(), new Date(), 'pegawai', 'karyawan-1'));

      const useCase = new UpdateProfileContactUseCase(mockUserRepo, mockKaryawanRepo);
      await expect(useCase.execute('usr-1', { phone: '123' })).rejects.toThrow('Format nomor telepon/WhatsApp tidak valid');
    });

    it('harus menolak jika user tidak memiliki relasi data karyawan', async () => {
      mockUserRepo.findById.mockResolvedValue(new User('usr-sa', 'admin', 'hash', 1, new Date(), new Date(), 'SA', null));

      const useCase = new UpdateProfileContactUseCase(mockUserRepo, mockKaryawanRepo);
      await expect(useCase.execute('usr-sa', { email: 'admin@hsera.co.id' })).rejects.toThrow('Akun ini tidak terhubung dengan profil data karyawan.');
    });
  });

  describe('ChangeUserPasswordUseCase', () => {
    it('harus berhasil mengganti kata sandi jika sandi lama cocok dan sandi baru kuat', async () => {
      mockUserRepo.findById.mockResolvedValue(new User('usr-1', 'fauzi', '$2b$12$oldHashedPassword', 1, new Date(), new Date(), 'pegawai', 'karyawan-1'));
      mockHasher.compare.mockResolvedValue(true);

      const useCase = new ChangeUserPasswordUseCase(mockUserRepo, mockHasher);
      const res = await useCase.execute('usr-1', {
        currentPassword: 'OldPassword123!',
        newPassword: 'SecurePassword88#@',
      });

      expect(res.message).toContain('berhasil');
      expect(mockHasher.hash).toHaveBeenCalledWith('SecurePassword88#@');
      expect(mockUserRepo.update).toHaveBeenCalledWith('usr-1', {
        passwordHash: '$2b$12$hashedNewPassword123',
      });
    });

    it('harus menolak jika kata sandi saat ini salah', async () => {
      mockUserRepo.findById.mockResolvedValue(new User('usr-1', 'fauzi', '$2b$12$oldHashedPassword', 1, new Date(), new Date(), 'pegawai', 'karyawan-1'));
      mockHasher.compare.mockResolvedValue(false);

      const useCase = new ChangeUserPasswordUseCase(mockUserRepo, mockHasher);
      await expect(useCase.execute('usr-1', {
        currentPassword: 'SalahPassword123!',
        newPassword: 'SecurePassword88#@',
      })).rejects.toThrow('Kata sandi saat ini yang Anda masukkan salah.');
    });

    it('harus menolak jika kata sandi baru sama dengan kata sandi lama', async () => {
      mockUserRepo.findById.mockResolvedValue(new User('usr-1', 'fauzi', '$2b$12$oldHashedPassword', 1, new Date(), new Date(), 'pegawai', 'karyawan-1'));
      mockHasher.compare.mockResolvedValue(true);

      const useCase = new ChangeUserPasswordUseCase(mockUserRepo, mockHasher);
      await expect(useCase.execute('usr-1', {
        currentPassword: 'SamePassword123!',
        newPassword: 'SamePassword123!',
      })).rejects.toThrow('Kata sandi baru tidak boleh sama dengan kata sandi saat ini.');
    });

    it('harus menolak jika kata sandi baru tidak memenuhi standar NIST/OWASP', async () => {
      mockUserRepo.findById.mockResolvedValue(new User('usr-1', 'fauzi', '$2b$12$oldHashedPassword', 1, new Date(), new Date(), 'pegawai', 'karyawan-1'));
      mockHasher.compare.mockResolvedValue(true);

      const useCase = new ChangeUserPasswordUseCase(mockUserRepo, mockHasher);
      // Lemah karena tanpa angka dan simbol
      await expect(useCase.execute('usr-1', {
        currentPassword: 'OldPassword123!',
        newPassword: 'onlylowercase',
      })).rejects.toThrow();
    });
  });
});
