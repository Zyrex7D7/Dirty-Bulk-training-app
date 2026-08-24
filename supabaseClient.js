import { createClient } from "@supabase/supabase-js";

// Estes valores vêm do teu projeto Supabase (Settings > API > Data API / API Keys).
// A "publishable key" é segura para usar no frontend: o acesso real aos dados
// é controlado pelas políticas de Row Level Security definidas em supabase-schema.sql.
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error(
    "Faltam VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY. Confirma o ficheiro .env na raiz do projeto."
  );
}

export const supabase = createClient(supabaseUrl, supabaseKey);
