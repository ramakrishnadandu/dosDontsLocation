import { randomUUID } from "crypto";

export function newId(): string {
  return randomUUID();
}

export function newRequestId(): string {
  return `req_${randomUUID()}`;
}

export function newCorrelationId(): string {
  return `cor_${randomUUID()}`;
}
