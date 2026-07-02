# Hướng dẫn Quản trị Hệ thống CMS

Tài liệu này mô tả chi tiết cách cài đặt, sử dụng và luồng hoạt động của giao diện Admin.

## 1. Kiến trúc hệ thống Admin

Hệ thống quản trị (Admin Dashboard) được xây dựng theo mô hình lai (hybrid) độc đáo để tối ưu hiệu suất và bảo mật:

*   **Online CMS (Quản lý nội dung):** Giao diện Admin (`/admin`) giao tiếp với các API routes của Astro chạy trên **Cloudflare Workers**. Dữ liệu bài viết, chuyên mục, cài đặt giao diện (theme settings) được lưu trực tiếp vào **Cloudflare D1 Database**.
*   **Local File Manager (Quản lý mã nguồn):** Một server Node.js chạy ngầm (`admin-server/index.js` port 4000) xử lý các thao tác đọc/ghi file nội bộ như `.env` hoặc các file mã nguồn trong `src/`. Server này chỉ hoạt động ở môi trường local (`localhost`) để đảm bảo an toàn, không bao giờ được đưa lên production.

## 2. Xác thực (Authentication)

Dự án sử dụng **Firebase Authentication**.

*   Người dùng đăng nhập bằng Email/Mật khẩu hoặc Google qua giao diện Client.
*   Firebase trả về một ID Token (JWT).
*   Giao diện Admin gửi kèm token này trong HTTP Header (`Authorization: Bearer <token>`) cho mỗi request gọi đến Astro API.
*   Backend Worker giải mã token này (sử dụng Google Identity Toolkit API nhẹ thay vì thư viện `firebase-admin` nặng nề) để lấy email người dùng.
*   **Phân quyền (RBAC):** Backend kiểm tra email vừa lấy được có nằm trong danh sách `ADMIN_EMAILS` hoặc `EDITOR_EMAILS` cấu hình ở file `.env` hay không để quyết định quyền truy cập.

## 3. Quản lý Theme Settings

Giao diện trang chủ được module hóa tương tự như framework WordPress (với các "shortcode/widget" như `AboutSection`, `NewsSection`, `Slider`).
Người dùng có thể dễ dàng thay đổi nội dung (tiêu đề, nội dung phần giới thiệu, slider...) thông qua tab **Theme Settings** trong Admin Dashboard. Các cài đặt này được lưu ở bảng `theme_settings` của D1 và trang chủ sẽ tự động render dựa trên dữ liệu này.

## 4. Cách khởi chạy môi trường local

Bạn chỉ cần chạy 1 lệnh duy nhất.
Lệnh này sử dụng thư viện `concurrently` để chạy song song 2 server:
1.  **Astro SSR Dev Server** (cổng 4321)
2.  **Local Admin Node.js Server** (cổng 4000)

Khi truy cập `http://localhost:4321/admin`, phần mềm sẽ tự động nhận diện bạn đang ở local và hiển thị thêm các tab quản lý file mã nguồn (`src`) và cấu hình môi trường (`.env`).
