import { redirect } from "next/navigation";

import { appMobileCauHinhPaths } from "@/lib/app-mobile-cau-hinh-paths";

export default function CauHinhAppThanhDieuHuongRedirect() {
  redirect(appMobileCauHinhPaths.hub);
}
