import { describe, expect, it } from "vitest";
import { getDeploymentVersion } from "../build-version.mjs";

describe("deployment version", () => {
  it.each(["production", "preview"])("stamps %s builds in UTC without suffixes", (environment) => {
    expect(getDeploymentVersion(
      { VERCEL: "1", VERCEL_ENV: environment },
      new Date("2026-10-08T17:10:59+02:00")
    )).toBe("20261008.1510");
  });

  it("uses the UTC date across local midnight and pads hours and minutes", () => {
    const environment = { VERCEL: "1", VERCEL_ENV: "production" };
    expect(getDeploymentVersion(environment, new Date("2026-01-01T00:05:00+01:00"))).toBe("20251231.2305");
    expect(getDeploymentVersion(environment, new Date("2026-01-02T03:04:00Z"))).toBe("20260102.0304");
  });

  it("distinguishes repeated local times during the autumn clock change", () => {
    const environment = { VERCEL: "1", VERCEL_ENV: "production" };
    expect(getDeploymentVersion(environment, new Date("2026-10-25T02:30:00+02:00"))).toBe("20261025.0030");
    expect(getDeploymentVersion(environment, new Date("2026-10-25T02:30:00+01:00"))).toBe("20261025.0130");
  });

  it.each([
    {},
    { CI: "true", NODE_ENV: "production" },
    { VERCEL_ENV: "production" },
    { VERCEL: "1" },
    { VERCEL: "1", VERCEL_ENV: "development" },
    { NEXT_PUBLIC_APP_VERSION: "20261008.1510" }
  ])("does not assign a release version outside a Vercel deployment: %j", (environment) => {
    expect(getDeploymentVersion(environment, new Date("2026-10-08T15:10:00Z"))).toBe("");
  });
});
