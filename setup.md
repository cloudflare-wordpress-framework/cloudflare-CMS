# Hướng dẫn Setup và Deploy Cloudflare CMS

Dự án này là cổng thông tin nội dung y khoa dựa trên **Astro (SSR)**, **Cloudflare Pages/D1**, và **Firebase Auth**.
Tài liệu này hướng dẫn chi tiết từng bước để cấu hình, chạy local, và triển khai lên Cloudflare.

---

## 1. Yêu cầu hệ thống

- **Node.js**: Phiên bản `22.x` trở lên.
- **npm** (đã đi kèm với Node.js).
- Tài khoản **Cloudflare**.
- Tài khoản **Firebase** (để dùng Authentication).
- CLI **Wrangler**: `npm install -g wrangler` (tuỳ chọn, nhưng khuyến khích).

---

## 2. Các bước cấu hình ban đầu (1-click)

Chúng tôi đã thiết lập sẵn các script trong `package.json` để bạn có thể setup dự án chỉ bằng 1 lệnh.

### Chạy Local

Mở terminal tại thư mục gốc dự án, chạy:
```bash
npm run setup:local
```
Lệnh này sẽ thực hiện 2 việc:
1. `npm install` - Cài đặt các thư viện cần thiết.
2. `wrangler d1 execute cms-db --local --file=./schema.sql` - Khởi tạo bảng dữ liệu D1 ở môi trường local của Wrangler (nằm trong thư mục `.wrangler`).

Sau đó, bạn chỉ cần chạy:
```bash
npm run dev
```
Dự án sẽ khởi động ở `http://localhost:4321`.

---

## 3. Cấu hình biến môi trường và Firebase

### Lấy thông tin Firebase
1. Truy cập [Firebase Console](https://console.firebase.google.com/).
2. Tạo dự án mới, bật tính năng **Authentication** (hỗ trợ Email/Password, Google, GitHub tuỳ nhu cầu).
3. Đăng ký Web App và lấy thông tin cấu hình (`apiKey`, `authDomain`, `projectId`, v.v.).

### Thiết lập `.dev.vars` (cho môi trường Local)
Tạo file `.dev.vars` ở thư mục gốc (không commit file này) với nội dung:
```env
FIREBASE_API_KEY=your_api_key
FIREBASE_AUTH_DOMAIN=your_auth_domain
FIREBASE_PROJECT_ID=your_project_id
```

---

## 4. Thiết lập Cloudflare D1 (Production)

Bạn cần tạo một Database D1 thật trên Cloudflare:

1. Chạy lệnh:
   ```bash
   npm run db:create
   ```
   Lệnh này thực thi `wrangler d1 create cms-db`. Kết quả trả về sẽ cho bạn 3 thông số: `database_name`, `database_id` và thông tin bind.

2. Mở file `wrangler.jsonc` ở thư mục gốc. Block `d1_databases` đã có sẵn. Bạn chỉ việc thay thế giá trị của trường `database_id` bằng id thật bạn vừa nhận được ở bước 1:
   ```json
   {
     "d1_databases": [
       {
         "binding": "DB",
         "database_name": "cms-db",
         "database_id": "your-database-id-from-step-1"
       }
     ]
   }
   ```

3. Áp dụng schema vào database Cloudflare:
   ```bash
   npm run db:init:remote
   ```
   Lệnh này thực thi: `wrangler d1 execute cms-db --remote --file=./schema.sql` để tạo bảng trên Cloudflare.

---

## 5. Deploy lên Cloudflare Pages

### Cách 1: Sử dụng 1-click script (từ local)
Wrangler sẽ tự build thư mục `dist` và đẩy lên Cloudflare Pages.
```bash
npm run deploy
```
*Lưu ý: Bạn cần đăng nhập Wrangler trước bằng `npx wrangler login`.*

### Cách 2: Deploy qua GitHub Integration (Khuyên dùng)
1. Push mã nguồn này lên một repository trên GitHub.
2. Đăng nhập [Cloudflare Dashboard](https://dash.cloudflare.com) > **Pages** > **Create a project** > **Connect to Git**.
3. Chọn repo của bạn.
4. Ở phần **Build settings**:
   - Framework preset: **Astro**
   - Build command: `npm run build`
   - Build output directory: `dist`
5. Ở phần **Environment variables**, thêm các biến Firebase (`FIREBASE_API_KEY`, v.v.) như đã cấu hình trong `.dev.vars`.
6. Ở phần **Functions** > **D1 database bindings**, trỏ biến `DB` vào database `cms-db` bạn vừa tạo.
7. Bấm **Save and Deploy**. Cloudflare sẽ tự động build mỗi khi bạn push code lên nhánh `main`.

---

## 6. Tổng kết Scripts hỗ trợ

- `npm run dev`: Chạy server dev (Astro SSR).
- `npm run build`: Build mã nguồn ra HTML/CSS/JS (chuẩn bị cho deploy).
- `npm run db:create`: Tạo D1 Database mới trên account Cloudflare.
- `npm run db:init:local`: Tạo các table local.
- `npm run db:init:remote`: Tạo các table trên D1 production.
- `npm run setup:local`: Cài đặt thư viện và thiết lập Database local.
- `npm run deploy`: Build và deploy thẳng lên Cloudflare Pages bằng Wrangler.
