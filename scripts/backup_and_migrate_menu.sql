-- Backup current tables and prepare for migration from string menu IDs to integer IDs
-- Usage: execute on the MySQL server with appropriate privileges.

-- 1) Backup tables
CREATE TABLE IF NOT EXISTS menu_backup LIKE menu;
INSERT INTO menu_backup SELECT * FROM menu;

CREATE TABLE IF NOT EXISTS login_grp_acl_backup LIKE login_grp_acl;
INSERT INTO login_grp_acl_backup SELECT * FROM login_grp_acl;

CREATE TABLE IF NOT EXISTS login_log_backup LIKE login_log;
INSERT INTO login_log_backup SELECT * FROM login_log;

-- 2) The actual conversion requires creating a new `menu_new` table with
--    an INT auto-increment primary key, copying rows while recording a mapping
--    from old string id -> new int id, then updating related tables.
-- Because this operation requires multiple dependent steps and careful mapping,
-- it's recommended to run a small migration script (Node/Python) that:
--  - reads rows from `menu_backup` in parent-first order
--  - inserts into `menu` (new schema) capturing new ids
--  - writes mapping into a temporary table `menu_id_map(old_id VARCHAR, new_id INT)`
--  - updates `login_grp_acl` and `login_log` using the map

-- 3) Rollback is simple: restore from backups
--    DROP TABLE IF EXISTS login_grp_acl; RENAME TABLE login_grp_acl_backup TO login_grp_acl;
--    DROP TABLE IF EXISTS menu; RENAME TABLE menu_backup TO menu;

-- See `migrate_instructions.md` for a step-by-step Node migration example.

-- End of backup_and_migrate_menu.sql
