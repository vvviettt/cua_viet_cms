import { relations } from "drizzle-orm";
import { bigint, boolean, pgEnum, pgTable, text, uuid } from "drizzle-orm/pg-core";

export const userRoleEnum = pgEnum("user_role", ["admin", "editor", "viewer"]);

export const fileCategoryEnum = pgEnum("file_category", ["work_schedule", "document", "other"]);

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

export const workSchedules = pgTable("work_schedules", {
  id: uuid("id").primaryKey(),
  weekValue: text("week_value").notNull().unique(),
  title: text("title").notNull(),
  fileName: text("file_name").notNull(),
  originalName: text("original_name").notNull(),
  fileId: uuid("file_id").references(() => files.id),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
});

export const usersRelations = relations(users, ({ many }) => ({
  uploadedFiles: many(files),
}));

export const filesRelations = relations(files, ({ one }) => ({
  uploadedBy: one(users, {
    fields: [files.uploadedById],
    references: [users.id],
  }),
}));

export const workSchedulesRelations = relations(workSchedules, ({ one }) => ({
  file: one(files, {
    fields: [workSchedules.fileId],
    references: [files.id],
  }),
}));
