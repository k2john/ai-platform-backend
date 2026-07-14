import { getSupabase } from "../db/supabase";
import { createError } from "../middleware/errorHandler";
import { Interview } from "../types";

export async function listInterviews(filters: {
  student_id?: string;
  course_id?: string;
}): Promise<Interview[]> {
  let query = getSupabase()
    .from("interviews")
    .select("*")
    .order("scheduled_time", { ascending: false });

  if (filters.student_id) query = query.eq("student_id", filters.student_id);
  if (filters.course_id)  query = query.eq("course_id", filters.course_id);

  const { data, error } = await query;
  if (error) throw createError(error.message, 500);
  return data as Interview[];
}

export async function getInterview(interviewId: string): Promise<Interview> {
  const { data, error } = await getSupabase()
    .from("interviews")
    .select("*")
    .eq("interview_id", interviewId)
    .maybeSingle();

  if (error || !data) throw createError("Interview not found", 404);
  return data as Interview;
}

export async function createInterview(payload: {
  student_id: string;
  course_id: string;
  scheduled_time: string;
  duration_minutes: number;
}): Promise<Interview> {
  const { data, error } = await getSupabase()
    .from("interviews")
    .insert(payload)
    .select()
    .single();

  if (error || !data) throw createError("Failed to create interview", 500);
  return data as Interview;
}

export async function updateInterview(
  interviewId: string,
  payload: Partial<Interview>
): Promise<Interview> {
  const { data, error } = await getSupabase()
    .from("interviews")
    .update(payload)
    .eq("interview_id", interviewId)
    .select()
    .single();

  if (error || !data) throw createError("Interview not found", 404);
  return data as Interview;
}

export async function startInterview(interviewId: string): Promise<Interview> {
  return updateInterview(interviewId, {
    status: "in_progress",
    started_at: new Date().toISOString(),
  });
}

export async function endInterview(interviewId: string): Promise<Interview> {
  return updateInterview(interviewId, {
    status: "completed",
    ended_at: new Date().toISOString(),
  });
}

export async function deleteInterview(interviewId: string): Promise<void> {
  const { error } = await getSupabase()
    .from("interviews")
    .delete()
    .eq("interview_id", interviewId);

  if (error) throw createError("Failed to delete interview", 500);
}
