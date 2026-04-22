/** Đường dẫn CMS cấu hình app di động — khớp 4 tab dưới cùng trên app. */
export const appMobileCauHinhPaths = {
  hub: "/cau-hinh-app",
  trangChu: "/cau-hinh-app/trang-chu",
  troLyAo: "/cau-hinh-app/tro-ly-ao",
  thongBao: "/cau-hinh-app/thong-bao",
  caiDat: "/cau-hinh-app/cai-dat",
  /** Trang con: thêm banner (quay lại [trangChu]). */
  bannerThem: "/cau-hinh-app/banner/them",
} as const;

export type AppMobileShellTabKey = "home" | "assistant" | "notifications" | "profile";
