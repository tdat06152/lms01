# LMS TOEIC (MVP) + Supabase

## 1) Tạo Supabase project

1. Tạo project mới trong Supabase.
2. Vào **SQL Editor** → chạy file migration: `supabase/migrations/0001_init.sql`.

## 2) Bật đăng nhập Google

Trong Supabase:

1. **Authentication → Providers → Google** → bật.
2. Tạo OAuth Client trong Google Cloud Console, copy **Client ID** + **Client Secret** vào Supabase.
3. Thêm Redirect URLs (mục Authorized redirect URIs) theo Supabase hướng dẫn. Với local dev, bạn sẽ dùng callback:
   - `http://localhost:3000/auth/callback`

## 3) Cấu hình env

Copy `.env.example` → `.env.local` và điền:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- (tuỳ chọn) Cloudflare R2 để lưu file: `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET`, `R2_PUBLIC_BASE_URL`

## 4) Chạy local

```bash
npm install
npm run dev
```

## 6) Lưu file bằng Cloudflare R2 (ảnh/audio/pdf)

Supabase free tier thường đầy vì **file**, không phải vì data trong Postgres. Cách làm: lưu file ở R2 và chỉ lưu metadata trong Supabase.

### A) Tạo bucket + key

1. Cloudflare Dashboard → **R2** → Create bucket (vd: `lms-files`)
2. R2 → **Manage R2 API Tokens** → Create token (Read/Write) → lấy:
   - `Account ID`
   - `Access Key ID`
   - `Secret Access Key`
3. (Khuyến nghị cho ảnh) cấu hình public access bằng **r2.dev** hoặc custom domain và set `R2_PUBLIC_BASE_URL`

### B) Cấu hình env

Điền thêm vào `.env.local`:

- `R2_ACCOUNT_ID`
- `R2_ACCESS_KEY_ID`
- `R2_SECRET_ACCESS_KEY`
- `R2_BUCKET`
- `R2_PUBLIC_BASE_URL` (nếu bạn bật public access)

### C) API presign URL (đã có sẵn trong repo)

- `POST /api/uploads/r2` (cần user đã đăng nhập Supabase) trả về `uploadUrl` để client `PUT` trực tiếp lên R2.
- Nếu bucket private, có thể dùng `GET /api/uploads/r2/sign?key=...` để lấy signed URL đọc file (1 phút).

## 5) Tạo admin

Mặc định user mới sẽ có `profiles.role = 'user'`.

Để set admin cho 1 user: cập nhật trực tiếp trong bảng `profiles` (Supabase Studio) → set `role = 'admin'`.
