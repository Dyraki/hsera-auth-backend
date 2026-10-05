-- =====================================================================
-- DDL SKEMA POSTGRESQL UNTUK FRAMEWORK BACKEND PLATFORM (FULL UUID)
-- Target Database: PostgreSQL 14+ / 16+ (platform_db)
-- Semua Primary Key & Foreign Key menggunakan tipe data UUID
-- =====================================================================

SET statement_timeout = 0;
SET lock_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SET check_function_bodies = false;
SET client_min_messages = warning;
SET row_security = off;

-- Buat Schema public jika belum ada
CREATE SCHEMA IF NOT EXISTS public;

-- Hapus tabel lama jika ada
DROP TABLE IF EXISTS login_log CASCADE;
DROP TABLE IF EXISTS login_grp_acl CASCADE;
DROP TABLE IF EXISTS menu CASCADE;
DROP TABLE IF EXISTS login_usr_grp CASCADE;
DROP TABLE IF EXISTS login_grp CASCADE;
DROP TABLE IF EXISTS login_usr CASCADE;

-- =====================================================================
-- 1. TABEL: login_usr (Master Akun Pengguna)
-- =====================================================================
CREATE TABLE login_usr (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username VARCHAR(50) NOT NULL UNIQUE,
    passwd VARCHAR(100) NOT NULL,
    aktif SMALLINT NOT NULL DEFAULT 1,
    tgl_1 DATE NOT NULL,
    tgl_2 DATE NOT NULL,
    jenis VARCHAR(50) NOT NULL,
    id_relasi VARCHAR(50) NOT NULL
);

COMMENT ON TABLE login_usr IS 'Tabel master otentikasi pengguna backend platform (UUID PK)';

-- =====================================================================
-- 2. TABEL: login_grp (Master Role / Kelompok Pengguna)
-- =====================================================================
CREATE TABLE login_grp (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nama VARCHAR(100) NOT NULL,
    aktif SMALLINT NOT NULL DEFAULT 1
);

COMMENT ON TABLE login_grp IS 'Tabel master kelompok otorisasi role pengguna (UUID PK)';

-- =====================================================================
-- 3. TABEL: login_usr_grp (Pivot Many-to-Many User & Group)
-- =====================================================================
CREATE TABLE login_usr_grp (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    login_usr_id UUID NOT NULL,
    login_grp_id UUID NOT NULL,
    CONSTRAINT fk_login_usr_grp_usr FOREIGN KEY (login_usr_id) 
        REFERENCES login_usr(id) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_login_usr_grp_grp FOREIGN KEY (login_grp_id) 
        REFERENCES login_grp(id) ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX idx_login_usr_grp_user ON login_usr_grp (login_usr_id);
CREATE INDEX idx_login_usr_grp_group ON login_usr_grp (login_grp_id);
CREATE UNIQUE INDEX uq_login_usr_grp_pair ON login_usr_grp (login_usr_id, login_grp_id);

-- =====================================================================
-- 4. TABEL: menu (Master Hierarki Struktur Navigasi Menu)
-- =====================================================================
CREATE TABLE menu (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    upline UUID NULL,
    urut SMALLINT NOT NULL DEFAULT 0,
    nama VARCHAR(255) NOT NULL,
    tipe VARCHAR(10) NOT NULL,
    level SMALLINT NOT NULL DEFAULT 1,
    link VARCHAR(100) NOT NULL DEFAULT '#',
    icon VARCHAR(40) NOT NULL DEFAULT 'glyphicon glyphicon-file',
    aktif SMALLINT NOT NULL DEFAULT 1,
    CONSTRAINT fk_menu_upline FOREIGN KEY (upline) 
        REFERENCES menu(id) ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX idx_menu_upline ON menu (upline);
CREATE INDEX idx_menu_level_urut ON menu (level, urut);

COMMENT ON TABLE menu IS 'Tabel hierarki navigasi menu (UUID PK, upline self-referencing FK)';

-- =====================================================================
-- 5. TABEL: login_grp_acl (Matriks Hak Akses Grup terhadap Menu)
-- =====================================================================
CREATE TABLE login_grp_acl (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    login_grp_id UUID NOT NULL,
    menu_id UUID NOT NULL,
    enable SMALLINT NOT NULL DEFAULT 1,
    level SMALLINT NOT NULL DEFAULT 0,
    CONSTRAINT fk_login_grp_acl_grp FOREIGN KEY (login_grp_id) 
        REFERENCES login_grp(id) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_login_grp_acl_menu FOREIGN KEY (menu_id) 
        REFERENCES menu(id) ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX idx_login_grp_acl_group ON login_grp_acl (login_grp_id);
CREATE INDEX idx_login_grp_acl_menu ON login_grp_acl (menu_id);
CREATE UNIQUE INDEX uq_login_grp_acl_pair ON login_grp_acl (login_grp_id, menu_id);

-- =====================================================================
-- 6. TABEL: login_log (Audit Trail & Riwayat Login)
-- =====================================================================
CREATE TABLE login_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    login_usr_id UUID NOT NULL,
    menu_id UUID NULL,
    menu_nama VARCHAR(100) NULL,
    status VARCHAR(100) NOT NULL,
    tabel_relasi VARCHAR(100) NULL,
    id_relasi VARCHAR(50) NULL,
    created_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_login_log_usr FOREIGN KEY (login_usr_id) 
        REFERENCES login_usr(id) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_login_log_menu FOREIGN KEY (menu_id) 
        REFERENCES menu(id) ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE INDEX idx_login_log_user ON login_log (login_usr_id);
CREATE INDEX idx_login_log_created_at ON login_log (created_at DESC);

-- =====================================================================
-- 7. TABEL: operation_unit (Unified Organization Tree)
-- =====================================================================
CREATE TABLE operation_unit (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    parent_id UUID NULL,
    code VARCHAR(50) NOT NULL UNIQUE,
    name VARCHAR(150) NOT NULL,
    type VARCHAR(50) NOT NULL, -- 'HEAD_OFFICE', 'REGIONAL', 'AREA_OFFICE', 'OPERATION_UNIT'
    category VARCHAR(50) NULL, -- 'Cabang', 'Gudang', 'Depo', 'Hub', dll
    distribution_point VARCHAR(100) NULL,
    address TEXT NULL,
    province_id UUID NULL,
    city_id UUID NULL,
    district_id UUID NULL,
    village_id UUID NULL,
    postal_code VARCHAR(10) NULL,
    phone VARCHAR(30) NULL,
    latitude DECIMAL(10, 8) NULL,
    longitude DECIMAL(11, 8) NULL,
    building_status VARCHAR(30) NULL,
    lease_category VARCHAR(30) NULL,
    lease_start_date DATE NULL,
    lease_end_date DATE NULL,
    annual_rent DECIMAL(15, 2) NULL,
    legal_document_type VARCHAR(50) NULL,
    legal_document_number VARCHAR(100) NULL,
    status BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by UUID NULL,
    updated_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_by UUID NULL,
    CONSTRAINT fk_ou_parent FOREIGN KEY (parent_id) 
        REFERENCES operation_unit(id) ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT fk_ou_created_by FOREIGN KEY (created_by) 
        REFERENCES login_usr(id) ON DELETE SET NULL,
    CONSTRAINT fk_ou_updated_by FOREIGN KEY (updated_by) 
        REFERENCES login_usr(id) ON DELETE SET NULL
);

CREATE INDEX idx_ou_parent ON operation_unit (parent_id);
CREATE INDEX idx_ou_type ON operation_unit (type);
CREATE INDEX idx_ou_code ON operation_unit (code);
CREATE INDEX idx_ou_status ON operation_unit (status);

COMMENT ON TABLE operation_unit IS 'Tabel organisasi hierarkis pohon (Head Office, Regional, Area Office, Cabang/Gudang)';

-- =====================================================================
-- 8. TABEL: karyawan (Master Karyawan 32 Kolom)
-- =====================================================================
CREATE TABLE karyawan (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    operation_unit_id UUID NOT NULL,
    division_id UUID NULL,
    supervisor_id UUID NULL,
    employee_number VARCHAR(50) NOT NULL UNIQUE,
    nik VARCHAR(20) NOT NULL UNIQUE,
    legal_name VARCHAR(150) NOT NULL,
    email VARCHAR(100) NULL UNIQUE,
    phone VARCHAR(30) NULL,
    sex VARCHAR(20) NULL,
    marital_status VARCHAR(30) NULL,
    religion VARCHAR(30) NULL,
    place_of_birth VARCHAR(100) NULL,
    date_of_birth DATE NULL,
    last_education VARCHAR(50) NULL,
    address TEXT NULL,
    province_id UUID NULL,
    city_id UUID NULL,
    district_id UUID NULL,
    village_id UUID NULL,
    postal_code VARCHAR(10) NULL,
    original_date_of_hire DATE NULL,
    permanent_date DATE NULL,
    actual_termination_date DATE NULL,
    bank_id UUID NULL,
    account_name VARCHAR(100) NULL,
    account_number VARCHAR(50) NULL,
    status BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by UUID NULL,
    updated_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_by UUID NULL,
    CONSTRAINT fk_karyawan_ou FOREIGN KEY (operation_unit_id) 
        REFERENCES operation_unit(id) ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT fk_karyawan_supervisor FOREIGN KEY (supervisor_id) 
        REFERENCES karyawan(id) ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT fk_karyawan_created_by FOREIGN KEY (created_by) 
        REFERENCES login_usr(id) ON DELETE SET NULL,
    CONSTRAINT fk_karyawan_updated_by FOREIGN KEY (updated_by) 
        REFERENCES login_usr(id) ON DELETE SET NULL
);

CREATE INDEX idx_karyawan_ou ON karyawan (operation_unit_id);
CREATE INDEX idx_karyawan_supervisor ON karyawan (supervisor_id);
CREATE INDEX idx_karyawan_nik ON karyawan (nik);
CREATE INDEX idx_karyawan_employee_number ON karyawan (employee_number);
CREATE INDEX idx_karyawan_status ON karyawan (status);

COMMENT ON TABLE karyawan IS 'Tabel master SDM/Karyawan lengkap 32 kolom dengan relasi ke unit penempatan dan atasan';

-- =====================================================================
-- 9. TABEL: user_session (Pencatatan Sesi Aktif & Refresh Token)
-- =====================================================================
CREATE TABLE IF NOT EXISTS user_session (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    refresh_token_hash VARCHAR(255) NOT NULL,
    ip_address VARCHAR(45) NULL,
    user_agent TEXT NULL,
    is_revoked BOOLEAN NOT NULL DEFAULT FALSE,
    expires_at TIMESTAMP(3) NOT NULL,
    created_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_user_session_user FOREIGN KEY (user_id) 
        REFERENCES login_usr(id) ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_user_session_user_id ON user_session (user_id);
CREATE INDEX IF NOT EXISTS idx_user_session_token_hash ON user_session (refresh_token_hash);
CREATE INDEX IF NOT EXISTS idx_user_session_is_revoked ON user_session (is_revoked);

COMMENT ON TABLE user_session IS 'Tabel pelacakan sesi aktif, refresh token rotation, dan audit perangkat pengguna';

