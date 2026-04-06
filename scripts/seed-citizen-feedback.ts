import { config } from "dotenv";
import { hashSync } from "bcryptjs";
import { eq, inArray } from "drizzle-orm";
import { getDb } from "../lib/db/index";
import { citizenAccounts, citizenFeedback, users } from "../lib/db/schema";

config({ path: ".env.local" });
config({ path: ".env" });

const SEED_PHONES = ["0901000001", "0901000002", "0901000003"] as const;

/** Tiêu đề bản ghi đầu tiên — dùng để seed idempotent (chạy lại không nhân đôi). */
const FIRST_SAMPLE_TITLE = "[Mẫu seed] Kiến nghị về cải thiện đường giao thông nội thị";

async function main() {
  const db = getDb();
  const now = new Date().toISOString();
  const dummyHash = hashSync("seed-not-for-login", 8);

  const [already] = await db
    .select({ id: citizenFeedback.id })
    .from(citizenFeedback)
    .where(eq(citizenFeedback.title, FIRST_SAMPLE_TITLE))
    .limit(1);
  if (already) {
    console.log("Đã có kiến nghị mẫu (tiêu đề sentinel), bỏ qua seed.");
    return;
  }

  for (const phone of SEED_PHONES) {
    await db
      .insert(citizenAccounts)
      .values({
        phone,
        email: `citizen_${phone}@example.local`,
        passwordHash: dummyHash,
        fullName:
          phone === "0901000001"
            ? "Nguyễn Văn An"
            : phone === "0901000002"
              ? "Trần Thị Bình"
              : "Lê Văn Cường",
        address: "Khu phố 1, phường Iệt (dữ liệu mẫu)",
        createdAt: now,
        updatedAt: now,
      })
      .onConflictDoNothing({ target: citizenAccounts.phone });
  }

  const accRows = await db
    .select({ id: citizenAccounts.id, phone: citizenAccounts.phone })
    .from(citizenAccounts)
    .where(inArray(citizenAccounts.phone, [...SEED_PHONES]));

  const byPhone = new Map(accRows.map((r) => [r.phone, r.id]));
  const id1 = byPhone.get("0901000001");
  const id2 = byPhone.get("0901000002");
  const id3 = byPhone.get("0901000003");
  if (!id1 || !id2 || !id3) {
    console.error("Không tìm đủ tài khoản người dân mẫu sau khi insert (kiểm tra migration & DB).");
    process.exit(1);
  }

  const [admin] = await db.select({ id: users.id }).from(users).where(eq(users.role, "admin")).limit(1);
  const answeredBy = admin?.id ?? null;

  await db.insert(citizenFeedback).values([
    {
      kind: "kien_nghi",
      title: FIRST_SAMPLE_TITLE,
      content:
        "Đề nghị UBND xem xét sửa chữa đoạn đường bị lún tại tổ dân phố, tránh ngập khi mưa lớn. Người dân đi lại khó khăn, đặc biệt người già và trẻ nhỏ.",
      citizenAccountId: id1,
      status: "received",
      answeredByUserId: null,
      adminNote: null,
      createdAt: now,
      updatedAt: now,
    },
    {
      kind: "phan_anh",
      title: "[Mẫu seed] Phản ánh tiếng ồn công trình",
      content:
        "Công trình xây dựng gần nhà thi công ngoài giờ quy định, ảnh hưởng sinh hoạt. Mong đơn vị kiểm tra và nhắc nhở chủ đầu tư.",
      citizenAccountId: id2,
      status: "processing",
      answeredByUserId: null,
      adminNote: "Đã chuyển Phòng TN-MT xác minh.",
      createdAt: now,
      updatedAt: now,
    },
    {
      kind: "kien_nghi",
      title: "[Mẫu seed] Đề xuất bổ sung thùng rác công cộng",
      content:
        "Khu vực chợ nhỏ thiếu điểm thu gom rác, người dân phải mang xa. Đề nghị bố trí thêm 2 thùng có nắp đậy.",
      citizenAccountId: id1,
      status: "answered",
      answeredByUserId: answeredBy,
      staffReply:
        "Kính gửi bà con, UBND phường đã ghi nhận kiến nghị về thùng rác công cộng. Đơn vị đang lập kế hoạch bố trí thêm điểm thu gom; dự kiến triển khai trong quý tới. Trân trọng.",
      adminNote: "Đã báo cáo UBND, dự kiến bố trí quý sau.",
      createdAt: now,
      updatedAt: now,
    },
    {
      kind: "phan_anh",
      title: "[Mẫu seed] Đèn chiếu sáng hỏng tại ngã ba",
      content:
        "Cột đèn tại ngã ba đường X không sáng nhiều tuần, tiềm ẩn mất an toàn giao thông buổi tối.",
      citizenAccountId: id3,
      status: "closed",
      answeredByUserId: answeredBy,
      adminNote: "Điện lực đã thay bóng — đóng hồ sơ.",
      createdAt: now,
      updatedAt: now,
    },
  ]);

  console.log("Đã thêm 4 bản ghi phản ánh / kiến nghị mẫu (3 tài khoản dân: 0901000001–0901000003).");
  if (!answeredBy) {
    console.log("Lưu ý: chưa có user admin — các bản «đã trả lời/đóng» chưa gắn answered_by_user_id.");
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
