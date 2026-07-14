import { Router, Response } from "express";
import { authenticate, requireAdmin } from "../middleware/auth";
import { validate } from "../middleware/validate";
import { InterviewSchema, InterviewUpdateSchema } from "../config/schemas";
import * as interviewService from "../services/interviewService";
import { AuthRequest } from "../types";

const router = Router();

router.get("/", authenticate, async (req: AuthRequest, res: Response) => {
  // Students only see their own interviews
  const studentId = req.user!.role === "student"
    ? req.user!.sub
    : (req.query.student_id as string | undefined);
  const courseId = req.query.course_id as string | undefined;
  res.json(await interviewService.listInterviews({ student_id: studentId, course_id: courseId }));
});

router.get("/:id", authenticate, async (req, res: Response) => {
  res.json(await interviewService.getInterview(req.params.id));
});

router.post("/", requireAdmin, validate(InterviewSchema), async (req, res: Response) => {
  res.status(201).json(await interviewService.createInterview(req.body));
});

router.put("/:id", requireAdmin, validate(InterviewUpdateSchema), async (req, res: Response) => {
  res.json(await interviewService.updateInterview(req.params.id, req.body));
});

// POST /api/interviews/:id/start
router.post("/:id/start", authenticate, async (req, res: Response) => {
  res.json(await interviewService.startInterview(req.params.id));
});

// POST /api/interviews/:id/end
router.post("/:id/end", authenticate, async (req, res: Response) => {
  res.json(await interviewService.endInterview(req.params.id));
});

router.delete("/:id", requireAdmin, async (req, res: Response) => {
  await interviewService.deleteInterview(req.params.id);
  res.json({ detail: "Interview deleted" });
});

export default router;
