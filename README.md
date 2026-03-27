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

## 5) Deploy bằng Railway hoặc Fly.io

Repo đã được chuẩn bị sẵn theo hướng Docker:

- `Dockerfile`: build Next.js ở chế độ `standalone`
- `.dockerignore`: giảm kích thước build context
- `fly.toml`: cấu hình mẫu cho Fly.io (region Singapore)
- `GET /api/health`: endpoint healthcheck

### A) Biến môi trường production

Thiết lập các biến này trên Railway hoặc Fly.io:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `ADMIN_EMAIL`
- `AUTHZ_COOKIE_SECRET`
- `NEXT_PUBLIC_SITE_URL`

Nếu dùng Cloudflare R2 thì thêm:

- `R2_ACCOUNT_ID`
- `R2_ACCESS_KEY_ID`
- `R2_SECRET_ACCESS_KEY`
- `R2_BUCKET`
- `R2_PUBLIC_BASE_URL`

Gợi ý:

- `AUTHZ_COOKIE_SECRET` nên là một chuỗi ngẫu nhiên dài ít nhất 32 ký tự.
- `NEXT_PUBLIC_SITE_URL` phải là domain production thật của bạn, ví dụ `https://lms01.up.railway.app` hoặc domain Fly.

### B) Deploy lên Railway

1. Tạo project mới trên Railway.
2. Chọn **Deploy from GitHub repo** và kết nối repo này.
3. Railway sẽ tự nhận `Dockerfile` ở root và build image từ đó.
4. Vào tab Variables và nhập toàn bộ env ở trên.
   Quan trọng: với app Next.js dùng Docker, hãy đảm bảo `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `NEXT_PUBLIC_SITE_URL` có mặt ngay từ lần deploy đầu tiên.
5. Vào Settings:
   - Region: chọn Singapore
   - Healthcheck path: `/api/health`
6. Redeploy sau khi set env xong.
7. Lấy domain Railway, rồi cập nhật:
   - `NEXT_PUBLIC_SITE_URL`
   - Supabase Auth redirect URL: `https://your-domain/auth/callback`

CLI chính thức của Railway để deploy thủ công là `railway up`, và Railway sẽ dùng `Dockerfile` ở thư mục gốc nếu có. Nguồn:

- https://docs.railway.com/cli/deploying
- https://docs.railway.com/deploy/dockerfiles

### C) Deploy lên Fly.io

1. Cài Fly CLI:

```bash
brew install flyctl
```

2. Đăng nhập:

```bash
fly auth login
```

3. Nếu muốn đổi tên app, sửa trường `app` trong `fly.toml`.

4. Tạo app và volume/network cần thiết:

```bash
fly launch --no-deploy
```

5. Set secrets:

```bash
fly secrets set NEXT_PUBLIC_SUPABASE_URL=... NEXT_PUBLIC_SUPABASE_ANON_KEY=... SUPABASE_SERVICE_ROLE_KEY=... ADMIN_EMAIL=... AUTHZ_COOKIE_SECRET=... NEXT_PUBLIC_SITE_URL=https://your-app.fly.dev
```

Nếu có R2:

```bash
fly secrets set R2_ACCOUNT_ID=... R2_ACCESS_KEY_ID=... R2_SECRET_ACCESS_KEY=... R2_BUCKET=... R2_PUBLIC_BASE_URL=...
```

6. Deploy:

```bash
fly deploy
```

Nếu bạn muốn ép các `NEXT_PUBLIC_*` có mặt ngay từ lúc image build, có thể thêm build args trong `fly.toml`. Với repo hiện tại, app đã được chỉnh để không fail build sớm chỉ vì thiếu env, nhưng runtime vẫn cần đủ env để hoạt động đúng.

7. Trong Supabase Auth, thêm redirect URL:

- `https://your-app.fly.dev/auth/callback`

Fly có thể chạy app Next.js qua Docker image và dùng `fly.toml` để cấu hình port, machine size và healthcheck. Nguồn:

- https://fly.io/docs/js/frameworks/nextjs/
- https://fly.io/docs/reference/health-checks/

## 6) Deploy bằng Cloudflare Workers + OpenNext

Repo đã được chuẩn bị sẵn cho Cloudflare Workers:

- `wrangler.jsonc`
- `open-next.config.ts`
- `.dev.vars.example`
- npm scripts:
  - `npm run cf:build`
  - `npm run cf:preview`
  - `npm run cf:deploy`

### A) Cài công cụ và đăng nhập

```bash
npm install
npx wrangler login
```

### B) Chuẩn bị env local cho Workers

```bash
cp .dev.vars.example .dev.vars
```

Điền các biến:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `ADMIN_EMAIL`
- `AUTHZ_COOKIE_SECRET`
- `NEXT_PUBLIC_SITE_URL`
- nếu dùng R2 thì thêm toàn bộ `R2_*`

### C) Tạo R2 bucket cho incremental cache

Tên mặc định trong `wrangler.jsonc` là:

```txt
lms01-opennext-cache
```

Tạo bucket:

```bash
npx wrangler r2 bucket create lms01-opennext-cache
```

### D) Chạy preview local giống môi trường Cloudflare

```bash
npm run cf:preview
```

### E) Deploy production

Trước khi deploy, sửa trong `wrangler.jsonc` nếu cần:

- `name`
- `services[0].service`
- `r2_buckets[0].bucket_name`
- `vars.NEXT_PUBLIC_SITE_URL`

Sau đó deploy:

```bash
npm run cf:deploy
```

### F) Set secrets/vars trên Cloudflare

Các biến nhạy cảm nên set bằng Wrangler secrets:

```bash
npx wrangler secret put NEXT_PUBLIC_SUPABASE_URL
npx wrangler secret put NEXT_PUBLIC_SUPABASE_ANON_KEY
npx wrangler secret put SUPABASE_SERVICE_ROLE_KEY
npx wrangler secret put ADMIN_EMAIL
npx wrangler secret put AUTHZ_COOKIE_SECRET
npx wrangler secret put R2_ACCOUNT_ID
npx wrangler secret put R2_ACCESS_KEY_ID
npx wrangler secret put R2_SECRET_ACCESS_KEY
npx wrangler secret put R2_BUCKET
npx wrangler secret put R2_PUBLIC_BASE_URL
```

`NEXT_PUBLIC_SITE_URL` có thể để trong `wrangler.jsonc -> vars` nếu là giá trị public.

### G) Cập nhật Supabase OAuth

Khi đã có domain Workers/Custom Domain, cập nhật:

- Supabase `Site URL`: domain gốc, ví dụ `https://lms01.your-subdomain.workers.dev`
- Supabase `Redirect URLs`: `https://lms01.your-subdomain.workers.dev/auth/callback`

Nguồn chính thức:

- https://developers.cloudflare.com/workers/framework-guides/web-apps/nextjs/
- https://opennext.js.org/cloudflare/get-started
- https://developers.cloudflare.com/r2/pricing/

## 7) Lưu file bằng Cloudflare R2 (ảnh/audio/pdf)

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

## 8) Tạo admin

Mặc định user mới sẽ có `profiles.role = 'user'`.

Để set admin cho 1 user: cập nhật trực tiếp trong bảng `profiles` (Supabase Studio) → set `role = 'admin'`.
