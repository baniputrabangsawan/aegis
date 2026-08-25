import { describe, expect, it } from "vitest";
import { z } from "zod";
import { parseJson } from "./validation";

const payloadSchema = z.object({ name: z.string().min(1) });

describe("JSON request validation", () => {
  it("parses a valid body", async () => {
    const request = new Request("http://localhost/api", { method: "POST", body: JSON.stringify({ name: "Aegis" }) });
    await expect(parseJson(request, payloadSchema)).resolves.toEqual({ name: "Aegis" });
  });

  it("rejects malformed JSON safely", async () => {
    const request = new Request("http://localhost/api", { method: "POST", body: "{" });
    await expect(parseJson(request, payloadSchema)).rejects.toMatchObject({ code: "BAD_REQUEST", status: 400 });
  });

  it("rejects bodies above the configured limit", async () => {
    const request = new Request("http://localhost/api", { method: "POST", body: JSON.stringify({ name: "too large" }) });
    await expect(parseJson(request, payloadSchema, 4)).rejects.toMatchObject({ code: "PAYLOAD_TOO_LARGE", status: 413 });
  });
});
