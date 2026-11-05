import { toApiError } from '@/api/errors';
import { supabase } from '@/lib/supabase';

/** Everything the app holds about the signed-in person (export_my_data, 0026). */
export async function exportMyData(): Promise<Record<string, unknown>> {
  const { data, error } = await supabase.rpc('export_my_data');
  if (error) throw toApiError(error);
  return data;
}
