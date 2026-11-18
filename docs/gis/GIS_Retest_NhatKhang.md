# GIS regression – Nhật Khang (SCRUM-77)

## Phạm vi
- 23 ca `GIS-002` đến `GIS-024` (test case mô tả trong `docs/gis/gis_cases.json`).
- Runner: `tests/gis/run_gis_retest.cjs` sử dụng Playwright/Chromium, giao diện `FE`, và dữ liệu giả lập cho API khảo sát, GPS, thời tiết và callback tuyến đường.
- **Không phải** kiểm thử E2E với backend thật; không kết luận về dịch vụ bản đồ, thời tiết hoặc định tuyến thực tế.
- Không sửa `FE`, `BE`, test của thành viên khác hoặc Jira.

## Kết quả tham chiếu – 15/11/2026
- Phiên bản đã chạy khi lập hồ sơ: `abcaf5513f216ce48e77efbef262d01db2c80ef0`.
- **19 Pass, 4 Fail**, bốn ca Fail: `GIS-011`, `GIS-018`, `GIS-019`, `GIS-022`.
- Dữ liệu gốc được lưu tại `docs/gis/reference-20261115/results.json`. Đây là **kết quả lịch sử**, không phải lần chạy trên `main` hiện tại.

## Tái lập trên nhánh mới
Chạy script `publish_GIS.ps1` từ gói bàn giao. Script clone `main`, cài dependencies, chạy lại 23 ca, chụp ảnh/ghi log, tạo commit trên nhánh riêng. Nếu có ca `Blocked` thì **không push** để tránh báo cáo sai.

Nếu đã có thư mục repository với bộ test mới, có thể tự chạy:

```powershell
npm ci --prefix tests/gis
npx --prefix tests/gis playwright install chromium
node tests/gis/run_gis_retest.cjs
```

Kết quả thực tế tại thời điểm chạy: `docs/gis/evidence-current/results.json` và `docs/gis/evidence-current/GIS-*.png` (được script tạo sau khi chạy thành công). Các ca Fail vẫn được ghi nguyên trạng để nhóm kiểm tra; không ép Pass.
