#!/usr/bin/env node
// Deletes personal data past its retention period (supabase/migrations/
// 0025_retention.sql has the schedule). Photo files first, through the
// Storage API, then the rows and expired accounts. Runs daily from
// .github/workflows/retention.yml; needs the project's service role key,
// which never leaves the server side.
//
//   SUPABASE_URL=… SUPABASE_SERVICE_ROLE_KEY=… node scripts/retention.mjs [--dry-run]
import { createClient } from '@supabase/supabase-js';

const url = process.env.SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  console.error('Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.');
  process.exit(1);
}
const dryRun = process.argv.includes('--dry-run');
const db = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });

const { data: files, error: filesError } = await db.rpc('retention_photo_paths');
if (filesError) throw filesError;
const paths = files.map((row) => row.path);

if (dryRun) {
  const { data: accounts, error } = await db.rpc('retention_expired_accounts');
  if (error) throw error;
  console.log(JSON.stringify({ dry_run: true, photo_files: paths.length, accounts: accounts.length }));
  process.exit(0);
}

for (let i = 0; i < paths.length; i += 100) {
  const { error } = await db.storage.from('challenge-photos').remove(paths.slice(i, i + 100));
  if (error) throw error;
}
const { data: deleted, error } = await db.rpc('apply_retention');
if (error) throw error;
// Counts only: nothing personal goes into the job's log.
console.log(JSON.stringify({ photo_files: paths.length, ...deleted }));
