/**
 * Định dạng lưu trữ nội dung app mobile (CKEditor): `{ "html": "<p>…</p>" }`.
 * Dữ liệu cũ Editor.js: `{ "blocks": [ … ] }` vẫn đọc được khi mở form / hiển thị app.
 *
 * HTML lưu / API không dùng `class` — app Flutter style theo thẻ (`cms_rich_text_body.dart`).
 */

function escapeAttr(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;");
}

/** Có nội dung thực (sau khi bỏ thẻ HTML / &nbsp;) — dùng khi validate form. */
export function appMobileRichTextHasContent(parsed: Record<string, unknown>): boolean {
  const blocks = parsed.blocks;
  if (Array.isArray(blocks) && blocks.length > 0) return true;
  const html = parsed.html;
  if (typeof html !== "string") return false;
  const text = html
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
  return text.length > 0;
}

/** Có chữ sau khi bỏ thẻ HTML (dùng khi chọn nguồn html vs blocks). */
function htmlHasVisibleText(html: string): boolean {
  const text = html
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
  return text.length > 0;
}

/** Gỡ mọi `class="…"` — đồng bộ `stripCmsHtmlClassAttributes` (Flutter). */
export function stripAppMobileHtmlClassAttributes(html: string): string {
  return html.replace(/\s+class\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+)/gi, "");
}

/** Gỡ `width`/`height` pixel trên `<img>` — đồng bộ Flutter (responsive). */
export function stripAppMobileHtmlImgWidthHeightAttributes(html: string): string {
  return html.replace(/<img\b([^>]*?)>/gi, (_full, attrs: string) => {
    let a = attrs as string;
    a = a.replace(/(?:^|\s)width\s*=\s*("\d+"|'\d+')/gi, "");
    a = a.replace(/(?:^|\s)height\s*=\s*("\d+"|'\d+')/gi, "");
    return `<img${a}>`;
  });
}

/** Chuẩn hoá HTML trước lưu DB / trả API / mở lại CKEditor. */
export function sanitizeAppMobileRichHtmlForFlutter(html: string): string {
  return stripAppMobileHtmlClassAttributes(stripAppMobileHtmlImgWidthHeightAttributes(html));
}

/** Chuyển JSON đã lưu (html hoặc blocks legacy) sang HTML cho CKEditor. */
export function richTextJsonToInitialHtml(raw: string | null): string {
  if (!raw) return "";
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw) as unknown;
  } catch {
    return "";
  }
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return "";
  const o = parsed as Record<string, unknown>;
  const htmlStr = typeof o.html === "string" ? o.html : "";
  if (htmlHasVisibleText(htmlStr)) return sanitizeAppMobileRichHtmlForFlutter(htmlStr);
  return sanitizeAppMobileRichHtmlForFlutter(editorJsBlocksToHtml(o));
}

/**
 * Chuẩn hoá nội dung bài viết app mobile khi lưu / trả API: chỉ `{ "html": "..." }`.
 * Legacy `{ "blocks": [...] }` được chuyển một lần sang HTML.
 */
export function normalizeAppMobileArticleBodyStorage(raw: string): string | null {
  const t = raw.trim();
  if (!t) return null;
  let parsed: unknown;
  try {
    parsed = JSON.parse(t) as unknown;
  } catch {
    return null;
  }
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return null;
  const o = parsed as Record<string, unknown>;
  if (!appMobileRichTextHasContent(o)) return null;

  const htmlStr = typeof o.html === "string" ? o.html : "";
  let html = "";
  if (htmlHasVisibleText(htmlStr)) {
    html = htmlStr;
  } else {
    html = editorJsBlocksToHtml(o);
  }
  if (!htmlHasVisibleText(html)) return null;
  return JSON.stringify({ html: sanitizeAppMobileRichHtmlForFlutter(html) });
}

/** Payload công khai: luôn JSON một trường `html` (legacy / lỗi parse được gỡ bớt). */
export function normalizeAppMobileArticleBodyForPublic(raw: string | null): string {
  const r = (raw ?? "").trim();
  if (!r) return '{"html":""}';
  const normalized = normalizeAppMobileArticleBodyStorage(r);
  if (normalized) return normalized;
  try {
    JSON.parse(r);
  } catch {
    if (/<[a-z][\s\S]*>/i.test(r)) {
      return JSON.stringify({ html: sanitizeAppMobileRichHtmlForFlutter(r) });
    }
  }
  return '{"html":""}';
}

/** Editor.js OutputData (legacy) → HTML tối giản. */
export function editorJsBlocksToHtml(doc: Record<string, unknown>): string {
  const blocks = doc.blocks;
  if (!Array.isArray(blocks)) return "";

  const parts: string[] = [];
  for (const block of blocks) {
    if (!block || typeof block !== "object" || Array.isArray(block)) continue;
    const b = block as { type?: string; data?: Record<string, unknown> };
    const type = b.type ?? "";
    const data = b.data ?? {};

    switch (type) {
      case "paragraph":
        parts.push(String(data.text ?? ""));
        break;
      case "header": {
        const level = Math.min(6, Math.max(1, Number(data.level) || 2));
        const text = String(data.text ?? "");
        parts.push(`<h${level}>${text}</h${level}>`);
        break;
      }
      case "list": {
        const style = String(data.style ?? "unordered");
        const tag = style === "ordered" ? "ol" : "ul";
        const items = data.items;
        if (!Array.isArray(items)) break;
        const lis = items
          .map((item) => {
            let html: string;
            if (typeof item === "string") html = item;
            else if (item && typeof item === "object" && "content" in item) {
              html = String((item as { content?: unknown }).content ?? "");
            } else html = "";
            return `<li>${html}</li>`;
          })
          .join("");
        parts.push(`<${tag}>${lis}</${tag}>`);
        break;
      }
      case "quote": {
        const text = String(data.text ?? "");
        const cap = data.caption ? String(data.caption) : "";
        parts.push(
          `<blockquote>${text}${cap ? `<p><cite>${escapeAttr(cap)}</cite></p>` : ""}</blockquote>`,
        );
        break;
      }
      case "delimiter":
        parts.push("<hr />");
        break;
      case "image": {
        const file = data.file as Record<string, unknown> | undefined;
        const url = String(file?.url ?? data.url ?? "");
        const caption = data.caption ? String(data.caption) : "";
        if (!url) break;
        parts.push(
          `<figure><img src="${escapeAttr(url)}" alt="" />${
            caption ? `<figcaption>${caption}</figcaption>` : ""
          }</figure>`,
        );
        break;
      }
      case "embed": {
        const source = String(data.source ?? data.embed ?? "");
        if (source)
          parts.push(`<p><a href="${escapeAttr(source)}">${escapeAttr(source)}</a></p>`);
        break;
      }
      case "raw":
        parts.push(String(data.html ?? ""));
        break;
      default:
        break;
    }
  }
  return parts.join("\n");
}
