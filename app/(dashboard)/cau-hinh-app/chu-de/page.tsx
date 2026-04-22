import { redirect } from "next/navigation";

import { appMobileCauHinhPaths } from "@/lib/app-mobile-cau-hinh-paths";

export default function CauHinhAppChuDeRedirect() {
  redirect(appMobileCauHinhPaths.trangChu);
}
