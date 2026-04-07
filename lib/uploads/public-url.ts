/** Đường dẫn URL công khai cho file trong `public/uploads/`. */
export function uploadsPublicHref(relativePath: string): string {
  const segments = relativePath.split("/").map((s) => encodeURIComponent(s));
  return `/uploads/${segments.join("/")}`;
}
