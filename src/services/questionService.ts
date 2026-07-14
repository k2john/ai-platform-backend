import { getSupabase } from "../db/supabase";
import { createError } from "../middleware/errorHandler";
import { Question } from "../types";

export async function listQuestions(courseId: string): Promise<Question[]> {
  const { data, error } = await getSupabase()
    .from("questions")
    .select("*")
    .eq("course_id", courseId)
    .order("order_index", { ascending: true });

  if (error) throw createError(error.message, 500);
  return data as Question[];
}

export async function getQuestion(questionId: string): Promise<Question> {
  const { data, error } = await getSupabase()
    .from("questions")
    .select("*")
    .eq("question_id", questionId)
    .maybeSingle();

  if (error || !data) throw createError("Question not found", 404);
  return data as Question;
}

export async function createQuestion(payload: Partial<Question>): Promise<Question> {
  const { data, error } = await getSupabase()
    .from("questions")
    .insert(payload)
    .select()
    .single();

  if (error || !data) throw createError("Failed to create question", 500);
  return data as Question;
}

export async function updateQuestion(
  questionId: string,
  payload: Partial<Question>
): Promise<Question> {
  const { data, error } = await getSupabase()
    .from("questions")
    .update(payload)
    .eq("question_id", questionId)
    .select()
    .single();

  if (error || !data) throw createError("Question not found", 404);
  return data as Question;
}

export async function deleteQuestion(questionId: string): Promise<void> {
  const { error } = await getSupabase()
    .from("questions")
    .delete()
    .eq("question_id", questionId);

  if (error) throw createError("Failed to delete question", 500);
}
