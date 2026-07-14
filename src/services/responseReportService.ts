import { getSupabase } from "../db/supabase";
import { createError } from "../middleware/errorHandler";
import { InterviewResponse, Report } from "../types";

// ── Responses ────────────────────────────────────────────────
export async function listResponses(interviewId: string): Promise<InterviewResponse[]> {
  const { data, error } = await getSupabase()
    .from("responses")
    .select("*")
    .eq("interview_id", interviewId)
    .order("created_at", { ascending: true });

  if (error) throw createError(error.message, 500);
  return data as InterviewResponse[];
}

export async function saveResponse(
  payload: Partial<InterviewResponse>
): Promise<InterviewResponse> {
  const { data, error } = await getSupabase()
    .from("responses")
    .insert(payload)
    .select()
    .single();

  if (error || !data) throw createError("Failed to save response", 500);
  return data as InterviewResponse;
}

export async function updateResponse(
  responseId: string,
  payload: Partial<InterviewResponse>
): Promise<InterviewResponse> {
  const { data, error } = await getSupabase()
    .from("responses")
    .update(payload)
    .eq("response_id", responseId)
    .select()
    .single();

  if (error || !data) throw createError("Response not found", 404);
  return data as InterviewResponse;
}

export async function deleteResponse(responseId: string): Promise<void> {
  const { error } = await getSupabase()
    .from("responses")
    .delete()
    .eq("response_id", responseId);

  if (error) throw createError("Failed to delete response", 500);
}

// ── Reports ──────────────────────────────────────────────────
export async function getReport(interviewId: string): Promise<Report> {
  const { data, error } = await getSupabase()
    .from("reports")
    .select("*")
    .eq("interview_id", interviewId)
    .maybeSingle();

  if (error || !data) throw createError("Report not found", 404);
  return data as Report;
}

export async function upsertReport(payload: Partial<Report>): Promise<Report> {
  const { data, error } = await getSupabase()
    .from("reports")
    .upsert(payload, { onConflict: "interview_id" })
    .select()
    .single();

  if (error || !data) throw createError("Failed to generate report", 500);
  return data as Report;
}

export async function deleteReport(reportId: string): Promise<void> {
  const { error } = await getSupabase()
    .from("reports")
    .delete()
    .eq("report_id", reportId);

  if (error) throw createError("Failed to delete report", 500);
}
