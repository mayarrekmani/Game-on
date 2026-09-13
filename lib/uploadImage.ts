import type { SupabaseClient } from "@supabase/supabase-js";

export async function uploadAvatarImage(
  supabase: SupabaseClient,
  file: File,
  folder: "profiles" | "groups"
): Promise<string> {
  const ext = file.name.split(".").pop() || "jpg";
  const path = `${folder}/${crypto.randomUUID()}.${ext}`;

  const { error } = await supabase.storage.from("avatars").upload(path, file, {
    cacheControl: "3600",
    upsert: false,
  });

  if (error) throw error;

  const { data } = supabase.storage.from("avatars").getPublicUrl(path);
  return data.publicUrl;
}
