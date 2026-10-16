export function isStaticBuild(): boolean {
  return import.meta.env.MODE === "static"
}
