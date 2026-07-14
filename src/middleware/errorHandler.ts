import { Request, Response, NextFunction } from "express";

export interface AppError extends Error {
  statusCode?: number;
  detail?: string;
}

export function createError(message: string, statusCode = 400): AppError {
  const err: AppError = new Error(message);
  err.statusCode = statusCode;
  err.detail = message;
  return err;
}

export function errorHandler(
  err: AppError,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  const statusCode = err.statusCode || 500;
  const message = err.detail || err.message || "Internal server error";

  console.error(`[ERROR] ${statusCode} — ${message}`);
  if (statusCode === 500) console.error(err.stack);

  res.status(statusCode).json({ detail: message });
}
