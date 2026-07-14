import { Router, Response } from "express";
import { authenticate, requireAdmin } from "../middleware/auth";
import { validate } from "../middleware/validate";
import { AvatarSchema, AvatarUpdateSchema } from "../config/schemas";
import * as avatarService from "../services/avatarService";

const router = Router();

router.get("/", authenticate, async (req, res: Response) => {
  const courseId = req.query.course_id as string | undefined;
  res.json(await avatarService.listAvatars(courseId));
});

router.get("/:id", authenticate, async (req, res: Response) => {
  res.json(await avatarService.getAvatar(req.params.id));
});

router.post("/", requireAdmin, validate(AvatarSchema), async (req, res: Response) => {
  res.status(201).json(await avatarService.createAvatar(req.body));
});

router.put("/:id", requireAdmin, validate(AvatarUpdateSchema), async (req, res: Response) => {
  res.json(await avatarService.updateAvatar(req.params.id, req.body));
});

router.delete("/:id", requireAdmin, async (req, res: Response) => {
  await avatarService.deleteAvatar(req.params.id);
  res.json({ detail: "Avatar deleted" });
});

export default router;
