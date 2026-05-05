import { redirect } from "next/navigation";

/** Chi tiết user mở trong dialog trên /phan-quyen. */
export default function PhanQuyenUserLegacyRedirectPage() {
  redirect("/phan-quyen");
}
