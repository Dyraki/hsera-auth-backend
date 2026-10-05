Migration instructions: convert string menu IDs to INT (safe approach)

Overview:

- This repository already contains a `seed.ts` that creates numeric menu IDs.
- For production data, follow these steps to safely migrate existing string IDs to numeric IDs.

Steps:

1. Backup current tables (run `backup_and_migrate_menu.sql`):

   mysql -u root -p -D your_database < backend/scripts/backup_and_migrate_menu.sql

2. Use a migration script (Node) to perform the mapping:
   - Read all rows from `menu_backup` ordered by hierarchy (parents first).
   - Insert rows into the new `menu` table (with INT `id` auto-increment) preserving `urut`, `nama`, etc.
   - Insert a mapping row into a temporary table `menu_id_map(old_id VARCHAR(50), new_id INT)`.
   - Once all menus inserted, update `login_grp_acl` by joining `menu_id_map` to replace `menu_id` values.
   - Update `login_log.menu_id` similarly.

3. Verify:
   - Check that `login_grp_acl` entries reference existing numeric `menu.id` values.
   - Test login and ACL behavior in a staging environment.

4. Rollback:
   - If anything goes wrong, restore from backups created in step 1:

     RENAME TABLE login_grp_acl TO login_grp_acl_failed;
     RENAME TABLE login_grp_acl_backup TO login_grp_acl;
     RENAME TABLE menu TO menu_failed;
     RENAME TABLE menu_backup TO menu;

Example: we can provide an automated Node migration script on request.
