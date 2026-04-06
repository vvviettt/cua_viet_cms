import { config } from "dotenv";
import { count } from "drizzle-orm";
import { getDb } from "../lib/db/index";
import { staffMembers } from "../lib/db/schema";

config({ path: ".env.local" });
config({ path: ".env" });

type SeedRow = {
  fullName: string;
  dateOfBirth: string | null;
  jobTitle: string;
  avatarRelativePath: string | null;
  contactEmail: string | null;
  sortOrder: number;
};

const SAMPLE: SeedRow[] = [
  {
    fullName: "Nguyễn Văn An",
    dateOfBirth: "1982-03-15",
    jobTitle: "Chủ tịch UBND",
    avatarRelativePath: null,
    contactEmail: "nvan.an@example.gov.vn",
    sortOrder: 10,
  },
  {
    fullName: "Trần Thị Bích",
    dateOfBirth: "1988-07-22",
    jobTitle: "Phó Chủ tịch UBND",
    avatarRelativePath: null,
    contactEmail: "ttbich@example.gov.vn",
    sortOrder: 20,
  },
  {
    fullName: "Lê Hoàng Cường",
    dateOfBirth: "1990-11-08",
    jobTitle: "Trưởng phòng Nội vụ",
    avatarRelativePath: null,
    contactEmail: "lhcuong@example.gov.vn",
    sortOrder: 30,
  },
  {
    fullName: "Phạm Thu Dung",
    dateOfBirth: "1992-01-30",
    jobTitle: "Phó Trưởng phòng Tài chính",
    avatarRelativePath: null,
    contactEmail: "ptdung@example.gov.vn",
    sortOrder: 40,
  },
  {
    fullName: "Hoàng Minh Đức",
    dateOfBirth: "1985-09-12",
    jobTitle: "Chuyên viên Phòng VH-XH",
    avatarRelativePath: null,
    contactEmail: null,
    sortOrder: 50,
  },
  {
    fullName: "Đặng Lan Anh",
    dateOfBirth: "1994-05-25",
    jobTitle: "Công chức Tư pháp — Hộ tịch",
    avatarRelativePath: null,
    contactEmail: "dlanh@example.gov.vn",
    sortOrder: 60,
  },
  {
    fullName: "Võ Quốc Huy",
    dateOfBirth: "1987-12-03",
    jobTitle: "Nhân viên Văn thư — Lưu trữ",
    avatarRelativePath: null,
    contactEmail: null,
    sortOrder: 70,
  },
  {
    fullName: "Bùi Thị Hương",
    dateOfBirth: "1991-04-18",
    jobTitle: "Kế toán viên",
    avatarRelativePath: null,
    contactEmail: "bthuong@example.gov.vn",
    sortOrder: 80,
  },
  {
    fullName: "Đỗ Văn Kiên",
    dateOfBirth: "1983-08-07",
    jobTitle: "Cán bộ Địa chính — Xây dựng",
    avatarRelativePath: null,
    contactEmail: null,
    sortOrder: 90,
  },
  {
    fullName: "Ngô Phương Linh",
    dateOfBirth: "1996-02-14",
    jobTitle: "Công chức Bộ phận Một cửa",
    avatarRelativePath: null,
    contactEmail: "nplinh@example.gov.vn",
    sortOrder: 100,
  },
  {
    fullName: "Mai Tuấn Long",
    dateOfBirth: "1989-10-01",
    jobTitle: "Phó Trưởng phòng TN-MT",
    avatarRelativePath: null,
    contactEmail: "mtlong@example.gov.vn",
    sortOrder: 110,
  },
  {
    fullName: "Lý Thị Mai",
    dateOfBirth: "1993-06-20",
    jobTitle: "Nhân viên Y tế cơ quan",
    avatarRelativePath: null,
    contactEmail: null,
    sortOrder: 120,
  },
  {
    fullName: "Chu Văn Nam",
    dateOfBirth: "1986-01-11",
    jobTitle: "Lái xe cơ quan",
    avatarRelativePath: null,
    contactEmail: null,
    sortOrder: 130,
  },
  {
    fullName: "Hồ Thị Oanh",
    dateOfBirth: "1995-09-29",
    jobTitle: "Cán bộ Phụ nữ — Gia đình",
    avatarRelativePath: null,
    contactEmail: "htoanh@example.gov.vn",
    sortOrder: 140,
  },
  {
    fullName: "Dương Đình Phát",
    dateOfBirth: "1984-04-05",
    jobTitle: "Trưởng phòng Kinh tế — Hạ tầng",
    avatarRelativePath: null,
    contactEmail: "ddphat@example.gov.vn",
    sortOrder: 150,
  },
  {
    fullName: "Tôn Nữ Quỳnh Trang",
    dateOfBirth: "1997-07-17",
    jobTitle: "Công chức Lao động — TB-XH",
    avatarRelativePath: null,
    contactEmail: null,
    sortOrder: 160,
  },
];

async function main() {
  const force = process.env.SEED_STAFF_FORCE === "1" || process.env.SEED_STAFF_FORCE === "true";
  const db = getDb();

  const [{ c: existing }] = await db.select({ c: count() }).from(staffMembers);
  const n = Number(existing ?? 0);
  if (n > 0 && !force) {
    console.log(`Bảng staff_members đã có ${n} bản ghi. Bỏ qua seed (đặt SEED_STAFF_FORCE=1 để chèn thêm).`);
    return;
  }

  const now = new Date().toISOString();
  await db.insert(staffMembers).values(
    SAMPLE.map((r) => ({
      fullName: r.fullName,
      dateOfBirth: r.dateOfBirth,
      jobTitle: r.jobTitle,
      avatarRelativePath: r.avatarRelativePath,
      contactEmail: r.contactEmail,
      sortOrder: r.sortOrder,
      isActive: true,
      createdAt: now,
      updatedAt: now,
    })),
  );

  console.log(`Đã chèn ${SAMPLE.length} cán bộ mẫu vào staff_members.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
