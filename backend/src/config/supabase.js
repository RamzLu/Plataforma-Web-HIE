import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.SUPABASE_URL?.trim();
// En el servidor se prioriza SUPABASE_SERVICE_ROLE_KEY / SUPABASE_SECRET_KEY para operar sobre Storage con RLS estricto;
// se mantiene compatibilidad con SUPABASE_ANON_KEY si aun no se definio la clave secreta en el entorno local.
const supabaseKey = (
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.SUPABASE_SECRET_KEY ||
  process.env.SUPABASE_KEY ||
  process.env.SUPABASE_ANON_KEY ||
  ""
).trim();

if (!supabaseUrl || !supabaseKey) {
  throw new Error(
    "Configuración incompleta de Supabase: defina SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY (o SUPABASE_ANON_KEY) en el archivo .env del backend."
  );
}

export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
});

