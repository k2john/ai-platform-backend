import { Router, Response } from "express";
import { authenticate, requireAdmin } from "../middleware/auth";
import { validate } from "../middleware/validate";
import { ResponseSchema, ReportSchema } from "../config/schemas";
import * as service from "../services/responseReportService";

// ── Responses ────────────────────────────────────────────────
export const responsesRouter = Router();

responsesRouter.get("/", authenticate, async (req, res: Response) => {
  const interviewId = req.query.interview_id as string;
  if (!interviewId) { res.status(400).json({ detail: "interview_id required" }); return; }
  res.json(await service.listResponses(interviewId));
});

responsesRouter.post("/", authenticate, validate(ResponseSchema), async (req, res: Response) => {
  res.status(201).json(await service.saveResponse(req.body));
});

responsesRouter.put("/:id", requireAdmin, async (req, res: Response) => {
  res.json(await service.updateResponse(req.params.id, req.body));
});

responsesRouter.delete("/:id", requireAdmin, async (req, res: Response) => {
  await service.deleteResponse(req.params.id);
  res.json({ detail: "Response deleted" });
});

// ── Reports ──────────────────────────────────────────────────
export const reportsRouter = Router();

reportsRouter.get("/", authenticate, async (req, res: Response) => {
  const interviewId = req.query.interview_id as string;
  if (!interviewId) { res.status(400).json({ detail: "interview_id required" }); return; }
  res.json(await service.getReport(interviewId));
});

reportsRouter.post("/", authenticate, validate(ReportSchema), async (req, res: Response) => {
  res.status(201).json(await service.upsertReport(req.body));
});

reportsRouter.delete("/:id", requireAdmin, async (req, res: Response) => {
  await service.deleteReport(req.params.id);
  res.json({ detail: "Report deleted" });
});
