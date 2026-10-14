-- =====================================================================
-- EXPORT & SEED DATA: OPERATION UNIT & KARYAWAN UNTUK POSTGRESQL
-- Project: Platform / Auth Backend -> Project Baru (PostgreSQL)
-- Tanggal: 2026-10-06
-- Fitur: Idempotent (ON CONFLICT), Hierarchical Ordering, Bypass Circular FK
-- =====================================================================

BEGIN;

-- 1. Matikan pengecekan trigger/foreign key sementara untuk menghindari circular dependency
SET session_replication_role = 'replica';

-- =====================================================================
-- 2. TABEL: operation_unit (Hierarchical Organization Tree)
--    Urutan: HEAD_OFFICE -> REGIONAL -> AREA_OFFICE -> OPERATION_UNIT
-- =====================================================================

INSERT INTO operation_unit (
    id,
    parent_id,
    code,
    name,
    type,
    category,
    distribution_point,
    address,
    province_id,
    city_id,
    district_id,
    village_id,
    postal_code,
    phone,
    latitude,
    longitude,
    building_status,
    lease_category,
    lease_start_date,
    lease_end_date,
    annual_rent,
    legal_document_type,
    legal_document_number,
    status,
    created_at,
    created_by,
    updated_at,
    updated_by
) VALUES
-- Level 1: HEAD OFFICE
(
    'c1000000-0000-4000-a000-000000000001',
    NULL,
    'HO',
    'Kantor Pusat Nasional',
    'HEAD_OFFICE',
    'Kantor Pusat',
    NULL,
    'Jl. Basuki Rahmat No.Km 3, Sindon, Wonoasri, Kec. Wonoasri, Kabupaten Madiun, Jawa Timur 63157',
    NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL,
    'Sewa',
    'Tahunan',
    NULL, NULL, NULL, NULL, NULL,
    true,
    '2026-09-30 06:21:50.503',
    NULL,
    '2026-09-30 07:36:12.322',
    'a1000000-0000-4000-a000-000000000001'
),
-- Level 2: REGIONAL (Parent: HO)
(
    '8baaf4e0-68f6-4bc3-8539-44dfd996794e',
    'c1000000-0000-4000-a000-000000000001',
    'REG-JATIM',
    'Regional Jawa Timur',
    'REGIONAL',
    'Regional',
    NULL,
    'Jl. Basuki Rahmat No.Km 3, Sindon, Wonoasri, Kec. Wonoasri, Kabupaten Madiun, Jawa Timur 63157',
    NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL,
    'Sewa',
    'Tahunan',
    NULL, NULL, NULL, NULL, NULL,
    true,
    '2026-09-30 06:39:24.516',
    'a1000000-0000-4000-a000-000000000001',
    '2026-09-30 07:36:01.097',
    'a1000000-0000-4000-a000-000000000001'
),
-- Level 3: AREA OFFICE (Parent: REG-JATIM)
(
    '2280d07c-4717-44d6-9568-5cd587f96f8b',
    '8baaf4e0-68f6-4bc3-8539-44dfd996794e',
    'AREA-TAG',
    'Area Office Tulungagung',
    'AREA_OFFICE',
    'Area Office',
    NULL,
    'Perumahan Permata Kota Bago C7',
    NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL,
    'Sewa',
    'Tahunan',
    NULL, NULL, 10000000.00, NULL, NULL,
    true,
    '2026-09-30 06:39:24.645',
    'a1000000-0000-4000-a000-000000000001',
    '2026-09-30 07:36:58.791',
    'a1000000-0000-4000-a000-000000000001'
),
-- Level 4: OPERATION UNIT 1 (Cabang Trenggalek - Parent: AREA-TAG)
(
    'a44e7e0e-0193-4a8e-a3e3-22d4546c2178',
    '2280d07c-4717-44d6-9568-5cd587f96f8b',
    'CAB-TGK',
    'Cabang Trenggalek',
    'OPERATION_UNIT',
    'Cabang',
    'Titik Distribusi Bandung Barat',
    'Jl. Hasanudin Surondakan',
    NULL, NULL, NULL, NULL, NULL, '+62222012345', -6.89123400, 107.58912300,
    'Sewa',
    'Tahunan',
    NULL, NULL, 15000000.00, NULL, NULL,
    true,
    '2026-09-30 06:39:24.777',
    'a1000000-0000-4000-a000-000000000001',
    '2026-09-30 07:37:36.511',
    'a1000000-0000-4000-a000-000000000001'
),
-- Level 4: OPERATION UNIT 2 (Cabang Tulungagung - Parent: AREA-TAG)
(
    '891c0106-4199-46eb-a38c-f49fbcc28c35',
    '2280d07c-4717-44d6-9568-5cd587f96f8b',
    'CAB-TAG',
    'Cabang Tulungagung',
    'OPERATION_UNIT',
    'Cabang',
    NULL,
    'Perum permata kota bago Block C7, Bago, Kedungwaru, Tulungagung',
    NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL,
    'Sewa',
    'Tahunan',
    NULL, NULL, 10000000.00, NULL, NULL,
    true,
    '2026-09-30 12:48:54.320',
    'a1000000-0000-4000-a000-000000000001',
    '2026-09-30 12:48:54.320',
    NULL
)
ON CONFLICT (id) DO UPDATE SET
    parent_id = EXCLUDED.parent_id,
    code = EXCLUDED.code,
    name = EXCLUDED.name,
    type = EXCLUDED.type,
    category = EXCLUDED.category,
    distribution_point = EXCLUDED.distribution_point,
    address = EXCLUDED.address,
    province_id = EXCLUDED.province_id,
    city_id = EXCLUDED.city_id,
    district_id = EXCLUDED.district_id,
    village_id = EXCLUDED.village_id,
    postal_code = EXCLUDED.postal_code,
    phone = EXCLUDED.phone,
    latitude = EXCLUDED.latitude,
    longitude = EXCLUDED.longitude,
    building_status = EXCLUDED.building_status,
    lease_category = EXCLUDED.lease_category,
    lease_start_date = EXCLUDED.lease_start_date,
    lease_end_date = EXCLUDED.lease_end_date,
    annual_rent = EXCLUDED.annual_rent,
    legal_document_type = EXCLUDED.legal_document_type,
    legal_document_number = EXCLUDED.legal_document_number,
    status = EXCLUDED.status,
    updated_at = EXCLUDED.updated_at,
    updated_by = EXCLUDED.updated_by;

-- =====================================================================
-- 3. TABEL: karyawan (Master Data Karyawan)
--    Urutan: Top Supervisor (Admin) -> Bawahan (Angga)
-- =====================================================================

INSERT INTO karyawan (
    id,
    operation_unit_id,
    division_id,
    supervisor_id,
    employee_number,
    nik,
    legal_name,
    email,
    phone,
    sex,
    marital_status,
    religion,
    place_of_birth,
    date_of_birth,
    last_education,
    address,
    province_id,
    city_id,
    district_id,
    village_id,
    postal_code,
    original_date_of_hire,
    permanent_date,
    actual_termination_date,
    bank_id,
    account_name,
    account_number,
    status,
    created_at,
    created_by,
    updated_at,
    updated_by
) VALUES
-- Karyawan 1: Administrator Utama (Homebase: Kantor Pusat Nasional, Supervisor: NULL)
(
    'e1000000-0000-4000-a000-000000000001',
    'c1000000-0000-4000-a000-000000000001',
    NULL,
    NULL,
    'EMP-ADMIN',
    '0000000000000000',
    'Administrator Utama',
    'admin@perusahaan.com',
    '+628110000000',
    'Laki-laki',
    NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL,
    true,
    '2026-09-30 06:21:50.507',
    NULL,
    '2026-09-30 06:21:50.507',
    NULL
),
-- Karyawan 2: Angga (Homebase: Cabang Tulungagung, Supervisor: Administrator Utama)
(
    '4a1a38c7-7126-4521-b5ce-3d9f9f0d5c50',
    '891c0106-4199-46eb-a38c-f49fbcc28c35',
    NULL,
    'e1000000-0000-4000-a000-000000000001',
    'EMP-2026-001',
    '3273010101900001',
    'Angga',
    'budi.santoso@perusahaan.com',
    '+6281234567890',
    'Laki-laki',
    'Menikah',
    'Islam',
    'Sidoarjo',
    '1990-05-15',
    'S1',
    'Jl. Cibogo Atas No. 45, Sukajadi',
    NULL, NULL, NULL, NULL,
    '40164',
    '2026-01-10',
    '2026-04-10',
    NULL, NULL,
    'Budi Santoso',
    '1234567890',
    true,
    '2026-09-30 06:39:46.829',
    'a1000000-0000-4000-a000-000000000001',
    '2026-10-01 08:03:30.214',
    'a1000000-0000-4000-a000-000000000001'
)
ON CONFLICT (id) DO UPDATE SET
    operation_unit_id = EXCLUDED.operation_unit_id,
    division_id = EXCLUDED.division_id,
    supervisor_id = EXCLUDED.supervisor_id,
    employee_number = EXCLUDED.employee_number,
    nik = EXCLUDED.nik,
    legal_name = EXCLUDED.legal_name,
    email = EXCLUDED.email,
    phone = EXCLUDED.phone,
    sex = EXCLUDED.sex,
    marital_status = EXCLUDED.marital_status,
    religion = EXCLUDED.religion,
    place_of_birth = EXCLUDED.place_of_birth,
    date_of_birth = EXCLUDED.date_of_birth,
    last_education = EXCLUDED.last_education,
    address = EXCLUDED.address,
    postal_code = EXCLUDED.postal_code,
    original_date_of_hire = EXCLUDED.original_date_of_hire,
    permanent_date = EXCLUDED.permanent_date,
    actual_termination_date = EXCLUDED.actual_termination_date,
    bank_id = EXCLUDED.bank_id,
    account_name = EXCLUDED.account_name,
    account_number = EXCLUDED.account_number,
    status = EXCLUDED.status,
    updated_at = EXCLUDED.updated_at,
    updated_by = EXCLUDED.updated_by;

-- =====================================================================
-- 4. INTEGRASI RELASI: login_usr & login_grp
--    Menghubungkan user admin & pegawai ke record Karyawan
-- =====================================================================

-- 4.1 Update relasi id_relasi user admin ke Karyawan EMP-ADMIN
UPDATE login_usr 
SET id_relasi = 'e1000000-0000-4000-a000-000000000001' 
WHERE id = 'a1000000-0000-4000-a000-000000000001';

-- 4.2 Tambah Role: ADMIN STAFF (jika belum ada)
INSERT INTO login_grp (id, nama, aktif)
SELECT '15902877-e241-4a66-8d73-c2489a29f066', 'ADMIN STAFF', 1
WHERE NOT EXISTS (
    SELECT 1 FROM login_grp WHERE id = '15902877-e241-4a66-8d73-c2489a29f066' OR nama = 'ADMIN STAFF'
);

-- 4.3 Tambah/Update User: angga (terkait dengan Karyawan EMP-2026-001)
INSERT INTO login_usr (id, username, passwd, aktif, tgl_1, tgl_2, jenis, id_relasi)
VALUES (
    '6ae069d9-f17d-4add-ba29-052cdb751246',
    'angga',
    '*84AAC12F54AB666ECFC2A83C676908C8BBC381B1',
    1,
    '2026-10-01',
    '2035-12-31',
    'pegawai',
    '4a1a38c7-7126-4521-b5ce-3d9f9f0d5c50'
)
ON CONFLICT (id) DO UPDATE SET
    username = EXCLUDED.username,
    passwd = EXCLUDED.passwd,
    aktif = EXCLUDED.aktif,
    tgl_1 = EXCLUDED.tgl_1,
    tgl_2 = EXCLUDED.tgl_2,
    jenis = EXCLUDED.jenis,
    id_relasi = EXCLUDED.id_relasi;

-- 4.4 Hubungkan user angga ke group ADMIN STAFF (Aman & Idempotent)
INSERT INTO login_usr_grp (id, login_usr_id, login_grp_id)
SELECT '768917c4-7281-4e11-bce2-5d8e58083e84', '6ae069d9-f17d-4add-ba29-052cdb751246', '15902877-e241-4a66-8d73-c2489a29f066'
WHERE NOT EXISTS (
    SELECT 1 FROM login_usr_grp 
    WHERE login_usr_id = '6ae069d9-f17d-4add-ba29-052cdb751246' 
      AND login_grp_id = '15902877-e241-4a66-8d73-c2489a29f066'
);

-- 5. Aktifkan kembali pengecekan foreign key & triggers
SET session_replication_role = 'origin';

COMMIT;

-- =====================================================================
-- 6. VERIFIKASI DATA HASIL IMPORT
-- =====================================================================
SELECT 'OPERATION_UNIT' AS entity, count(*) AS total_records FROM operation_unit
UNION ALL
SELECT 'KARYAWAN' AS entity, count(*) AS total_records FROM karyawan
UNION ALL
SELECT 'LOGIN_USR' AS entity, count(*) AS total_records FROM login_usr;
