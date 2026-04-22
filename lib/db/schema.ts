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
  "app_home_banner",
  "app_home_icon",
]);

export const schedulePeriodKindEnum = pgEnum("schedule_period_kind", ["week", "month", "year"]);

/** Mục menu trang chủ ứng dụng — native (route cố định trong code) hoặc webview (URL). */
export const appHomeItemKindEnum = pgEnum("app_home_item_kind", ["native", "webview"]);

/** Vị trí hiển thị ảnh dạng carousel trên trang chủ app. */
export const appHomeBannerPlacementEnum = pgEnum("app_home_banner_placement", [
  "top",
  "after_section_2",
]);

export const appHomeBannerCtaKeyEnum = pgEnum("app_home_banner_cta_key", [
  "apply_online",
  "lookup_result",
]);

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
  isActive: boolean("is_active").notNull().default(true),
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
/** Màu seed + tiêu đề hero trang chủ app (một bản ghi — seed mặc định). */
export const appMobileTheme = pgTable("app_mobile_theme", {
  id: uuid("id").primaryKey().defaultRandom(),
  primarySeedHex: text("primary_seed_hex").notNull().default("#0D47A1"),
  homeHeroTitle: text("home_hero_title")
    .notNull()
    .default("Chuyên trang chuyển đổi số\nXã Cửa Việt"),
  updatedAt: text("updated_at").notNull(),
});

/** Nhóm mục trên trang chủ app. */
export const appMobileHomeSections = pgTable("app_mobile_home_sections", {
  id: uuid("id").primaryKey().defaultRandom(),
  title: text("title").notNull(),
  /** Icon nhóm (tuỳ chọn) — lưu qua bảng files. */
  iconFileId: uuid("icon_file_id").references(() => files.id, { onDelete: "set null" }),
  sortOrder: integer("sort_order").notNull().default(0),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
});

/** Từng ô dịch vụ / liên kết trên trang chủ app. */
export const appMobileHomeItems = pgTable("app_mobile_home_items", {
  id: uuid("id").primaryKey().defaultRandom(),
  sectionId: uuid("section_id")
    .notNull()
    .references(() => appMobileHomeSections.id, { onDelete: "cascade" }),
  kind: appHomeItemKindEnum("kind").notNull(),
  /** Khi kind=native: mã route trong app (vd. citizen_reception_schedule). */
  routeId: text("route_id"),
  /** Khi kind=webview: URL đầy đủ. */
  webUrl: text("web_url"),
  label: text("label").notNull(),
  iconKey: text("icon_key").notNull().default("help_outline"),
  iconFileId: uuid("icon_file_id").references(() => files.id, { onDelete: "set null" }),
  accentHex: text("accent_hex").notNull().default("#1565C0"),
  /** Đánh dấu làm danh sách “Tiện ích yêu thích” mặc định (fallback khi máy chưa custom). */
  isDefaultFavorite: boolean("is_default_favorite").notNull().default(false),
  sortOrder: integer("sort_order").notNull().default(0),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
});

/** Banner carousel trang chủ app — ảnh lưu qua bảng files. */
export const appMobileBanners = pgTable("app_mobile_banners", {
  id: uuid("id").primaryKey().defaultRandom(),
  fileId: uuid("file_id")
    .notNull()
    .references(() => files.id, { onDelete: "restrict" }),
  placement: appHomeBannerPlacementEnum("placement").notNull().default("top"),
  /** URL khi click banner (mở webview) */
  redirectUrl: text("redirect_url"),
  /** Route trong app khi click banner */
  routePath: text("route_path"),
  sortOrder: integer("sort_order").notNull().default(0),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
});

/** Tab thanh điều hướng dưới app (Trang chủ, Trợ lý ảo, …) — admin bật/tắt và sắp xếp. */
export const appMobileShellTabs = pgTable("app_mobile_shell_tabs", {
  id: uuid("id").primaryKey().defaultRandom(),
  /** Khớp app Flutter: home | assistant | notifications | profile */
  tabKey: text("tab_key").notNull().unique(),
  label: text("label").notNull(),
  sortOrder: integer("sort_order").notNull().default(0),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
});

/** Nội dung banner đầu trang (2 dòng text + 2 CTA) — một bản ghi. */
export const appMobileHomeBanner = pgTable("app_mobile_home_banner", {
  id: uuid("id").primaryKey().defaultRandom(),
  title: text("title").notNull().default("CỬA VIỆT SỐ"),
  subtitle: text("subtitle").notNull().default("CHUYỂN ĐỔI SỐ XÃ CỬA VIỆT"),
  applyLabel: text("apply_label").notNull().default("Nộp hồ sơ trực tuyến"),
  lookupLabel: text("lookup_label").notNull().default("Tra cứu kết quả"),
  updatedAt: text("updated_at").notNull(),
});

/** Nhóm danh mục riêng cho 2 nút CTA trên banner đầu trang. */
export const appMobileHomeBannerSections = pgTable("app_mobile_home_banner_sections", {
  id: uuid("id").primaryKey().defaultRandom(),
  ctaKey: appHomeBannerCtaKeyEnum("cta_key").notNull(),
  title: text("title").notNull(),
  iconFileId: uuid("icon_file_id").references(() => files.id, { onDelete: "set null" }),
  kind: appHomeItemKindEnum("kind").notNull().default("native"),
  /** Khi kind=native: route trong app. */
  routeId: text("route_id"),
  /** Khi kind=webview: URL đầy đủ. */
  webUrl: text("web_url"),
  sortOrder: integer("sort_order").notNull().default(0),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
});

/** Từng mục dịch vụ/liên kết nằm trong danh mục CTA trên banner. */
export const appMobileHomeBannerItems = pgTable("app_mobile_home_banner_items", {
  id: uuid("id").primaryKey().defaultRandom(),
  sectionId: uuid("section_id")
    .notNull()
    .references(() => appMobileHomeBannerSections.id, { onDelete: "cascade" }),
  kind: appHomeItemKindEnum("kind").notNull(),
  routeId: text("route_id"),
  webUrl: text("web_url"),
  label: text("label").notNull(),
  iconKey: text("icon_key").notNull().default("help_outline"),
  iconFileId: uuid("icon_file_id").references(() => files.id, { onDelete: "set null" }),
  accentHex: text("accent_hex").notNull().default("#1565C0"),
  sortOrder: integer("sort_order").notNull().default(0),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
});

/** Cài đặt ứng dụng (một bản ghi) — app dùng để quyết định hiển thị & nội dung. */
export const appMobileSettings = pgTable("app_mobile_settings", {
  id: uuid("id").primaryKey().defaultRandom(),
  /** Cho phép người dân đăng ký tài khoản mới. */
  allowCitizenRegister: boolean("allow_citizen_register").notNull().default(true),
  /** Hotline hỗ trợ (chỉ số, lưu dạng string). */
  supportHotline: text("support_hotline"),
  /** Chuỗi JSON OutputData của Editor.js */
  usageGuideJson: text("usage_guide_json").notNull().default('{"blocks":[]}'),
  /** Chuỗi JSON OutputData của Editor.js */
  termsJson: text("terms_json").notNull().default('{"blocks":[]}'),
  updatedAt: text("updated_at").notNull(),
});

/** FAQ cho app — câu hỏi/ trả lời và thứ tự hiển thị. */
export const appMobileFaqs = pgTable("app_mobile_faqs", {
  id: uuid("id").primaryKey().defaultRandom(),
  question: text("question").notNull(),
  answer: text("answer").notNull(),
  sortOrder: integer("sort_order").notNull().default(0),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
});

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
