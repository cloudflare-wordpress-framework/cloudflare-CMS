# **Đặc tả kiến trúc hoàn chỉnh (Phiên bản tối giản, thực dụng, SEO-first)**

## **Tôn chỉ dự án**

### **Mục tiêu**

Xây dựng cổng thông tin nội dung y khoa thay thế hoàn toàn một trang CMS:

* SEO cực mạnh  
* Tốc độ tải nhanh  
* Chi phí gần bằng 0  
* Không phụ thuộc VPS  
* Không rebuild toàn bộ khi thêm bài viết  
* Có hệ thống user đầy đủ  
* Có CMS quản trị nội dung  
* Dễ mở rộng trong tương lai  
* Tích hợp hoàn toàn với Cloudflare Free Tier trong giai đoạn đầu

### **Những gì KHÔNG làm**

❌ Không SPA toàn trang  
❌ Không chatbot AI  
❌ Không AI tóm tắt bài viết  
❌ Không AI sinh tag  
❌ Không AI liên kết bài viết  
❌ Không AI hỏi đáp  
❌ Không comment tự xây dựng  
❌ Không sử dụng database Cloudflare cho community  
❌ Không sử dụng Firestore  
❌ Không sử dụng R2  
---

# **Kiến trúc tổng thể**

Internet  
	│  
	▼  
Cloudflare CDN  
	│  
	▼  
Cloudflare Edge Cache  
	│  
┌──┴─────────────┐  
│           	│  
│ Cache Hit 	│ Cache Miss  
│           	│  
▼           	▼

HTML     	Astro SSR  
             	│  
   	┌─────────┴─────────┐  
   	│               	│  
   	▼               	▼

Firebase Auth     	Cloudflare D1  
---

# **Công nghệ sử dụng**

## **Frontend**

Astro  
Vai trò:

* SSR  
* Routing  
* SEO  
* Layout  
* Article Pages  
* Admin UI

---

## **Hosting**

Cloudflare Pages  
Không sử dụng Workers riêng.  
Lý do:

* Deploy đơn giản  
* GitHub integration tốt  
* Preview build  
* Cloudflare quản lý toàn bộ

---

## **Xác thực**

Firebase Authentication  
Các hình thức:

* Email / Password  
* Google Login  
* GitHub Login

Không sử dụng:  
Firestore  
Realtime Database  
Cloud Functions  
---

## **Database**

Cloudflare D1  
Chỉ dùng cho dữ liệu nghiệp vụ.

# **Chức năng hệ thống**

## **Public Website**

### **Trang chủ**

/  
Hiển thị:

* Bài nổi bật  
* Bài mới nhất  
* Các chuyên mục

---

### **Chuyên mục**

Các chuyên mục cũng phải được index cache.  
/chuyen-muc/phau-thuat-long-nguc  
---

### **Tag**

/tag/ecmo  
---

### **Bài viết**

/posts/phau-thuat-bac-cau-dong-mach-vanh  
Render bằng SSR.  
---

### **Tìm kiếm**

/search  
Không truy vấn D1.  
---

# **Hệ thống tìm kiếm**

Đây là thành phần quan trọng.

## **Nguyên tắc**

Không tìm kiếm trên database.  
Không dùng:  
LIKE  
FULLTEXT  
---

## **Search Index**

Tạo file:  
/public/search-index.json  
Ví dụ:  
\[  
  {  
	"id": 1,  
	"slug": "ecmo",  
	"title": "ECMO là gì",  
	"keywords": \["ecmo", "hoi suc"\]  
  }  
\]  
---

## **Khi publish bài**

Workflow:  
Editor Publish

↓

Lưu D1

↓

Cập nhật search-index.json

↓

Deploy index mới  
---

## **Search Engine**

Sử dụng:  
MiniSearch  
Ưu điểm:

* Open Source  
* Miễn phí  
* Chạy Client Side  
* Không cần server

---

# **CMS**

## **URL**

/admin  
---

## **Dashboard**

Hiển thị:

* Tổng bài viết  
* Bài mới  
* Bài chờ duyệt

---

## **Quản lý bài viết**

Trạng thái:  
Draft  
Review  
Published  
Archived  
---

## **Quản lý chuyên mục**

CRUD Categories  
---

## **Quản lý Tag**

CRUD Tags  
---

## **Quản lý người dùng**

Admin  
Editor  
Reviewer  
---

# **Phân quyền**

## **Guest**

Đọc bài  
Tìm kiếm  
---

## **Member**

(nếu cần trong tương lai)  
Có thể tùy chỉnh các *additional attributes* theo nhu cầu nghiệp vụ, ví dụ:

* Thông tin hồ sơ: họ tên, đơn vị công tác, chuyên khoa, học hàm/học vị  
* Quyền hiển thị nội dung: chỉ đọc, biên tập, duyệt bài theo chuyên mục  
* Trạng thái tài khoản: active, suspended, archived  
* Metadata mở rộng: ghi chú nội bộ, lịch sử hoạt động, thời điểm đăng nhập gần nhất

Các thuộc tính này chỉ lưu trong D1, Firebase chỉ chịu trách nhiệm xác thực (authentication), giúp tách bạch rõ ràng giữa *identity* và *business data*.  
Tối ưu cache để giảm tối đa lượt request đọc thông tin user từ D1 bằng các cơ chế sau:

* Cache profile theo session: sau khi verify Firebase ID Token, load hồ sơ user từ D1 *một lần*, sau đó lưu vào `locals` (Astro) hoặc in-memory cache trong request lifecycle.

`locals`  
`locals`

* Edge Cache theo role: với các trang admin/editor, cache HTML theo key `(role + route)` để tránh query user lặp lại cho mỗi request.

`(role + route)`  
`(role + route)`

* Short-lived KV-style cache (in-memory): cache thông tin user (id, role, status) trong 1–5 phút ở Worker runtime; chấp nhận eventual consistency.  
* JWT claims tối giản: chỉ đọc các claim cơ bản (uid, email\_verified) từ Firebase token, không nhồi nghiệp vụ vào token.  
* Cache invalidation rõ ràng: khi admin thay đổi role/trạng thái user → xóa cache user tương ứng; không purge toàn bộ.

Nguyên tắc: *D1 chỉ được query khi thật sự cần*, phần lớn request public không bao giờ chạm tới bảng user.  
---

## **Editor**

Tạo bài  
Sửa bài  
---

## **Reviewer**

Duyệt bài  
---

## **Admin**

Toàn quyền  
---

# **Cache Strategy**

Đây là phần quyết định khả năng mở rộng.

## **Public Pages**

Ví dụ:  
/benh-mach-mau  
Luồng:  
Request

↓

Cloudflare Cache

↓

Nếu HIT  
	Trả HTML

Nếu MISS  
	Astro render  
	Cache lại  
---

## **Khi sửa bài**

Editor Publish  
↓  
Invalidate URL  
Ví dụ:  
/posts/ecmo  
↓  
Request tiếp theo:  
Render mới  
Cache mới  
---

## **Kết quả**

Không cần:  
Build lại 1000 bài  
Build lại 10000 bài  
---

# **Community**

Chỉ sử dụng:  
Giscus  
---

## **Kiến trúc**

Website  
	│  
	▼  
Giscus  
	│  
	▼  
GitHub Discussions  
---

## **Ưu điểm**

* Miễn phí  
* Không cần database  
* Không cần server  
* Moderation tốt  
* Dễ backup

---

## **Không hỗ trợ**

Disqus  
Utterances  
Comment tự viết  
---

# **Database Schema**

## **users**

id  
firebase\_uid  
email  
role  
created\_at  
---

## **categories**

id  
name  
slug  
---

## **tags**

id  
name  
slug  
---

## **posts**

id  
slug  
title  
excerpt  
content  
status  
author\_id  
published\_at  
updated\_at  
---

## **post\_tags**

post\_id  
tag\_id  
---

# **Cấu trúc mã nguồn**

src  
├── pages  
│   ├── index.astro  
│   ├── posts  
│   ├── category  
│   └── admin  
│  
├── components  
│  
├── layouts  
│  
├── lib  
│   ├── auth  
│   ├── database  
│   ├── cache  
│   └── search  
│  
├── integrations  
│   ├── firebase  
│   └── giscus  
│  
└── middleware  
---

# **Khả năng mở rộng tương lai**

Kiến trúc vẫn cho phép bổ sung:

## **Authentication**

Có thể thay:  
Firebase  
mà không phải viết lại toàn bộ hệ thống.  
---

## **Search**

Có thể thay:  
MiniSearch  
↓  
Algolia  
↓  
Typesense  
nếu số lượng bài tăng rất lớn.  
---

## **Analytics**

Có thể thêm:  
Cloudflare Analytics  
Google Analytics  
Microsoft Clarity  
---

## **CDN hình ảnh**

Chiến lược xử lý hình ảnh ưu tiên miễn phí – đơn giản – dễ thay thế, không phụ thuộc hạ tầng Cloudflare trả phí ngay từ đầu.

### **Nguyên tắc chung**

* Không xử lý ảnh động (resize/optimize) ở server  
* Không lưu ảnh trong D1  
* Không yêu cầu backend riêng  
* Ảnh được phục vụ qua CDN của bên thứ ba  
* URL ảnh phải ổn định, cache tốt, public

---

### **Phương án 1: GitHub (khuyến nghị cho giai đoạn đầu)**

Sử dụng GitHub Repository (public) để lưu trữ ảnh bài viết.

#### **Cách triển khai**

* Tạo repo riêng, ví dụ:

medical-content-assets

* Cấu trúc:

images/  
├── 2024/  
│ ├── ecmo-1.webp  
│ ├── ecmo-2.webp  
└── 2025/

* Dùng URL dạng:

https://raw.githubusercontent.com///main/images/2024/ecmo-1.webp  
hoặc CDN của GitHub:  
https://cdn.jsdelivr.net/gh///images/2024/ecmo-1.webp

#### **Ưu điểm**

* 100% miễn phí  
* CDN toàn cầu (GitHub / jsDelivr)  
* Cache rất mạnh  
* Versioning rõ ràng  
* Backup tự nhiên qua Git

#### **Nhược điểm**

* Không phù hợp upload ảnh trực tiếp từ UI (cần commit)  
* Không nên dùng cho ảnh quá lớn hoặc quá nhiều (\> vài chục nghìn)

Phù hợp cho:

* Hình minh họa  
* Sơ đồ  
* Ảnh giáo trình

---

### **Phương án 2: Imgur (tùy chọn, không khuyến nghị lâu dài)**

Sử dụng Imgur để host ảnh public.

#### **Ưu điểm**

* Upload rất nhanh  
* Không cần hạ tầng  
* Có API

#### **Rủi ro**

* Điều khoản có thể thay đổi  
* Có thể bị xoá ảnh nếu bị đánh giá là inactive/commercial  
* Không kiểm soát được vòng đời ảnh

Khuyến nghị:

* Chỉ dùng cho nội dung tạm thời  
* Không dùng cho core content y khoa

---

### **Phương án 3: Kết hợp chiến lược (khuyến nghị thực tế)**

| Loại ảnh | Giải pháp |
| :---- | :---- |
| Ảnh minh họa, sơ đồ | GitHub \+ jsDelivr |
| Ảnh demo, tạm | Imgur |
| Ảnh quan trọng lâu dài | Chuẩn bị sẵn đường nâng cấp |

---

### **Chuẩn hóa ảnh để tối ưu SEO & cache**

* Định dạng: `webp`

`webp`

* Kích thước tối đa: \~1600px chiều dài  
* Không upload ảnh gốc từ camera  
* Đặt tên file có ý nghĩa SEO:

ecmo-so-do-nguyen-ly.webp  
---

### **Lộ trình nâng cấp (khi cần)**

Khi traffic hoặc yêu cầu tăng cao, có thể chuyển nguồn ảnh mà không thay đổi bài viết bằng cách:  
GitHub / Imgur  
   ↓  
Cloudflare Images  
Chỉ cần:

* Map lại base URL  
* Không phải sửa nội dung Markdown

---

### **Kết luận**

Chiến lược ảnh đề xuất:

* Giai đoạn đầu: GitHub \+ jsDelivr  
* Tránh lock-in vào dịch vụ trả phí  
* Không phụ thuộc backend  
* Đảm bảo cache, SEO và độ bền URL

Phù hợp với triết lý toàn bộ hệ thống: *tối giản – kiểm soát – mở rộng dần khi cần*.  
---

# **Kiến trúc cuối cùng**

Astro SSR  
│  
├── Cloudflare Pages  
├── Cloudflare Edge Cache  
├── Cloudflare D1  
├── Firebase Authentication  
├── MiniSearch (search-index.json)  
└── Giscus  
Đây là phương án mình đánh giá phù hợp nhất cho dự án của bạn: SEO-first, content-first, Cloudflare-first, chi phí thấp, ít phụ thuộc dịch vụ bên ngoài, dễ vận hành và đủ khả năng mở rộng từ vài nghìn lên hàng trăm nghìn bài viết mà không cần thay đổi nền tảng chính.  
