import { Router, Response } from "express";
import { authenticate, requireAdmin } from "../middleware/auth";
import { validate } from "../middleware/validate";
import { CourseSchema, CourseUpdateSchema } from "../config/schemas";
import * as courseService from "../services/courseService";
import { AuthRequest } from "../types";

const router = Router();

// GET /api/courses
router.get("/", authenticate, async (_req, res: Response) => {
  res.json(await courseService.listCourses());
});

// GET /api/courses/my  — student's assigned courses
router.get("/my", authenticate, async (req: AuthRequest, res: Response) => {
  res.json(await courseService.getStudentCourses(req.user!.sub));
});

// GET /api/courses/:id
router.get("/:id", authenticate, async (req, res: Response) => {
  res.json(await courseService.getCourse(req.params.id));
});

// POST /api/courses  (admin only)
router.post("/", requireAdmin, validate(CourseSchema), async (req: AuthRequest, res: Response) => {
  const course = await courseService.createCourse(req.body, req.user!.sub);
  res.status(201).json(course);
});

// PUT /api/courses/:id  (admin only)
router.put("/:id", requireAdmin, validate(CourseUpdateSchema), async (req, res: Response) => {
  res.json(await courseService.updateCourse(req.params.id, req.body));
});

// DELETE /api/courses/:id  (admin only)
router.delete("/:id", requireAdmin, async (req, res: Response) => {
  await courseService.deleteCourse(req.params.id);
  res.json({ detail: "Course deleted" });
});

// POST /api/courses/:id/assign/:studentId  (admin only)
router.post("/:id/assign/:studentId", requireAdmin, async (req, res: Response) => {
  await courseService.assignStudent(req.params.id, req.params.studentId);
  res.json({ detail: "Student assigned" });
});

export default router;
