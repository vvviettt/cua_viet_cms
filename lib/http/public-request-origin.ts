/**
 * Origin công khai cho link tuyệt đối (ảnh upload, …) trong JSON API.
 * Khi có Nginx/proxy, `request.url` có thể là `http://127.0.0.1:...` — client không truy cập được;
 * dùng `X-Forwarded-Host` / `X-Forwarded-Proto` nếu có.
 */
export function getPublicRequestOrigin(request: Request): string {
  const url = new URL(request.url);
  const host = request.headers.get("x-forwarded-host")?.split(",")[0]?.trim();
  if (!host) return url.origin.replace(/\/$/, "");

  const protoRaw = request.headers.get("x-forwarded-proto")?.split(",")[0]?.trim();
  const proto =
    protoRaw && protoRaw.length > 0 ? protoRaw : url.protocol.replace(":", "") || "https";

  return `${proto}://${host}`;
}
