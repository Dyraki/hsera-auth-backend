# Panduan Lengkap Setup, Arsitektur & Deployment
### Service: `auth-platform-backend` (Core Identity, RBAC, Multi-Unit & Session Management)

> **Dokumen ini dirancang sebagai panduan definitif jika repositori ini di-push ke GitHub dan di-clone ke mesin atau proyek baru. Dokumen ini juga berfungsi sebagai *Context Manual* bagi pengembang maupun AI Assistant (seperti Antigravity) agar langsung memahami arsitektur tanpa kebingungan.**

---

## 📑 Daftar Isi
1. [Ringkasan Eksekutif & Identitas Proyek](#1-ringkasan-eksekutif--identitas-proyek)
2. [Langkah Cepat Setup & Clone ke Proyek Baru (Quickstart)](#2-langkah-cepat-setup--clone-ke-proyek-baru-quickstart)
3. [Konfigurasi Environment (`.env`)](#3-konfigurasi-environment-env)
4. [Inisialisasi & Migrasi Database (PostgreSQL / Supabase)](#4-inisialisasi--migrasi-database-postgresql--supabase)
5. [Arsitektur Kode (Clean Architecture / Hexagonal DDD)](#5-arsitektur-kode-clean-architecture--hexagonal-ddd)
6. [Fitur Keamanan Unggulan (Enterprise Security)](#6-fitur-keamanan-unggulan-enterprise-security)
7. [Kamus Basis Data & Relasi Entitas](#7-kamus-basis-data--relasi-entitas)
8. [Katalog Endpoint API & Swagger](#8-katalog-endpoint-api--swagger)
9. [Panduan Integrasi Multi-Backend (e.g. `salesmanship-backend`)](#9-panduan-integrasi-multi-backend-eg-salesmanship-backend)
10. [Instruksi Khusus untuk AI Assistant / Developer Masa Depan](#10-instruksi-khusus-untuk-ai-assistant--developer-masa-depan)

---

## 1. Ringkasan Eksekutif & Identitas Proyek

* **Nama Layanan**: `auth-platform-backend` (Sebelumnya: `fw-backend-platform`).
* **Fungsi Utama**:
  1. **Central Identity Provider (IdP)**: Single Sign-On (SSO) untuk seluruh ekosistem backend aplikasi.
  2. **Role-Based Access Control (RBAC)**: Matriks izin menu bitmask 4-digit (`CRUD`).
  3. **Hierarki Organisasi (Operation Unit Tree)**: Pemetaan cabang, area, regional, hingga kantor pusat.
  4. **Multi-Unit Scoping**: Pembatasan data transaksi otomatis berdasarkan penempatan karyawan (`allowedUnitIds`).
  5. **Session & Token Management Terpusat**: Dual-token (Short JWT + Stateful Refresh Token Rotation) anti-XSS & anti-brute force.
* **Tech Stack**:
  * Runtime: **Node.js 20+**
  * Language: **TypeScript 5+**
  * Framework: **Express.js**
  * ORM: **Prisma ORM 5.x**
  * Database: **PostgreSQL 14+ / 16+** (atau **Supabase Database**)
  * Container: **Docker & Docker Compose**

---

## 2. Langkah Cepat Setup & Clone ke Proyek Baru (Quickstart)

### Prasyarat Sistem
* [Docker Desktop](https://www.docker.com/) & Docker Compose terinstal.
* [Node.js](https://nodejs.org/) v20+ & npm v10+ (opsional jika menjalankan langsung via Docker).

### Langkah 1: Clone Repositori
```bash
git clone <URL_REPO_ANDA> framework-app
cd framework-app
```

### Langkah 2: Siapkan File Environment
Salin template environment di root dan di dalam folder backend:
```bash
cp .env.example .env
cp auth-platform-backend/.env.example auth-platform-backend/.env
```
*(Jika file `.example` belum ada, lihat bagian [3. Konfigurasi Environment](#3-konfigurasi-environment-env)).*

### Langkah 3: Jalankan Seluruh Kontainer via Docker Compose
Di root folder `framework-app`, jalankan:
```bash
docker compose up --build -d
```
Perintah ini akan menjalankan 3 service:
1. `framework_postgres` (Port 5432)
2. `framework_backend` (`auth-platform-backend`, Port 5001)
3. `framework_frontend` (`admin-dashboard`, Port 5173)

### Langkah 4: Sinkronkan Database & Seeder
Setelah kontainer berjalan:
```bash
# Sinkronkan skema Prisma ke PostgreSQL
docker compose exec auth-platform-backend npx prisma db push

# Jalankan seeder data awal (Akun Admin, Menu Default, Matriks ACL)
docker compose exec auth-platform-backend npm run seed
```

### Langkah 5: Buka Aplikasi
* **Swagger API Docs**: Buka [http://localhost:5001/api-docs](http://localhost:5001/api-docs)
* **Frontend Admin Dashboard**: Buka [http://localhost:5173](http://localhost:5173)
* **Kredensial Default Super Admin**:
  * **Username**: `admin`
  * **Password**: `admin123` *(Otomatis dimigrasikan ke bcrypt saat login pertama)*

---

## 3. Konfigurasi Environment (`.env`)

### A. Root `.env` (`/framework-app/.env`)
```env
# Koneksi Database Host
DATABASE_URL="postgresql://postgres:rootpassword@localhost:5432/platform_db?schema=public"

# JWT Config
JWT_SECRET="supersecretkeyframeworkv1coreauth"
JWT_EXPIRES_IN="15m"

# Application Ports
PORT=5001
VITE_API_URL="http://localhost:5001"
```

### B. Backend `.env` (`/framework-app/auth-platform-backend/.env`)
```env
PORT=5001
# Di dalam Docker container, host database adalah nama service docker "db"
DATABASE_URL="postgresql://postgres:rootpassword@db:5432/platform_db?schema=public"

# Jika menggunakan Supabase Cloud:
# DATABASE_URL="postgresql://postgres.[REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres?pgbouncer=true"

JWT_SECRET="supersecretkeyframeworkv1coreauth"
JWT_EXPIRES_IN="15m"
NODE_ENV="development"
```

---

## 4. Inisialisasi & Migrasi Database (PostgreSQL / Supabase)

Tersedia **dua metode** untuk menyiapkan database:

### Metode 1: Menggunakan Prisma CLI (Otomatis & Disarankan)
Jika menggunakan Prisma CLI:
```bash
# Di dalam kontainer:
docker compose exec auth-platform-backend npx prisma db push

# Atau langsung di host jika PostgreSQL berjalan di localhost:
cd auth-platform-backend
npx prisma generate
npx prisma db push
npm run seed
```

### Metode 2: Menggunakan Raw SQL DDL (Untuk Supabase / Database Cloud)
Jika Anda menggunakan **Supabase**, buka menu **SQL Editor** di Dashboard Supabase, lalu eksekusi secara berurutan:
1. Jalankan isi file [schema_postgres.sql](file:///Users/dyra/Documents/Docker/framework-app/auth-platform-backend/doc/schema_postgres.sql): Berisi DDL 9 tabel lengkap ber-UUID.
2. Jalankan isi file [data_export_postgres.sql](file:///Users/dyra/Documents/Docker/framework-app/auth-platform-backend/doc/data_export_postgres.sql): Berisi data inisial menu, user, grup, dan unit kerja.

---

## 5. Arsitektur Kode (Clean Architecture / Hexagonal DDD)

Backend ini dibangun secara ketat menggunakan prinsip **Clean Architecture**:

```
src/
├── domain/                    # Layer 1: Entitas Bisnis Murni (Zero Dependency)
│   ├── entities/              # User.ts, UserSession.ts, Menu.ts, Role.ts, OperationUnit.ts, Karyawan.ts
│   ├── repositories/          # IUserRepository, IUserSessionRepository, IOperationUnitRepository, dll.
│   └── constants/             # MenuConstants.ts (ID Menu Sistem baku)
│
├── application/               # Layer 2: Logika Kasus Penggunaan (Use Cases)
│   └── use-cases/
│       ├── LoginUseCase.ts             # Alur autentikasi, scope injection, audit, lazy migration
│       ├── RefreshTokenUseCase.ts      # Rotasi token & deteksi pencurian token
│       ├── LogoutUseCase.ts            # Pembatalan sesi di DB & pembersihan cookie
│       ├── SessionManagementUseCase.ts # Melihat & membatalkan sesi perangkat aktif
│       ├── ManageUserUseCase.ts        # CRUD User (otomatis bcrypt)
│       ├── ManageMenuUseCase.ts        # CRUD Menu navigasi
│       ├── ManageRoleUseCase.ts        # CRUD Role grup
│       ├── ManageRoleAclUseCase.ts     # Konfigurasi matriks ACL menu
│       ├── GetUserMenusUseCase.ts      # Pembuat hierarki pohon menu terotorisasi
│       ├── ManageOperationUnitUseCase. # Hierarki cabang & lineage
│       └── ManageKaryawanUseCase.ts    # Manajemen master SDM (32 field)
│
├── infrastructure/            # Layer 3: Driver Basis Data & Keamanan Eksternal
│   ├── database/
│   │   ├── PrismaService.ts            # Singleton Prisma Client
│   │   ├── seed.ts                     # Seeder inisial DB
│   │   └── repositories/               # PrismaUserRepository, PrismaUserSessionRepository, dll.
│   └── security/
│       ├── JwtService.ts               # Sign JWT 15m & Refresh Token Opaque (SHA-256)
│       └── LegacyHasher.ts             # Bcrypt Cost 12 + Kompatibilitas SHA-1 MySQL lama
│
└── presentation/              # Layer 4: HTTP Delivery (Express.js)
    ├── controllers/           # AuthController, UserController, MenuController, OperationUnitController, dll.
    ├── middlewares/
    │   ├── AuthMiddleware.ts           # Verifikasi Access Token JWT
    │   ├── AclMiddleware.ts            # Validasi bitmask izin operasi CRUD
    │   ├── RateLimitMiddleware.ts      # Proteksi brute-force (15 req/15 min)
    │   └── ErrorHandlerMiddleware.ts   # Centralized error handler
    ├── routes/                # Modular router (auth, user, menu, role, unit, karyawan)
    ├── swagger.ts             # OpenAPI / Swagger definition
    └── index.ts               # Entry point aplikasi
```

---

## 6. Fitur Keamanan Unggulan (Enterprise Security)

### 1. Hashing Kata Sandi: Bcrypt (Cost 12) + *Transparent Lazy Migration*
* Password baru di-hash menggunakan **`bcrypt`** (Salt Rounds 12).
* Jika ada akun lama yang masih menggunakan format MySQL SHA-1 ganda (`*HEX...`):
  * Pengguna **tidak dipaksa** reset password.
  * Saat login pertama kali berhasil, sistem otomatis melakukan *re-hash* ke `bcrypt` dan menyimpannya di DB secara hening (*zero friction*).

### 2. Dual-Token & Refresh Token Rotation (RTR)
* **Access Token**:
  * Masa berlaku pendek: **15 Menit** (`JWT_EXPIRES_IN=15m`).
  * Stateless, memuat identitas user, hierarki unit yang diizinkan (`allowedUnitIds`), dan hak akses menu.
* **Refresh Token**:
  * Masa berlaku: **7 Hari**.
  * Dibuat dari token acak kriptografis (64 karakter hex).
  * Disimpan di database dalam bentuk **Hash SHA-256** (jika database bocor, token asli tetap aman).
  * Dikirim via **`HttpOnly` Cookie** (JavaScript browser tidak dapat mengakses cookie ini, aman dari serangan XSS).
  * **Refresh Token Rotation (RTR)**: Setiap kali refresh token digunakan, token lama hangus dan dibuatkan token baru.
  * **Anti-Token Reuse Detection**: Jika token yang sudah di-revoke dicoba digunakan lagi (indikasi pencurian token), **seluruh sesi user tersebut otomatis dimatikan**.

### 3. Proteksi Brute-Force (Rate Limiting)
* Endpoint `POST /api/auth/login` dilindungi oleh `express-rate-limit` maksimal **15 percobaan per 15 menit per IP address**.

### 4. Pelacakan Sesi Aktif (*Active Device Session*)
* Setiap sesi mencatat `ip_address`, `user_agent`, `created_at`, dan `expires_at`.
* Pengguna dapat melihat daftar perangkat yang sedang login dan melakukan *"Logout from all devices"*.

---

## 7. Kamus Basis Data & Relasi Entitas

Seluruh tabel menggunakan tipe data **`UUID`** untuk Primary Key & Foreign Key:

| Nama Tabel | Fungsi Bisnis | Keterangan Relasi |
| :--- | :--- | :--- |
| **`login_usr`** | Akun pengguna sistem | Relasi ke `login_usr_grp`, `login_log`, `karyawan`, `user_session` |
| **`login_grp`** | Master Role / Kelompok pengguna | Relasi ke `login_usr_grp` dan `login_grp_acl` |
| **`login_usr_grp`** | Pivot Many-to-Many Pengguna ke Role | `login_usr_id` & `login_grp_id` |
| **`menu`** | Pohon hierarki navigasi menu | Rekursif relasi induk `upline` -> `id` |
| **`login_grp_acl`** | Matriks izin Role terhadap Menu | Menyimpan `enable` (0/1) dan bitmask `level` (CRUD) |
| **`login_log`** | Audit trail aktivitas login & data | Mencatat status `SUKSES`/`GAGAL` & timestamp |
| **`operation_unit`**| Struktur organisasi / Cabang | Rekursif relasi `parent_id` (Head Office -> Regional -> Branch) |
| **`karyawan`** | Master Karyawan lengkap (32 kolom) | Berelasi ke `operation_unit` dan `supervisor_id` |
| **`user_session`** | Pencatatan sesi aktif & refresh token| Berelasi ke `login_usr` dengan status `is_revoked` |

---

## 8. Katalog Endpoint API & Swagger

Dokumentasi interaktif OpenAPI dapat diakses langsung di: **`http://localhost:5001/api-docs`**.

### Modul Autentikasi & Sesi (`/api/auth`)
* `POST /api/auth/login`: Masuk sistem (Menerbitkan Access Token & Set HttpOnly Refresh Cookie).
* `POST /api/auth/refresh`: Menukar refresh token dengan access token baru (Rotasi RTR).
* `POST /api/auth/logout`: Keluar & membatalkan sesi saat ini.
* `POST /api/auth/logout-all`: [Auth] Keluar dari semua perangkat sekaligus.
* `GET /api/auth/sessions`: [Auth] Melihat daftar perangkat/sesi aktif milik pengguna.
* `DELETE /api/auth/sessions/:sessionId`: [Auth] Memutus sesi perangkat tertentu.
* `GET /api/auth/profile`: [Auth] Mengambil profil pengguna dari token JWT.

### Modul Otorisasi & Master
* `/api/users`: CRUD Pengguna & penetapan Role.
* `/api/roles`: CRUD Role & Grup.
* `/api/menus`: CRUD Master Menu & Pohon Navigasi.
* `/api/menus/my-menus`: Pohon hierarki menu spesifik sesuai hak akses user yang sedang login.
* `/api/role-acl`: Konfigurasi matriks hak akses Role terhadap Menu.
* `/api/operation-units`: CRUD Cabang & perhitungan hierarki turunan (*lineage*).
* `/api/karyawan`: CRUD Master Karyawan.

---

## 9. Panduan Integrasi Multi-Backend (e.g. `salesmanship-backend`)

Jika Anda membangun backend baru (misalnya `salesmanship-backend`), berikut cara menghubungkannya:

1. **Tidak Perlu Koneksi ke Database Auth**:
   `salesmanship-backend` tidak perlu menyalin tabel user, login, atau password.
2. **Verifikasi Mandiri via Token JWT**:
   Di `salesmanship-backend`, buat middleware yang memverifikasi header `Authorization: Bearer <token>` menggunakan `JWT_SECRET` yang sama.
3. **Membaca Scope Cabang Otomatis**:
   Payload token sudah membawa unit yang diizinkan:
   ```typescript
   // Di controller salesmanship:
   const allowedUnitIds = req.user.scope.allowedUnitIds;
   const isSuperAdmin = req.user.scope.isSuperAdmin;

   // Query pesanan/leads sales dibatasi sesuai unit kerja user:
   const deals = await prisma.salesOrder.findMany({
     where: isSuperAdmin ? {} : { operationUnitId: { in: allowedUnitIds } }
   });
   ```
4. **Relasi Data**:
   Di tabel database salesmanship, cukup simpan `user_id (UUID)` atau `karyawan_id (UUID)` sebagai referensi logis (*loose coupling*).

---

## 10. Instruksi Khusus untuk AI Assistant / Developer Masa Depan

Bagi Agent AI atau Developer yang melanjutkan pengerjaan proyek ini:

1. **Prinsip Arsitektur**:
   * Patuhi **Clean Architecture**: Controller hanya menerima request dan memanggil UseCase. Logika bisnis TIDAK BOLEH diletakkan di dalam Controller atau Router.
   * Query database HANYA dilakukan melalui Repository Layer (implementasi Prisma di `infrastructure/database/repositories`).
2. **Aturan Bypass Super Admin**:
   * Pengguna dengan `jenis = 'SA'`, `jenis = 'admin'`, atau `username = 'admin'` memiliki hak istimewa *bypass* ACL dan *multi-unit scope*.
3. **Format Bitmask Level ACL (4-Digit)**:
   * Digit ke-4 (ribuan): `1xxx` = Create
   * Digit ke-3 (ratusan): `x1xx` = Read
   * Digit ke-2 (puluhan): `xx1x` = Update
   * Digit ke-1 (satuan): `xxx1` = Delete
   * Contoh: `1111` = Hak akses penuh, `0100` = Hanya Read.
4. **Regenerasi Prisma**:
   Setiap kali file `prisma/schema.prisma` diubah, jalankan:
   ```bash
   npx prisma generate
   # Di dalam docker jika aktif:
   docker compose exec auth-platform-backend npx prisma generate
   docker compose exec auth-platform-backend npx prisma db push
   ```
