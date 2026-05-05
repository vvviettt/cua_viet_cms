import { redirect } from "next/navigation";

/** Luồng tạo tài khoản chuyển sang dialog trên /phan-quyen. */
export default function PhanQuyenThemRedirectPage() {
  redirect("/phan-quyen");
}
