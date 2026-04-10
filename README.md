
Ứng dụng web quản trị (Next.js) và API phục vụ app mobile **Dịch vụ phường/xã**.

## Yêu cầu môi trường

- **Node.js** 20 trở lên (khuyến nghị LTS).
- **PostgreSQL** 16 (hoặc tương thích). Có thể chạy nhanh bằng Docker Compose trong repo.

## 1. Cài dependency

```bash
cd cms-cua-iet
npm install
```

(Nếu dùng `pnpm` / `yarn`, thay lệnh tương ứng.)

## 2. PostgreSQL (Docker)

```bash
docker compose up -d
```

Mặc định (có thể ghi đè qua biến môi trường khi chạy compose):

| Biến | Mặc định |
|------|----------|
| `POSTGRES_USER` | `cms` |
| `POSTGRES_PASSWORD` | `cms_secret` |
| `POSTGRES_DB` | `cms_cua_iet` |
| Cổng host | `5432` |

## 3. Biến môi trường

Tạo file **`.env.local`** (và/hoặc `.env`) ở thư mục gốc `cms-cua-iet`. Next.js tự load `.env.local` khi `npm run dev`.

**Bắt buộc**

```env
DATABASE_URL=postgresql://cms:cms_secret@localhost:5432/cms_cua_iet
```

Đổi user/mật khẩu/db/port cho khớp Postgres của bạn.

**Khuyến nghị khi dùng tài khoản công dân / JWT**

```env
CITIZEN_JWT_SECRET=chuỗi-bí-mật-dài-ngẫu-nhiên
```

**Tùy chọn**

- `COOKIE_SECURE` — `true` / `false` (cookie chỉ HTTPS).
- `CRON_SECRET` — bảo vệ endpoint cron (nếu gọi từ bên ngoài).
- Seed admin (script `db:seed`): `SEED_ADMIN_EMAIL`, `SEED_ADMIN_PASSWORD`, `SEED_ADMIN_NAME`.

Các script seed một số dùng `dotenv` với `.env.local` — nên giữ `DATABASE_URL` trong `.env.local` hoặc `.env`.

## 4. Migration cơ sở dữ liệu

```bash
npm run db:migrate
```

Áp dụng các file trong thư mục `drizzle/`. Chạy sau khi Postgres đã sẵn sàng và `DATABASE_URL` đúng.

## 5. Seed dữ liệu (tùy chọn)

```bash
npm run db:seed              # admin + loại lịch làm việc
npm run db:seed:staff        # nhân sự mẫu
npm run db:seed:feedback     # phản ánh mẫu
npm run db:seed:news-categories
npm run db:seed:app-mobile   # menu trang chủ app + theme mặc định
```

Một số script đọc `.env.local`; đảm bảo `DATABASE_URL` có trong đó trước khi chạy.

## 6. Chạy dev

```bash
npm run dev
```

Mặc định Next.js: [http://localhost:3000](http://localhost:3000).

## 7. Build & chạy production

```bash
npm run build
npm run start
```

## Lệnh database hữu ích

| Lệnh | Mô tả |
|------|--------|
| `npm run db:generate` | Sinh migration từ schema (Drizzle Kit). |
| `npm run db:push` | Đẩy schema thẳng lên DB (thích hợp prototype; production nên dùng migrate). |
| `npm run db:studio` | Giao diện Drizzle Studio. |

## API công khai cho app mobile

App Flutter gọi các route dạng `/api/public/...` và dùng origin CMS làm base URL (xem README trong project `dich_vu_phuong`). Đảm bảo máy ảo/thiết bị thật truy cập được host đó (ví dụ Android emulator: thay `localhost` bằng `10.0.2.2` hoặc IP LAN của máy dev).
