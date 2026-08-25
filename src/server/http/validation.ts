import { z } from "zod";
import { AppError } from "@/server/http/errors";

const DEFAULT_MAX_JSON_BYTES = 1_000_000;

export async function parseJson<TSchema extends z.ZodType>(request: Request, schema: TSchema, maxBytes = DEFAULT_MAX_JSON_BYTES): Promise<z.output<TSchema>> {
  const contentLength = request.headers.get("content-length");
  if (contentLength && Number(contentLength) > maxBytes) throw new AppError("PAYLOAD_TOO_LARGE", 413, "Request body is too large");
  const raw = await request.text();
  if (new TextEncoder().encode(raw).byteLength > maxBytes) throw new AppError("PAYLOAD_TOO_LARGE", 413, "Request body is too large");
  let value: unknown;
  try { value = JSON.parse(raw); } catch { throw new AppError("BAD_REQUEST", 400, "Malformed JSON body"); }
  return schema.parse(value);
}
