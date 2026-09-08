import type { NextFunction, Request, Response } from "express";
import { AppError, childLogger } from "@locaguide/shared";
import { ZodError } from "zod";

const log = childLogger({ component: "errorHandler" });

/**
 * Translates any thrown error into the standard API error envelope
 * (section 26): { "error": { "code", "message", "request_id" } }.
 * Never leaks stack traces or internal details to the client.
 */
export function errorHandler(err: unknown, req: Request, res: Response, _next: NextFunction): void {
  if (err instanceof AppError) {
    if (err.statusCode >= 500) {
      log.error({ err: err.message, requestId: req.requestId, code: err.code }, "Request failed");
    }
    res.status(err.statusCode).json({
      error: { code: err.code, message: err.message, request_id: req.requestId },
    });
    return;
  }

  if (err instanceof ZodError) {
    res.status(422).json({
      error: {
        code: "VALIDATION_ERROR",
        message: "Request failed validation.",
        request_id: req.requestId,
      },
    });
    return;
  }

  log.error({ err: (err as Error)?.message, stack: (err as Error)?.stack, requestId: req.requestId }, "Unhandled error");
  res.status(500).json({
    error: { code: "INTERNAL_ERROR", message: "An unexpected error occurred.", request_id: req.requestId },
  });
}

export function notFoundHandler(req: Request, res: Response): void {
  res.status(404).json({
    error: { code: "ROUTE_NOT_FOUND", message: "The requested route does not exist.", request_id: req.requestId },
  });
}
