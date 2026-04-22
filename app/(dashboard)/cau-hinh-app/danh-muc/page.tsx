import { redirect } from "next/navigation";

import { appMobileCauHinhPaths } from "@/lib/app-mobile-cau-hinh-paths";

export default function CauHinhAppDanhMucRedirect() {
  redirect(appMobileCauHinhPaths.trangChu);
}
