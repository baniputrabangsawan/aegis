import { describe, expect, it } from "vitest";
import { assertTrustedOrigin } from "@/server/http/origin";

describe("trusted origin guard", () => {
  const trusted = ["http://localhost:3000", "https://dashboard.example.com"];
  it("accepts an exact trusted origin", () => expect(() => assertTrustedOrigin(new Request("http://localhost", { headers: { origin: trusted[0] } }), trusted)).not.toThrow());
  it("rejects missing and lookalike origins", () => {
    expect(() => assertTrustedOrigin(new Request("http://localhost"), trusted)).toThrow();
    expect(() => assertTrustedOrigin(new Request("http://localhost", { headers: { origin: "https://dashboard.example.com.evil.test" } }), trusted)).toThrow();
  });
});
