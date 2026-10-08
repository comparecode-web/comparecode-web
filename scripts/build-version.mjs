export function getDeploymentVersion(environment = process.env, now = new Date()) {
  if (environment.VERCEL !== "1" || !["production", "preview"].includes(environment.VERCEL_ENV)) {
    return "";
  }

  const [date, time] = now.toISOString().split("T");
  return `${date.replaceAll("-", "")}.${time.slice(0, 5).replace(":", "")}`;
}
