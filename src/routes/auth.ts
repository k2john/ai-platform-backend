import { Router, Response } from "express";
import { validate } from "../middleware/validate";
import { authenticate } from "../middleware/auth";
import { RegisterSchema, LoginSchema, UpdateUserSchema } from "../config/schemas";
import * as authService from "../services/authService";
import { AuthRequest } from "../types";

const router = Router();

// POST /api/auth/register
router.post("/register", validate(RegisterSchema), async (req, res: Response) => {
  const result = await authService.register(req.body);
  res.status(201).json(result);
});

// POST /api/auth/login
router.post("/login", validate(LoginSchema), async (req, res: Response) => {
  const result = await authService.login(req.body);
  res.json(result);
});

// GET /api/auth/me
router.get("/me", authenticate, async (req: AuthRequest, res: Response) => {
  const user = await authService.getUserById(req.user!.sub);
  res.json(user);
});

// PUT /api/auth/me
router.put("/me", authenticate, validate(UpdateUserSchema), async (req: AuthRequest, res: Response) => {
  const user = await authService.updateUser(req.user!.sub, req.body);
  res.json(user);
});

export default router;
