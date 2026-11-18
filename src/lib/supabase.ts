import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export const createEphemeralSupabaseClient = () =>
  createClient(supabaseUrl, supabaseAnonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

export const getSignedDocumentUrl = async (storagePath: string): Promise<string> => {
  if (
    !storagePath ||
    /^(data:|https?:\/\/|blob:|mock:)/i.test(storagePath) ||
    storagePath.startsWith('fallback/')
  ) {
    return storagePath;
  }

  const { data, error } = await supabase.storage
    .from('dossier-documents')
    .createSignedUrl(storagePath, 900);

  return error ? storagePath : data.signedUrl;
};
