"use client";

/** Tối giản — không dùng hook/context để tránh lỗi prerender Next 16. */
export default function GlobalError() {
  return (
    <html lang="vi">
      <body className="flex min-h-dvh items-center justify-center bg-white p-6 font-sans text-zinc-900">
        <p className="text-center text-sm text-zinc-600">Đã xảy ra lỗi. Vui lòng tải lại trang.</p>
      </body>
    </html>
  );
}
