# GAS Backend — LG Dashboard

Google Apps Script Web App đóng vai trò API proxy cho Google Sheets + Drive.

---

## Chuẩn bị trước khi deploy

### 1. Tạo Google Spreadsheet

1. Vào [sheets.google.com](https://sheets.google.com) → tạo Spreadsheet mới
2. Đặt tên: **LG Dashboard DB**
3. Copy **Spreadsheet ID** từ URL:
   ```
   https://docs.google.com/spreadsheets/d/[SPREADSHEET_ID]/edit
   ```

### 2. Tạo Drive Folders

Vào [drive.google.com](https://drive.google.com), tạo 3 folder:

| Folder | Mục đích |
|---|---|
| `LG-Invoices-PDF` | Lưu file PDF gốc |
| `LG-Invoices-Excel` | Lưu file Excel đã export |
| `LG-Invoices-Detail` | Lưu file chi tiết |

Copy **Folder ID** từ URL mỗi folder:
```
https://drive.google.com/drive/folders/[FOLDER_ID]
```

---

## Deploy GAS

### Option A — Manual (Script Editor)

1. Vào [script.google.com](https://script.google.com) → **New project**
2. Đặt tên: **LG Dashboard GAS**
3. Xóa code mặc định trong `Code.gs`
4. Tạo các file sau (click **+** → Script):

| File GAS | Copy từ |
|---|---|
| `Code.gs` | `gas/src/Code.js` |
| `Config.gs` | `gas/src/Config.js` |
| `SheetsService.gs` | `gas/src/SheetsService.js` |
| `DriveService.gs` | `gas/src/DriveService.js` |

5. Paste content từng file tương ứng

### Option B — clasp CLI

```bash
# Cài clasp
npm install -g @google/clasp

# Login Google
clasp login

# Trong thư mục gas/
cd gas

# Tạo project mới
clasp create --type webapp --title "LG Dashboard GAS" --rootDir ./src

# Push code
clasp push

# Mở trên browser để tiếp tục
clasp open
```

---

## Cấu hình Script Properties

Trong GAS Editor:
**Project Settings** (icon bánh răng) → **Script Properties** → **Add property**

| Property | Value |
|---|---|
| `API_SECRET` | Chuỗi bí mật tùy ý (ví dụ: `lg-gas-secret-2024`) |
| `SPREADSHEET_ID` | ID của Spreadsheet đã tạo |
| `PDF_FOLDER_ID` | Folder ID của `LG-Invoices-PDF` |
| `EXCEL_FOLDER_ID` | Folder ID của `LG-Invoices-Excel` |
| `DETAIL_FOLDER_ID` | Folder ID của `LG-Invoices-Detail` |

---

## Khởi tạo Sheets

1. Trong GAS Editor, chọn function `initSheets`
2. Click **Run** (▶)
3. Cấp quyền khi được hỏi (Google OAuth)
4. Kiểm tra Spreadsheet — 3 sheets sẽ được tạo: `INVOICES`, `VERSIONS`, `METADATA`

### Test ping

1. Chọn function `testPing` → Run
2. Xem Logs (View → Logs) → phải thấy `pong`

```javascript
// Thêm vào Code.gs để test
function testPing() {
  var result = routeAction('ping', { secret: getProp('API_SECRET') });
  Logger.log(result.getContent());
}
```

---

## Deploy Web App

1. **Deploy** → **New deployment**
2. Click icon bánh răng → **Web app**
3. Cấu hình:
   - **Description**: `v1`
   - **Execute as**: `Me` (tài khoản của bạn)
   - **Who has access**: `Anyone` ← **quan trọng**
4. Click **Deploy**
5. Copy **Web App URL** (dạng `https://script.google.com/macros/s/AKfy.../exec`)

---

## Cập nhật Next.js .env.local

Tạo file `.env.local` tại root project (copy từ `.env.example`):

```env
# AI / Gemini
GEMINI_API_KEY=your_gemini_api_key_here

# GAS
GAS_WEB_APP_URL=https://script.google.com/macros/s/YOUR_DEPLOYMENT_ID/exec
GAS_API_SECRET=lg-gas-secret-2024

# Google Drive
GOOGLE_DRIVE_PDF_FOLDER_ID=your_pdf_folder_id
GOOGLE_DRIVE_EXCEL_FOLDER_ID=your_excel_folder_id
GOOGLE_DRIVE_DETAIL_FOLDER_ID=your_detail_folder_id

# Google Sheets
GOOGLE_SHEETS_SPREADSHEET_ID=your_spreadsheet_id
```

---

## Kiểm tra kết nối

Sau khi set env, chạy dev server:

```bash
npm run dev
```

Test bằng curl hoặc Postman:

```bash
# Test ping
curl -X POST "https://script.google.com/macros/s/YOUR_ID/exec" \
  -H "Content-Type: application/json" \
  -d '{"action":"ping","secret":"lg-gas-secret-2024"}'

# Expected response
{"status":"success","data":{"message":"pong","timestamp":"2024-..."}}
```

---

## Lưu ý quan trọng

- Mỗi lần **sửa code GAS**, phải **Deploy lại** (New deployment hoặc Manage deployments → Edit)
- Nếu deploy lại → **URL sẽ thay đổi** → cập nhật `.env.local`
- GAS có giới hạn: 6 phút/execution, 20MB/request body
- Không commit `.env.local` lên GitHub

---

## Sheets Schema

### INVOICES
```
id | courier | invoiceNumber | invoiceDate | shipper(JSON) | consignee(JSON) |
packages(JSON) | charges(JSON) | totalCharge | currency | status | version |
pdfUrl | excelUrl | extractedAt | createdAt | updatedAt
```

### VERSIONS
```
versionId | invoiceId | versionNo | snapshot(JSON) | createdAt
```

### METADATA
```
key | value | updatedAt
```
