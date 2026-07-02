import "server-only";
import { createClient } from "@supabase/supabase-js";

// Cliente con privilegios de administrador (service_role). SOLO se puede usar
// del lado del servidor (server actions / route handlers). NUNCA en el cliente.
export function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } },
  );
}
