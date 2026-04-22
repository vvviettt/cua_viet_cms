-- Bản ghi 0023 trước đây là snapshot trùng toàn bộ schema (CREATE TYPE/tables đã có từ 0018–0022),
-- khiến `npm run db:migrate` lỗi "type ... already exists" trên mọi DB đã migrate incremental.
-- Giữ tag trong journal; nội dung thay bằng no-op.
SELECT 1;
