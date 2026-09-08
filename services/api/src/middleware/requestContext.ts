import type { NextFunction, Request, Response } from "express";
import { newCorrelationId, newRequestId } from "@locaguide/shared";

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      requestId: string;
      correlationId: string;
    }
  }
}

/** Attaches a request_id/correlation_id to every request for tracing and the error envelope. */
export function requestContext(req: Request, res: Response, next: NextFunction): void {
  req.requestId = (req.header("x-request-id") as string) || newRequestId();
  req.correlationId = (req.header("x-correlation-id") as string) || newCorrelationId();
  res.setHeader("x-request-id", req.requestId);
  res.setHeader("x-correlation-id", req.correlationId);
  next();
}
