-- Profiles no longer have a bio. Nobody but its author ever saw it, so it
-- was personal data kept for no purpose (docs/privacy/data-inventory.md).
-- Dropping the column deletes every bio already written; its length check
-- (0011) and its column grant go with it. export_my_data() reads the whole
-- profile row, so it needs no change.
alter table public.profiles drop column if exists bio;
