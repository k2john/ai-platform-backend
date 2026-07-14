import { getSupabase } from "../db/supabase";
import { createError } from "../middleware/errorHandler";
import { Course } from "../types";

export async function listCourses(): Promise<Course[]> {
  const { data, error } = await getSupabase()
    .from("courses")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) throw createError(error.message, 500);
  return data as Course[];
}

export async function getCourse(courseId: string): Promise<Course> {
  const { data, error } = await getSupabase()
    .from("courses")
    .select("*")
    .eq("course_id", courseId)
    .maybeSingle();

  if (error || !data) throw createError("Course not found", 404);
  return data as Course;
}

export async function createCourse(
  payload: Partial<Course>,
  adminId: string
): Promise<Course> {
  const { data, error } = await getSupabase()
    .from("courses")
    .insert({ ...payload, created_by: adminId })
    .select()
    .single();

  if (error || !data) throw createError("Failed to create course", 500);
  return data as Course;
}

export async function updateCourse(
  courseId: string,
  payload: Partial<Course>
): Promise<Course> {
  const { data, error } = await getSupabase()
    .from("courses")
    .update(payload)
    .eq("course_id", courseId)
    .select()
    .single();

  if (error || !data) throw createError("Course not found", 404);
  return data as Course;
}

export async function deleteCourse(courseId: string): Promise<void> {
  const { error } = await getSupabase()
    .from("courses")
    .delete()
    .eq("course_id", courseId);

  if (error) throw createError("Failed to delete course", 500);
}

export async function assignStudent(
  courseId: string,
  studentId: string
): Promise<void> {
  const { error } = await getSupabase()
    .from("course_assignments")
    .insert({ course_id: courseId, student_id: studentId });

  if (error) {
    if (error.code === "23505") throw createError("Student already assigned to this course", 409);
    throw createError("Failed to assign student", 500);
  }
}

export async function getStudentCourses(studentId: string): Promise<Course[]> {
  const { data, error } = await getSupabase()
    .from("course_assignments")
    .select("courses(*)")
    .eq("student_id", studentId);

  if (error) throw createError(error.message, 500);
  return (data ?? []).map((row: Record<string, unknown>) => row.courses as Course);
}
