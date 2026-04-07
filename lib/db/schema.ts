import { relations } from "drizzle-orm";
import {
  bigint,
  boolean,
  date,
  integer,
  pgEnum,
  pgTable,
  text,
  unique,
  uuid,
} from "drizzle-orm/pg-core";

export const userRoleEnum = pgEnum("user_role", ["admin", "editor", "viewer"]);

export const fileCategoryEnum = pgEnum("file_category", [
  "work_schedule",
  "document",
  "other",
  "news_banner",
]);

export const schedulePeriodKindEnum = pgEnum("schedule_period_kind", ["week", "month", "year"]);

/** Phản ánh vs kiến nghị */
export const citizenFeedbackKindEnum = pgEnum("citizen_feedback_kind", ["phan_anh", "kien_nghi"]);

/** Trạng thái xử lý */
export const citizenFeedbackStatusEnum = pgEnum("citizen_feedback_status", [
  "received",
  "processing",
  "answered",
  "closed",
]);

export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  fullName: text("full_name"),
  role: userRoleEnum("role").notNull().default("viewer"),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
});

/** Loại lịch (mở rộng sau: thêm dòng trong bảng này). */
export const workScheduleTypes = pgTable("work_schedule_types", {
  id: uuid("id").primaryKey().defaultRandom(),
  /** Mã cố định trong code / báo cáo, ví dụ: hdnd_ubnd_lam_viec */
  code: text("code").notNull().unique(),
  /** Nhãn hiển thị */
  label: text("label").notNull(),
  sortOrder: integer("sort_order").notNull().default(0),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
});

export const files = pgTable("files", {
  id: uuid("id").primaryKey().defaultRandom(),
  category: fileCategoryEnum("category").notNull(),
  /** Đường dẫn tính từ thư mục `public/uploads/` (vd. `lich-lam-viec/2026-W01-....pdf`) */
  relativePath: text("relative_path").notNull(),
  originalName: text("original_name").notNull(),
  mimeType: text("mime_type").notNull(),
  sizeBytes: bigint("size_bytes", { mode: "number" }).notNull(),
  uploadedById: uuid("uploaded_by_id").references(() => users.id),
  createdAt: text("created_at").notNull(),
});

/** Tài khoản đăng ký của người dân (đăng nhập bằng số điện thoại — `phone` là duy nhất, không dùng làm PK). */
export const citizenAccounts = pgTable("citizen_accounts", {
  id: uuid("id").primaryKey().defaultRandom(),
  phone: text("phone").notNull().unique(),
  email: text("email").unique(),
  passwordHash: text("password_hash").notNull(),
  fullName: text("full_name").notNull(),
  address: text("address").notNull(),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
});

export const citizenFeedback = pgTable("citizen_feedback", {
  id: uuid("id").primaryKey().defaultRandom(),
  kind: citizenFeedbackKindEnum("kind").notNull(),
  title: text("title").notNull(),
  content: text("content").notNull(),
  citizenAccountId: uuid("citizen_account_id")
    .notNull()
    .references(() => citizenAccounts.id),
  status: citizenFeedbackStatusEnum("status").notNull().default("received"),
  answeredByUserId: uuid("answered_by_user_id").references(() => users.id),
  /** Nội dung trả lời chính thức gửi người dân (hiển thị trên ứng dụng / cổng). */
  staffReply: text("staff_reply"),
  adminNote: text("admin_note"),
  /** Bật thì API/ứng dụng không nên hiển thị hồ sơ này cho người dân. */
  hiddenFromApp: boolean("hidden_from_app").notNull().default(false),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
});

export const staffMembers = pgTable("staff_members", {
  id: uuid("id").primaryKey().defaultRandom(),
  fullName: text("full_name").notNull(),
  dateOfBirth: date("date_of_birth", { mode: "string" }),
  jobTitle: text("job_title").notNull(),
  avatarRelativePath: text("avatar_relative_path"),
  contactEmail: text("contact_email"),
  sortOrder: integer("sort_order").notNull().default(0),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
});

export const staffMemberRatings = pgTable(
  "staff_member_ratings",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    citizenAccountId: uuid("citizen_account_id")
      .notNull()
      .references(() => citizenAccounts.id, { onDelete: "cascade" }),
    staffMemberId: uuid("staff_member_id")
      .notNull()
      .references(() => staffMembers.id, { onDelete: "cascade" }),
    stars: integer("stars").notNull(),
    detail: text("detail"),
    /** YYYY-MM */
    monthKey: text("month_key").notNull(),
    createdAt: text("created_at").notNull(),
  },
  (t) => [unique("staff_member_ratings_unique_per_month").on(t.citizenAccountId, t.staffMemberId, t.monthKey)],
);

/** Đường dây nóng — số điện thoại các dịch vụ công (hiển thị CMS & ứng dụng). */
export const publicServiceHotlines = pgTable("public_service_hotlines", {
  id: uuid("id").primaryKey().defaultRandom(),
  /** Tên dịch vụ / bộ phận (vd. Một cửa, Bộ phận tiếp dân). */
  serviceName: text("service_name").notNull(),
  phone: text("phone").notNull(),
  /** Ghi chú ngắn: giờ làm việc, phạm vi… */
  note: text("note"),
  sortOrder: integer("sort_order").notNull().default(0),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
});

/** Danh mục tin tức — tiêu đề hiển thị. */
export const newsArticleCategories = pgTable("news_article_categories", {
  id: uuid("id").primaryKey().defaultRandom(),
  title: text("title").notNull(),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
});

/** Tin tức / thông báo — nội dung soạn bằng Editor.js (JSON). */
export const newsArticles = pgTable("news_articles", {
  id: uuid("id").primaryKey().defaultRandom(),
  title: text("title").notNull(),
  categoryId: uuid("category_id")
    .notNull()
    .references(() => newsArticleCategories.id, { onDelete: "restrict" }),
  bannerFileId: uuid("banner_file_id")
    .notNull()
    .references(() => files.id),
  /** Chuỗi JSON OutputData của Editor.js */
  contentJson: text("content_json").notNull(),
  createdByUserId: uuid("created_by_user_id")
    .notNull()
    .references(() => users.id),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
  /** Bật thì hiển thị trên API / ứng dụng công khai. */
  isVisible: boolean("is_visible").notNull().default(true),
});

export const workSchedules = pgTable(
  "work_schedules",
  {
    id: uuid("id").primaryKey(),
    typeId: uuid("type_id")
      .notNull()
      .references(() => workScheduleTypes.id),
    periodKind: schedulePeriodKindEnum("period_kind").notNull().default("week"),
    /** Tuần: `YYYY-Www`, tháng: `YYYY-MM`, năm: `YYYY` */
    periodValue: text("period_value").notNull(),
    title: text("title").notNull(),
    fileName: text("file_name").notNull(),
    originalName: text("original_name").notNull(),
    fileId: uuid("file_id").references(() => files.id),
    createdAt: text("created_at").notNull(),
    updatedAt: text("updated_at").notNull(),
  },
  (t) => [
    unique("work_schedules_type_id_period_kind_period_value_unique").on(
      t.typeId,
      t.periodKind,
      t.periodValue,
    ),
  ],
);

export const usersRelations = relations(users, ({ many }) => ({
  uploadedFiles: many(files),
  answeredCitizenFeedback: many(citizenFeedback),
  newsArticlesAuthored: many(newsArticles),
}));

export const workScheduleTypesRelations = relations(workScheduleTypes, ({ many }) => ({
  schedules: many(workSchedules),
}));

export const filesRelations = relations(files, ({ one, many }) => ({
  uploadedBy: one(users, {
    fields: [files.uploadedById],
    references: [users.id],
  }),
  newsBanners: many(newsArticles),
}));

export const workSchedulesRelations = relations(workSchedules, ({ one }) => ({
  file: one(files, {
    fields: [workSchedules.fileId],
    references: [files.id],
  }),
  scheduleType: one(workScheduleTypes, {
    fields: [workSchedules.typeId],
    references: [workScheduleTypes.id],
  }),
}));

export const citizenAccountsRelations = relations(citizenAccounts, ({ many }) => ({
  feedbackEntries: many(citizenFeedback),
  staffRatings: many(staffMemberRatings),
}));

export const staffMembersRelations = relations(staffMembers, ({ many }) => ({
  ratings: many(staffMemberRatings),
}));

export const staffMemberRatingsRelations = relations(staffMemberRatings, ({ one }) => ({
  citizenAccount: one(citizenAccounts, {
    fields: [staffMemberRatings.citizenAccountId],
    references: [citizenAccounts.id],
  }),
  staffMember: one(staffMembers, {
    fields: [staffMemberRatings.staffMemberId],
    references: [staffMembers.id],
  }),
}));

export const citizenFeedbackRelations = relations(citizenFeedback, ({ one }) => ({
  citizenAccount: one(citizenAccounts, {
    fields: [citizenFeedback.citizenAccountId],
    references: [citizenAccounts.id],
  }),
  answeredByUser: one(users, {
    fields: [citizenFeedback.answeredByUserId],
    references: [users.id],
  }),
}));

export const newsArticleCategoriesRelations = relations(newsArticleCategories, ({ many }) => ({
  articles: many(newsArticles),
}));

export const newsArticlesRelations = relations(newsArticles, ({ one }) => ({
  category: one(newsArticleCategories, {
    fields: [newsArticles.categoryId],
    references: [newsArticleCategories.id],
  }),
  bannerFile: one(files, {
    fields: [newsArticles.bannerFileId],
    references: [files.id],
  }),
  createdBy: one(users, {
    fields: [newsArticles.createdByUserId],
    references: [users.id],
  }),
}));
