import { PrismaClient } from '@prisma/client';
import { LegacyHasher } from '../security/LegacyHasher';
import { SYSTEM_MENU_IDS } from '../../domain/constants/MenuConstants';

const prisma = new PrismaClient();
const hasher = new LegacyHasher();

async function main() {
  console.log('Seeding database with Full UUID...');

  // 1. Bersihkan data lama
  await prisma.loginLog.deleteMany({});
  await prisma.loginUsrGrp.deleteMany({});
  await prisma.loginGrpAcl.deleteMany({});
  await prisma.loginUsr.deleteMany({});
  await prisma.loginGrp.deleteMany({});
  await prisma.menu.deleteMany({});

  // 2. Buat Menu dengan UUID
  const menuDashboard = await prisma.menu.create({
    data: {
      id: SYSTEM_MENU_IDS.DASHBOARD,
      upline: null,
      urut: 1,
      nama: 'Dashboard',
      tipe: 'Header',
      level: 1,
      link: 'dashboard',
      icon: 'fa fa-dashboard',
      aktif: 1
    }
  });

  const menuPengaturan = await prisma.menu.create({
    data: {
      id: SYSTEM_MENU_IDS.SETTINGS,
      upline: null,
      urut: 10,
      nama: 'Pengaturan',
      tipe: 'Header',
      level: 1,
      link: '',
      icon: 'fa fa-th',
      aktif: 1
    }
  });

  const menuMaster = await prisma.menu.create({
    data: {
      id: SYSTEM_MENU_IDS.MASTER,
      upline: null,
      urut: 2,
      nama: 'Master',
      tipe: 'Header',
      level: 1,
      link: 'master',
      icon: 'glyphicon glyphicon-file',
      aktif: 1
    }
  });

  const menuRole = await prisma.menu.create({
    data: {
      id: SYSTEM_MENU_IDS.ROLE_MANAGEMENT,
      upline: menuPengaturan.id,
      urut: 2,
      nama: 'Role Management',
      tipe: 'Detail',
      level: 2,
      link: 'settings/role',
      icon: 'fa fa-users',
      aktif: 1
    }
  });

  const menuSetup = await prisma.menu.create({
    data: {
      id: SYSTEM_MENU_IDS.SETUP_MENU,
      upline: menuPengaturan.id,
      urut: 1,
      nama: 'Setup Menu',
      tipe: 'Detail',
      level: 2,
      link: 'settings/menu',
      icon: 'glyphicon glyphicon-file',
      aktif: 1
    }
  });

  const menuRoleUser = await prisma.menu.create({
    data: {
      id: SYSTEM_MENU_IDS.ROLE_USER,
      upline: menuPengaturan.id,
      urut: 3,
      nama: 'Role User',
      tipe: 'Detail',
      level: 2,
      link: 'settings/roleuser',
      icon: 'fa fa-test',
      aktif: 1
    }
  });

  console.log('Created menus with UUIDs');

  // 3. Buat Grup Role (ID UUID)
  const roleSaId = 'b1000000-0000-4000-b000-000000000001';
  const grpSA = await prisma.loginGrp.create({
    data: { id: roleSaId, nama: 'SUPER ADMIN', aktif: 1 }
  });
  console.log(`Created group: SA (${grpSA.id})`);

  // 4. Buat ACL Grup (SA punya akses ke semua menu)
  const menus = [menuDashboard, menuPengaturan, menuRole, menuSetup, menuRoleUser, menuMaster];
  for (const m of menus) {
    await prisma.loginGrpAcl.create({
      data: {
        loginGrpId: grpSA.id,
        menuId: m.id,
        enable: 1,
        level: 4
      }
    });
  }
  console.log('Created ACLs for SA');

  // 5. Buat User Admin dengan Password Legacy SHA1 (admin123)
  const plainPassword = 'admin123';
  const hashedPassword = hasher.hashLegacy(plainPassword);
  const adminUserId = 'a1000000-0000-4000-a000-000000000001';

  const adminUser = await prisma.loginUsr.create({
    data: {
      id: adminUserId,
      username: 'admin',
      passwd: hashedPassword,
      aktif: 1,
      tgl1: new Date('2026-01-01'),
      tgl2: new Date('2030-12-31'),
      jenis: 'SA',
      idRelasi: 'peg-1'
    }
  });
  console.log(`Created user: admin (${adminUser.id})`);

  // 6. Hubungkan User dengan Grup
  await prisma.loginUsrGrp.create({
    data: {
      loginUsrId: adminUser.id,
      loginGrpId: grpSA.id
    }
  });
  console.log('Linked user admin to group SA');

  console.log('Seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
