# Hướng dẫn Setup và Deploy Cloudflare CMS

Dự án này là cổng thông tin nội dung y khoa dựa trên **Astro (SSR)**, **Cloudflare Pages/D1**, và **Firebase Auth**.
Tài liệu này hướng dẫn chi tiết từng bước để cấu hình, chạy local, và triển khai lên Cloudflare.

---

## 1. Yêu cầu hệ thống

- **Node.js**: Phiên bản `22.x` trở lên.
- **npm** (đã đi kèm với Node.js).
- Tài khoản **Cloudflare**.
- Tài khoản **Firebase** (để dùng Authentication).
- CLI **Wrangler**: npm install -g wrangler (tuỳ chọn, nhưng khuyến khích).

---

## 2. Các bước cấu hình ban đầu (1-click)

Chúng tôi đã thiết lập sẵn các script trong `package.json` để bạn có thể setup dự án chỉ bằng 1 lệnh.

### Chạy Local

Mở terminal tại thư mục gốc dự án, sao chép `.env.example` thành `.env`, sau đó chạy lệnh cài đặt:

Lệnh này sẽ thực hiện các việc:
1. npm install - Cài đặt các thư viện cần thiết.
2. wrangler d1 execute cms-db --local --file=./schema.sql - Khởi tạo bảng dữ liệu CMS D1 ở môi trường local của Wrangler (nằm trong thư mục `.wrangler`).
3. node scripts/sync-db-schema.js & wrangler d1 execute cms-db --local --file=./user_schema.sql - Tự động đồng bộ JSON schema form của user thành D1 table.

Sau đó, bạn chỉ cần chạy lệnh phát triển.
Dự án sẽ khởi động ở `http://localhost:4321`.

---

## 3. Cấu hình biến môi trường và Firebase

Tất cả các cài đặt của dự án (cả Cloudflare DB và Firebase) đều được quản lý tập trung ở file `.env`. (Không commit file này lên git).

### Hướng dẫn chi tiết lấy thông tin Firebase:
1. Truy cập Firebase Console và đăng nhập bằng tài khoản Google.
2. Bấm **"Add project"** (Thêm dự án), nhập tên dự án và hoàn tất các bước tạo.
3. Trong menu bên trái, chọn **Build > Authentication**, bấm **Get Started**.
4. Chọn tab **Sign-in method**, bật ít nhất nhà cung cấp **Email/Password**. Bật thêm **Google** nếu bạn muốn hỗ trợ đăng nhập qua Google.
5. Quay lại trang tổng quan của dự án (Project Overview) bằng cách bấm biểu tượng ngôi nhà ở góc trái trên.
6. Bấm vào biểu tượng web **`</>`** để "Add an app to get started". Đặt tên cho web app và bấm **Register app**.
7. Firebase sẽ hiển thị đoạn mã `firebaseConfig`. Lấy 3 thông số sau điền vào file `.env` của dự án:
   - `apiKey` -> Điền vào `FIREBASE_API_KEY`
   - `authDomain` -> Điền vào `FIREBASE_AUTH_DOMAIN`
   - `projectId` -> Điền vào `FIREBASE_PROJECT_ID`

---

## 4. Thiết lập Cloudflare D1 (Production)

Bạn cần tạo một Database D1 thật trên Cloudflare bằng lệnh trong package json.
Kết quả trả về sẽ cho bạn 3 thông số: `database_name`, `database_id` và thông tin bind.

Mở file `.env` ở thư mục gốc. Bạn chỉ việc thay thế giá trị của trường `D1_DATABASE_ID` bằng id thật bạn vừa nhận được. Lưu ý là script sẽ tự động cập nhật `.env` vào `wrangler.jsonc` mỗi khi bạn chạy các lệnh npm.

Áp dụng schema vào database Cloudflare bằng lệnh init remote.

---

## 5. Deploy lên Cloudflare Pages

### Sử dụng 1-click script (Khuyên dùng cho nhanh chóng)
Hệ thống sẽ tự động đồng bộ `.env`, build thư mục `dist` và đẩy lên Cloudflare Pages.
*Lưu ý: Bạn cần đăng nhập Wrangler trước bằng npx wrangler login.*

---

## 6. Tổng kết Scripts hỗ trợ

Các lệnh hỗ trợ có sẵn trong package json để 1 click xử lý:
- 1-click đồng bộ env và chạy server dev (Astro SSR).
- Đồng bộ env và build mã nguồn ra HTML/CSS/JS.
- Tạo D1 Database mới trên account Cloudflare.
- Tạo tất cả các table local (Cả CMS và Users).
- Tạo tất cả các table trên D1 production (Cả CMS và Users).
- Cài đặt thư viện và thiết lập Database local.
- 1-click đồng bộ env, build và deploy thẳng lên Cloudflare Pages bằng Wrangler.
