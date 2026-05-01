/**
 * Seed menu trang chủ + theme mặc định (khớp app Flutter trước khi có CMS).
 * Chạy: npx tsx scripts/seed-app-mobile-config.ts
 * Bỏ qua nếu đã có ít nhất một nhóm menu.
 */
import "dotenv/config";
import {
  ensureAppMobileThemeRow,
  insertAppMobileItem,
  insertAppMobileSection,
  listAppMobileSectionsForCms,
} from "../lib/db/app-mobile-config";
import { getDb } from "../lib/db";

const NATIONAL =
  "https://dichvucong.gov.vn/p/home/dvc-trang-chu.html?typeInapp=1";
const SO_TAY_DV =
  "https://sotaydangvien.dcs.vn/?typeInapp=1&zarsrc=1303&utm_source=zalo&utm_medium=zalo&utm_campaign=zalo";
const BAO_HIEM =
  "https://baohiemxahoi.gov.vn/tracuu/Pages/tra-cuu-ho-gia-dinh.aspx?typeInapp=1";
const CONG_DAN_SO =
  "https://www.congdanso.edu.vn/?typeInapp=1&zarsrc=1303&utm_source=zalo&utm_medium=zalo&utm_campaign=zalo";
const VNE =
  "https://vnetraffic.org/?typeInapp=1&zarsrc=1303&utm_source=zalo&utm_medium=zalo&utm_campaign=zalo";
const THUE =
  "https://etax.net.vn/Default.aspx?chanel=login&typeInapp=1&zarsrc=1303&utm_source=zalo&utm_medium=zalo&utm_campaign=zalo";
const HDND = "https://www.quangtri.gov.vn/thong-tin/xa-cua-viet";
const TAI_LIEU_DV =
  "https://drive.google.com/drive/mobile/folders/19TBJsG4RwzNztcMTHqxpwh9Zk3jCtqOY?typeInapp=1&zarsrc=1303&utm_source=zalo&utm_medium=zalo&utm_campaign=zalo";
const TNVN = "https://doanthanhnien.vn/";
const KHONG_GIAN_VH =
  "https://hochiminhcity.gov.vn/landing-khong-gian-van-hoa-ho-chi-minh";

async function main() {
  getDb();
  await ensureAppMobileThemeRow();

  const existing = await listAppMobileSectionsForCms();
  if (existing.length > 0) {
    console.log("Đã có nhóm menu app — bỏ qua seed.");
    process.exit(0);
  }

  const s0 = await insertAppMobileSection({
    title: "Tiếp cận thông tin",
    sortOrder: 0,
    isActive: true,
  });
  const s1 = await insertAppMobileSection({
    title: "Dịch vụ công",
    sortOrder: 10,
    isActive: true,
  });
  const s2 = await insertAppMobileSection({
    title: "Tiện ích hằng ngày",
    sortOrder: 20,
    isActive: true,
  });
  const s3 = await insertAppMobileSection({
    title: "Đoàn viên số",
    sortOrder: 30,
    isActive: true,
  });
  const s4 = await insertAppMobileSection({
    title: "Hội đồng nhân dân",
    sortOrder: 40,
    isActive: true,
  });

  let order = 0;
  const add = async (
    sectionId: string,
    kind: "native" | "webview",
    label: string,
    iconKey: string,
    accentHex: string,
    extra: { routeId?: string; webUrl?: string },
  ) => {
    await insertAppMobileItem({
      sectionId,
      kind,
      routeId: extra.routeId ?? null,
      webUrl: extra.webUrl ?? null,
      documentFileId: null,
      label,
      iconKey,
      iconFileId: null,
      accentHex,
      sortOrder: order++,
      isActive: true,
    });
  };

  order = 0;
  await add(s0, "native", "Lịch làm việc", "calendar_month", "#1565C0", {
    routeId: "citizen_reception_schedule",
  });
  await add(s0, "native", "Tin tức", "newspaper", "#00897B", { routeId: "news_list" });
  await add(s0, "native", "Phản ánh Kiến nghị", "rate_review", "#6A1B9A", {
    routeId: "feedback_hub",
  });
  await add(s0, "native", "Đường dây nóng", "phone_in_talk", "#0277BD", { routeId: "hotlines" });
  await add(s0, "webview", "Không gian văn hóa", "star_rounded", "#F9A825", {
    webUrl: KHONG_GIAN_VH,
  });
  await add(s0, "native", "Thi trực tuyến", "quiz_outlined", "#C62828", { routeId: "none" });

  order = 0;
  await add(s1, "webview", "Nộp hồ sơ", "file_upload_outlined", "#1565C0", { webUrl: NATIONAL });
  await add(s1, "native", "Đánh giá cán bộ", "groups_outlined", "#3949AB", { routeId: "staff_ratings" });
  await add(s1, "webview", "Tra cứu kết quả", "manage_search", "#2E7D32", { webUrl: NATIONAL });
  await add(s1, "native", "Hướng dẫn thực hiện các thủ tục DVC", "menu_book_outlined", "#F57F17", {
    routeId: "none",
  });

  order = 0;
  await add(s2, "webview", "Sổ tay Đảng viên", "book_outlined", "#C62828", { webUrl: SO_TAY_DV });
  await add(s2, "webview", "Bảo hiểm", "health_and_safety_outlined", "#2E7D32", { webUrl: BAO_HIEM });
  await add(s2, "webview", "Công dân số", "school_outlined", "#1565C0", { webUrl: CONG_DAN_SO });
  await add(s2, "webview", "VNe Traffic", "traffic_outlined", "#00838F", { webUrl: VNE });
  await add(s2, "webview", "Thuế", "receipt_long_outlined", "#5E35B1", { webUrl: THUE });

  order = 0;
  await add(s3, "webview", "Tài liệu", "folder_copy_outlined", "#6A1B9A", { webUrl: TAI_LIEU_DV });
  await add(s3, "webview", "Thanh niên Việt Nam", "public_outlined", "#1565C0", { webUrl: TNVN });

  order = 0;
  await add(s4, "webview", "Hội đồng nhân dân", "account_balance_outlined", "#1B5E20", {
    webUrl: HDND,
  });

  console.log("Đã seed cấu hình app mobile (menu + theme).");
  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
