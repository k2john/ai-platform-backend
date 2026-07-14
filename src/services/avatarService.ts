import { getSupabase } from "../db/supabase";
import { createError } from "../middleware/errorHandler";
import { Avatar } from "../types";

export async function listAvatars(courseId?: string): Promise<Avatar[]> {
  let query = getSupabase().from("avatars").select("*").order("created_at", { ascending: false });
  if (courseId) query = query.eq("course_id", courseId);
  const { data, error } = await query;
  if (error) throw createError(error.message, 500);
  return data as Avatar[];
}

export async function getAvatar(avatarId: string): Promise<Avatar> {
  const { data, error } = await getSupabase().from("avatars").select("*").eq("avatar_id", avatarId).maybeSingle();
  if (error || !data) throw createError("Avatar not found", 404);
  return data as Avatar;
}

export async function createAvatar(payload: Partial<Avatar>): Promise<Avatar> {
  const { data, error } = await getSupabase().from("avatars").insert(payload).select().single();
  if (error || !data) throw createError("Failed to create avatar", 500);
  return data as Avatar;
}

export async function updateAvatar(avatarId: string, payload: Partial<Avatar>): Promise<Avatar> {
  const { data, error } = await getSupabase().from("avatars").update(payload).eq("avatar_id", avatarId).select().single();
  if (error || !data) throw createError("Avatar not found", 404);
  return data as Avatar;
}

export async function deleteAvatar(avatarId: string): Promise<void> {
  const { error } = await getSupabase().from("avatars").delete().eq("avatar_id", avatarId);
  if (error) throw createError("Failed to delete avatar", 500);
}
