# Hướng Dẫn Viết Bài, Đăng Bài và Push Lên Hệ Thống

Tài liệu này hướng dẫn bạn cách tạo bài viết mới bằng Markdown, xem trước bài viết trên máy tính cá nhân, và đẩy bài lên hệ thống để trang web tự động cập nhật.

## 1. Cấu Trúc Thư Mục Bài Viết

Các bài viết được lưu trữ dưới dạng file Markdown (`.md`) tại thư mục `src/pages/posts/`. Mỗi file sẽ tương ứng với một bài viết trên trang web.

## 2. Tạo File Bài Viết Mới

1. Mở thư mục `src/pages/posts/`.
2. Tạo một file mới với phần mở rộng `.md`. Tên file (slug) nên viết thường, không dấu, và sử dụng dấu gạch ngang (`-`) thay cho dấu cách.
   - Ví dụ: `nghien-cuu-khoa-hoc-moi.md`.
3. Mở file vừa tạo để chỉnh sửa.

## 3. Cấu Trúc Của Một Bài Viết (Frontmatter)

Mỗi bài viết cần bắt đầu bằng phần thông tin siêu dữ liệu (frontmatter) nằm giữa hai dòng `---`. Dưới đây là cấu trúc bắt buộc:

```markdown
---
title: "Tiêu đề bài viết của bạn"
slug: "tieu-de-bai-viet-cua-ban"
category: "chuyen-muc-bai-viet"
excerpt: "Một đoạn mô tả ngắn gọn về nội dung bài viết..."
published_at: "YYYY-MM-DDTHH:MM:SSZ"
image: "/duong-dan-toi-anh-dai-dien.jpg"
---

# Tiêu đề bài viết của bạn (hoặc H1)

Nội dung chi tiết của bài viết được viết bằng cú pháp Markdown ở đây. Bạn có thể sử dụng **in đậm**, *in nghiêng*, danh sách, bảng, và thêm hình ảnh...
```

**Giải thích các trường:**
- `title`: Tiêu đề bài viết (hiển thị trên trang web).
- `slug`: Đường dẫn URL của bài viết. Cần giống với tên file (không có `.md`).
- `category`: Chuyên mục của bài viết. Phải viết thường, không dấu, và sử dụng dấu gạch ngang (VD: `to-chuc`, `cong-tac-hoi`). Bạn có thể xem các chuyên mục có sẵn trên thanh menu.
- `excerpt`: Tóm tắt nội dung bài viết.
- `published_at`: Thời gian xuất bản bài viết theo định dạng ISO 8601 (VD: `2024-05-01T00:00:00Z`).
- `image`: Đường dẫn đến ảnh đại diện của bài viết. Có thể để trống `""` nếu không có.

## 4. Xem Trước Bài Viết Ở Máy Cá Nhân (Local Preview)

Trước khi đăng bài chính thức, bạn nên xem trước để đảm bảo bài viết hiển thị đúng.

1. Mở terminal (hoặc command prompt) và trỏ tới thư mục gốc của dự án.
2. Chạy lệnh sau để khởi động máy chủ xem trước:
   ```bash
   npm run dev
   ```
3. Mở trình duyệt và truy cập `http://localhost:4321` để xem giao diện web. Điều hướng đến phần bài viết hoặc trực tiếp tới URL `http://localhost:4321/posts/tieu-de-bai-viet-cua-ban` để xem bài viết của bạn.

## 5. Đẩy Bài Lên Hệ Thống (Push to Git)

Sau khi kiểm tra và hài lòng với bài viết, bạn cần đẩy (push) thay đổi lên kho lưu trữ Git. Hệ thống CI/CD (Cloudflare Pages) sẽ tự động nhận diện và cập nhật trang web.

Thực hiện các lệnh Git sau trong terminal:

1. **Thêm các thay đổi (Add):**
   ```bash
   git add src/pages/posts/tieu-de-bai-viet-cua-ban.md
   ```
   *(Hoặc `git add .` để thêm tất cả thay đổi).*

2. **Ghi chú (Commit):**
   ```bash
   git commit -m "Thêm bài viết mới: Tiêu đề bài viết của bạn"
   ```

3. **Đẩy lên máy chủ (Push):**
   ```bash
   git push origin main
   ```
   *(Thay `main` bằng nhánh của bạn nếu bạn đang làm việc trên nhánh khác).*

Đợi vài phút, hệ thống sẽ tự động build và triển khai bài viết của bạn lên trang web chính thức.
