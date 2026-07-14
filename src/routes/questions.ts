import { Router, Response } from "express";
import { authenticate, requireAdmin } from "../middleware/auth";
import { validate } from "../middleware/validate";
import { QuestionSchema, QuestionUpdateSchema } from "../config/schemas";
import * as questionService from "../services/questionService";

const router = Router();

router.get("/", authenticate, async (req, res: Response) => {
  const courseId = req.query.course_id as string;
  if (!courseId) { res.status(400).json({ detail: "course_id query param required" }); return; }
  res.json(await questionService.listQuestions(courseId));
});

router.get("/:id", authenticate, async (req, res: Response) => {
  res.json(await questionService.getQuestion(req.params.id));
});

router.post("/", requireAdmin, validate(QuestionSchema), async (req, res: Response) => {
  res.status(201).json(await questionService.createQuestion(req.body));
});

router.put("/:id", requireAdmin, validate(QuestionUpdateSchema), async (req, res: Response) => {
  res.json(await questionService.updateQuestion(req.params.id, req.body));
});

router.delete("/:id", requireAdmin, async (req, res: Response) => {
  await questionService.deleteQuestion(req.params.id);
  res.json({ detail: "Question deleted" });
});

export default router;
