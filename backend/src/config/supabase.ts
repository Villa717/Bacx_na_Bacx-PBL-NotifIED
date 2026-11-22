import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { env } from "./env.js";

let supabaseAdmin: SupabaseClient | null = null;

export function getSupabaseAdmin(): SupabaseClient | null {
  if (!env.supabaseUrl || !env.supabaseServiceRoleKey) {
    return null;
  }
  if (!supabaseAdmin) {
    supabaseAdmin = createClient(env.supabaseUrl, env.supabaseServiceRoleKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });
  }
  return supabaseAdmin;
}

/**
 * Attempts to persist optional AI JSONB columns onto public.events.
 * Silently returns false if Supabase admin credentials are unset or if the optional columns do not exist yet.
 */
export async function persistOptionalEventFields(
  eventId: number | undefined,
  fields: Record<string, unknown>
): Promise<boolean> {
  if (!eventId) return false;
  const supabase = getSupabaseAdmin();
  if (!supabase) return false;

  try {
    const { error } = await supabase
      .from("events")
      .update({
        ...fields,
        updated_at: new Date().toISOString(),
      })
      .eq("event_id", eventId);

    if (error) {
      console.warn(
        `[Supabase] Optional AI column persistence skipped for event ${eventId}: ${error.message}`
      );
      return false;
    }
    return true;
  } catch (err) {
    console.warn(`[Supabase] Optional persistence failed for event ${eventId}:`, err);
    return false;
  }
}
