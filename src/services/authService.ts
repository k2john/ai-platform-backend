import { getSupabase } from "../db/supabase";
import { hashPassword, verifyPassword, signToken } from "../config/security";
import { createError } from "../middleware/errorHandler";
import { UserPublic, AuthResponse } from "../types";

function toPublic(user: Record<string, unknown>): UserPublic {
  return {
    user_id: user.user_id as string,
    email: user.email as string,
    role: user.role as "admin" | "student",
    full_name: (user.full_name as string) || null,
    avatar_url: (user.avatar_url as string) || null,
    created_at: user.created_at as string,
  };
}

export async function register(data: {
  email: string;
  password: string;
  full_name: string;
  role: "admin" | "student";
}): Promise<AuthResponse> {
  const db = getSupabase();

  // Check duplicate email
  const { data: existing } = await db
    .from("users")
    .select("user_id")
    .eq("email", data.email)
    .maybeSingle();

  if (existing) throw createError("Email already registered", 409);

  const { data: inserted, error } = await db
    .from("users")
    .insert({
      email: data.email,
      password_hash: await hashPassword(data.password),
      role: data.role,
      full_name: data.full_name,
    })
    .select()
    .single();

  if (error || !inserted) throw createError("Failed to create user", 500);

  const user = toPublic(inserted);
  const token = signToken({ sub: user.user_id, role: user.role });
  return { token, user };
}

export async function login(data: {
  email: string;
  password: string;
}): Promise<AuthResponse> {
  const db = getSupabase();

  const { data: found } = await db
    .from("users")
    .select("*")
    .eq("email", data.email)
    .maybeSingle();

  if (!found) throw createError("Invalid email or password", 401);

  const valid = await verifyPassword(data.password, found.password_hash as string);
  if (!valid) throw createError("Invalid email or password", 401);

  const user = toPublic(found);
  const token = signToken({ sub: user.user_id, role: user.role });
  return { token, user };
}

export async function getUserById(userId: string): Promise<UserPublic> {
  const db = getSupabase();
  const { data, error } = await db
    .from("users")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();

  if (error || !data) throw createError("User not found", 404);
  return toPublic(data);
}

export async function updateUser(
  userId: string,
  updates: { full_name?: string; avatar_url?: string }
): Promise<UserPublic> {
  const db = getSupabase();
  const { data, error } = await db
    .from("users")
    .update(updates)
    .eq("user_id", userId)
    .select()
    .single();

  if (error || !data) throw createError("User not found", 404);
  return toPublic(data);
}
