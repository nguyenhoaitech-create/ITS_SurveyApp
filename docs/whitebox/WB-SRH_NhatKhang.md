# WB SRH Nhật Khang

## 1 Thông tin và kết quả
Người thực hiện: Nguyễn Nhật Khang. Jira: SCRUM-129. Ngày chạy: 15/11/2026. Nhánh gốc hnguyen; nhánh làm việc qa/nhatkhang-wb-srh-20261115. SHA trước và sau: `b59c63ea5ea38d44cb0238b28d26aada59661fdd`. Node v24.22.1; JSDOM 26.1.0; fake-timers 15.0.0; Acorn 8.15.0; Istanbul instrument 6.0.3.

Đã chạy 37 ca: 34 Pass, 3 Fail. Ba phát hiện giữ nguyên assertion Fail, chưa tạo ticket Jira. Không sửa mã sản phẩm. Task cần Leader review và nhóm xác nhận trước khi chốt.

## 2 Phạm vi và cách nạp hàm
`FE/app.js`: initGeocoder 310–363; startVoiceSearch 530–563; escapeHtml 1551–1558. Chọn các hàm có debounce/callback, dữ liệu từ dịch vụ ngoài và trạng thái recording dễ lỗi. SHA256 toàn file: `e87bbf79c4fca617b91cacaf50f11bf89d7977af9051b8060080a4e4bb8ae104`.

Acorn tìm đúng ba FunctionDeclaration ở cấp cao nhất. Giữ nguyên từng byte trong các khoảng AST; các ký tự ngoài phạm vi được thay bằng khoảng trắng, giữ nguyên newline và vị trí dòng. Istanbul instrument phần chọn trước khi vm.runInContext trong JSDOM. Không sao chép lại thuật toán bằng hàm test. Các callback lồng bên trong thuộc phạm vi đo; phần khởi tạo/map/toàn ứng dụng bị loại khỏi mẫu số.

DOM input/button dùng JSDOM. Fake timer kiểm 499/500 ms. Mock đối tượng Leaflet geocoder/map/popup và SpeechRecognition có lưu lời gọi; không gọi Nominatim, không phát âm hay dùng micro thật. Mạng được chặn ở ranh giới geocoder giả lập; không kiểm fetch implementation của plugin. Đây là unit test, chưa phải E2E hay kiểm micro thiết bị.

Lệnh từ repository:
```powershell
npm ci --prefix tests/whitebox
node tests/whitebox/search.test.cjs
```
Exit code 1 hiện tại là có ba ca Fail của sản phẩm; xem evidence/run.log và results.json. Không đổi expected chỉ để exit 0.

## 3 Điều kiện và nhánh
NE là không được đánh giá vì short circuit. Các số 01–37 trong bảng là hậu tố mã WB-SRH. Bảng T/F phân tích thủ công và đối chiếu test; Istanbul branch không đồng nghĩa condition coverage hay MC/DC.

|Mã|Điều kiện|Ca và giá trị|
|---|---|---|
|G1|L.Control.Geocoder|T:02–20; F:01|
|G2|trim(query).length > 2|T:05; F:02/03/04; biên độ dài 2/3 và thời gian 499/500ms|
|G3|results && results.length>0 của debounce|null:08 → F/NE; []:09 → T/F; có:05 → T/T|
|G4|e.key === Enter|T:11–16; F:10|
|G5|query sau trim khác rỗng khi Enter|T:12/13; F:11|
|G6|results && results.length>0 của Enter|null:14 → F/NE; []:15 → T/F; có:12 → T/T|
|V1|!W && !S, W/S là sự hiện diện API|21:W0S0 → T/T;22:W0S1 → T/F;23:W1S0 → F/NE;24:W1S1 → F/NE|
|V2|window.SpeechRecognition || window.webkitSpeechRecognition|22/24: chọn standard;23: chọn webkit|
|E1|escapeHtml là chuỗi replace không có if|31–37; không có mẫu số nhánh riêng|

## 4 Đồ thị và đường đi độc lập
Đồ thị `voice-cfg.png`/`voice-cfg.dot` mô tả luồng đồng bộ bình thường của startVoiceSearch. N=9 nút, E=11 cạnh, P=3 nút quyết định (tách short circuit && và chọn ||). V(G)=E−N+2=11−9+2=4=P+1. Không gộp callback onresult/onerror/onend vào cùng CFG đồng bộ; các callback kiểm riêng ở25–30. Đường exception của constructor/start cũng không nằm trong CFG này; ca29 kiểm bổ sung.

|Đường|Nút cạnh|Ca|
|---|---|---|
|P1|1→2T→3T→4→9|21 không có cả hai API|
|P2|1→2T→3F→5T→6→8→9|22 chỉ standard|
|P3|1→2F→5F→7→8→9|23 chỉ webkit|
|P4|1→2F→5T→6→8→9|24 có cả hai|

Các cạnh: 1→2,2T→3,2F→5,3T→4,3F→5,4→9,5T→6,5F→7,6→8,7→8,8→9.

## 5 Test case và kết quả
Mỗi ca tạo DOM, clock và coverage context mới. Cột actual là rút gọn; assertion chi tiết và snapshot nguyên vẹn ở evidence/results.json.

|ID|Điều kiện nhánh đường đi|Input và trạng thái đầu|Bước gọi|Expected|Actual|Kết quả|Assertion log|Bug ID|
|---|---|---|---|---|---|---|---|---|
|WB-SRH-01|G1F|L.Control.Geocoder absent|Context mới; Không có plugin|Không gọi geocode và không gắn handler|{"input":"abc"}|Pass|results.json#WB-SRH-01|—|
|WB-SRH-02|G1T,G2F|""|Context mới; Độ dài sau trim 0|0 request sau 500ms|{"input":"  "}|Pass|results.json#WB-SRH-02|—|
|WB-SRH-03|G1T,G2F|"a"|Context mới; Độ dài sau trim 1|0 request sau 500ms|{"input":" a "}|Pass|results.json#WB-SRH-03|—|
|WB-SRH-04|G1T,G2F|"ab"|Context mới; Độ dài sau trim 2|0 request sau 500ms|{"input":" ab "}|Pass|results.json#WB-SRH-04|—|
|WB-SRH-05|G2T,G3T,BVA-499-500| abc |Context mới; Biên 499 và 500 ms|499ms:0;500ms:1 query abc, zoom16, popup và success|{"calls":[{"q":"abc","at":500}],"views":[{"center":{"lat":10.8,"lng":106.7},"zoom":16}],"popups":[{"center":{"lat":10.8,"lng":106.7},"content":"<strong>📍 Gò Vấp</strong>","opened":true}],"toasts":[{"message":"Đã tìm thấy: Gò Vấp","type":"success"}],"input":" abc "}|Pass|results.json#WB-SRH-05|—|
|WB-SRH-06|G2T,timer-cancel|abc; +250ms abcd|Context mới; Hủy debounce cũ|Chỉ gọi abcd ở 750ms|{"calls":[{"q":"abcd","at":750}],"views":[{"center":{"lat":10.8,"lng":106.7},"zoom":16}],"popups":[{"center":{"lat":10.8,"lng":106.7},"content":"<strong>📍 Gò Vấp</strong>","opened":true}],"toasts":[{"message":"Đã tìm thấy: Gò Vấp","type":"success"}],"input":"abcd"}|Pass|results.json#WB-SRH-06|—|
|WB-SRH-07|G2F,timer-cancel|abc; +200ms spaces|Context mới; Xóa query trước debounce|Không gọi dịch vụ|{"input":"  "}|Pass|results.json#WB-SRH-07|—|
|WB-SRH-08|G3F,G3aF|abc|Context mới; Debounce kết quả null|Không đổi map/popup, không success|{"calls":[{"q":"abc","at":500}],"input":"abc"}|Pass|results.json#WB-SRH-08|—|
|WB-SRH-09|G3F,G3aT-G3bF|abc|Context mới; Debounce kết quả []|Không đổi map/popup, không success|{"calls":[{"q":"abc","at":500}],"input":"abc"}|Pass|results.json#WB-SRH-09|—|
|WB-SRH-10|G4F|abc + Escape|Context mới; Phím khác Enter|Không request ngay; request sau500ms|{"calls":[{"q":"abc","at":500}],"views":[{"center":{"lat":10.8,"lng":106.7},"zoom":16}],"popups":[{"center":{"lat":10.8,"lng":106.7},"content":"<strong>📍 Gò Vấp</strong>","opened":true}],"toasts":[{"message":"Đã tìm thấy: Gò Vấp","type":"success"}],"input":"abc"}|Pass|results.json#WB-SRH-10|—|
|WB-SRH-11|G4T,G5F|spaces + Enter|Context mới; Enter query rỗng|preventDefault, không request|{"input":"  "}|Pass|results.json#WB-SRH-11|—|
|WB-SRH-12|G5T,G6T|abc + Enter ở250ms|Context mới; Enter trước debounce|Một request ngay, hủy timeout, success|{"calls":[{"q":"abc","at":250}],"views":[{"center":{"lat":10.8,"lng":106.7},"zoom":16}],"toasts":[{"message":"Đã tìm thấy: Gò Vấp","type":"success"}],"input":"abc"}|Pass|results.json#WB-SRH-12|—|
|WB-SRH-13|G5T,G6T| a + Enter|Context mới; Enter query ngắn|Query a được gọi ngay dù không tự debounce|{"calls":[{"q":"a","at":0}],"views":[{"center":{"lat":10.8,"lng":106.7},"zoom":16}],"toasts":[{"message":"Đã tìm thấy: Gò Vấp","type":"success"}],"input":" a "}|Pass|results.json#WB-SRH-13|—|
|WB-SRH-14|G6F,G6aF|abc + Enter|Context mới; Enter kết quả null|Cảnh báo không tìm thấy, map không đổi|{"calls":[{"q":"abc","at":0}],"toasts":[{"message":"Không tìm thấy địa điểm","type":"warning"}],"input":"abc"}|Pass|results.json#WB-SRH-14|—|
|WB-SRH-15|G6F,G6aT-G6bF|abc + Enter|Context mới; Enter kết quả []|Cảnh báo không tìm thấy, map không đổi|{"calls":[{"q":"abc","at":0}],"toasts":[{"message":"Không tìm thấy địa điểm","type":"warning"}],"input":"abc"}|Pass|results.json#WB-SRH-15|—|
|WB-SRH-16|G6T,Enter-after|abc ở500ms rồi Enter|Context mới; Enter sau debounce|Hai request theo mã hiện tại, map nhận kết quả|{"calls":[{"q":"abc","at":500},{"q":"abc","at":500}],"views":[{"center":{"lat":10.8,"lng":106.7},"zoom":16},{"center":{"lat":10.8,"lng":106.7},"zoom":16}],"popups":[{"center":{"lat":10.8,"lng":106.7},"content":"<strong>📍 Gò Vấp</strong>","opened":true}],"toasts":[{"message":"Đã tìm thấy: Gò Vấp","type":"success"},{"message":"Đã tìm thấy: Gò Vấp","type":"success"}],"input":"abc"}|Pass|results.json#WB-SRH-16|—|
|WB-SRH-17|G3T|2 results|Context mới; Chỉ dùng kết quả đầu tiên|Map chọn kết quả đầu, không chọn thứ hai|{"calls":[{"q":"abc","at":500}],"views":[{"center":{"lat":1,"lng":2},"zoom":16}],"popups":[{"center":{"lat":1,"lng":2},"content":"<strong>📍 first</strong>","opened":true}],"toasts":[{"message":"Đã tìm thấy: first","type":"success"}],"input":"abc"}|Pass|results.json#WB-SRH-17|—|
|WB-SRH-18|G3T,HTML|<img src=x onerror=alert(1)>|Context mới; HTML từ dịch vụ|Popup và toast không chứa thẻ HTML thực thi|{"calls":[{"q":"abc","at":500}],"views":[{"center":{"lat":1,"lng":2},"zoom":16}],"popups":[{"center":{"lat":1,"lng":2},"content":"<strong>📍 &lt;img src=x onerror=alert(1)&gt;</strong>","opened":true}],"toasts":[{"message":"Đã tìm thấy: &lt;img src=x onerror=alert(1)&gt;","type":"success"}],"input":"abc"}|Pass|results.json#WB-SRH-18|—|
|WB-SRH-19|service-error,robustness|mock geocode throws|Context mới; Dịch vụ ném lỗi|Không exception không bắt; thông báo lỗi cho người dùng|{"calls":[{"q":"abc","at":0}],"errors":["mock service unavailable"],"input":"abc"}|Fail|results.json#WB-SRH-19|WB-SRH-F01|
|WB-SRH-20|async-race,robustness|old pending, new pending; new callback rồi old|Context mới; Phản hồi cũ đến sau phản hồi mới|Kết quả cuối trên map phải thuộc query mới|{"calls":[{"q":"old","at":500},{"q":"new","at":1000}],"views":[{"center":{"lat":2,"lng":2},"zoom":16},{"center":{"lat":1,"lng":1},"zoom":16}],"popups":[{"center":{"lat":2,"lng":2},"content":"<strong>📍 new</strong>","opened":true},{"center":{"lat":1,"lng":1},"content":"<strong>📍 old</strong>","opened":true}],"toasts":[{"message":"Đã tìm thấy: new","type":"success"},{"message":"Đã tìm thấy: old","type":"success"}],"input":"new"}|Fail|results.json#WB-SRH-20|WB-SRH-F02|
|WB-SRH-21|V1T,W0S0|W=F,S=F|Context mới; Không hỗ trợ Speech|warning, không recording|{"toasts":[{"message":"Trình duyệt không hỗ trợ tìm kiếm giọng nói","type":"warning"}]}|Pass|results.json#WB-SRH-21|—|
|WB-SRH-22|W0S1,V1F,V2standard|API standard|Context mới; Speech standard|vi-VN, start, recording; onend trả icon gốc|{"toasts":[{"message":"🎤 Đang nghe...","type":"info"}]}|Pass|results.json#WB-SRH-22|—|
|WB-SRH-23|W1S0,V1F,V2webkit|API webkit|Context mới; Speech webkit|vi-VN, start, recording; onend trả icon gốc|{"toasts":[{"message":"🎤 Đang nghe...","type":"info"}]}|Pass|results.json#WB-SRH-23|—|
|WB-SRH-24|W1S1,V1F,V2standard|API both|Context mới; Speech both|vi-VN, start, recording; onend trả icon gốc|{"toasts":[{"message":"🎤 Đang nghe...","type":"info"}]}|Pass|results.json#WB-SRH-24|—|
|WB-SRH-25|V-result,G2T|transcript Gò Vấp|Context mới; Nhận dạng thành công|Input nhận transcript, input event lên geocoder, success; end reset|{"calls":[{"q":"Gò Vấp","at":500}],"views":[{"center":{"lat":10.8,"lng":106.7},"zoom":16}],"popups":[{"center":{"lat":10.8,"lng":106.7},"content":"<strong>📍 Gò Vấp</strong>","opened":true}],"toasts":[{"message":"🎤 Đang nghe...","type":"info"},{"message":"Đã nhận: \"Gò Vấp\"","type":"success"},{"message":"Đã tìm thấy: Gò Vấp","type":"success"}],"input":"Gò Vấp"}|Pass|results.json#WB-SRH-25|—|
|WB-SRH-26|V-error,V-end|onerror then onend|Context mới; Speech lỗi rồi kết thúc|error và icon trở lại bình thường|{"toasts":[{"message":"🎤 Đang nghe...","type":"info"},{"message":"Không thể nhận diện giọng nói","type":"error"}]}|Pass|results.json#WB-SRH-26|—|
|WB-SRH-27|V-end|onend only|Context mới; Speech kết thúc không transcript|Input không đổi, reset recording|{"toasts":[{"message":"🎤 Đang nghe...","type":"info"}],"input":"before"}|Pass|results.json#WB-SRH-27|—|
|WB-SRH-28|V-result,HTML|<svg onload=alert(1)>|Context mới; HTML trong transcript|Toast escaped; input giữ text; end reset|{"toasts":[{"message":"🎤 Đang nghe...","type":"info"},{"message":"Đã nhận: \"&lt;svg onload=alert(1)&gt;\"","type":"success"}],"input":"<svg onload=alert(1)>"}|Pass|results.json#WB-SRH-28|—|
|WB-SRH-29|voice-start-error,robustness|start throws|Context mới; recognition.start ném lỗi|Không crash; reset recording và báo lỗi|{"toasts":[{"message":"🎤 Đang nghe...","type":"info"}],"recording":true}|Fail|results.json#WB-SRH-29|WB-SRH-F03|
|WB-SRH-30|V-result,G2F|empty transcript|Context mới; Speech transcript rỗng|Input rỗng; không geocode; end reset|{"toasts":[{"message":"🎤 Đang nghe...","type":"info"},{"message":"Đã nhận: \"\"","type":"success"}]}|Pass|results.json#WB-SRH-30|—|
|WB-SRH-31|E1|&<>"'|Context mới; escapeHtml 31|Chuỗi kết quả &amp;&lt;&gt;&quot;&#39;|{"toasts":[{"message":"&amp;&lt;&gt;&quot;&#39;","type":"escape-result"}]}|Pass|results.json#WB-SRH-31|—|
|WB-SRH-32|E1|Gò Vấp 123|Context mới; escapeHtml 32|Chuỗi kết quả Gò Vấp 123|{"toasts":[{"message":"Gò Vấp 123","type":"escape-result"}]}|Pass|results.json#WB-SRH-32|—|
|WB-SRH-33|E1||Context mới; escapeHtml 33|Chuỗi kết quả |{"toasts":[{"message":"","type":"escape-result"}]}|Pass|results.json#WB-SRH-33|—|
|WB-SRH-34|E1|null|Context mới; escapeHtml 34|Chuỗi kết quả null|{"toasts":[{"message":"null","type":"escape-result"}]}|Pass|results.json#WB-SRH-34|—|
|WB-SRH-35|E1|undefined|Context mới; escapeHtml 35|Chuỗi kết quả undefined|{"toasts":[{"message":"undefined","type":"escape-result"}]}|Pass|results.json#WB-SRH-35|—|
|WB-SRH-36|E1|42|Context mới; escapeHtml 36|Chuỗi kết quả 42|{"toasts":[{"message":"42","type":"escape-result"}]}|Pass|results.json#WB-SRH-36|—|
|WB-SRH-37|E1|&lt;|Context mới; escapeHtml 37|Chuỗi kết quả &amp;lt;|{"toasts":[{"message":"&amp;lt;","type":"escape-result"}]}|Pass|results.json#WB-SRH-37|—|

## 6 Coverage theo hàm
Coverage đo tự động sau khi gộp tất cả37context, gồm caFail. Mẫu số chỉ các range đã chọn, không phải toàn FE/app.js. 100% coverage vẫn có lỗi chức năng.

|Hàm|Dòng nguồn|Statement|Branch instrumented|Function gồm callback|
|---|---|---|---|---|
|initGeocoder|[310, 363]|24/24|16/16|6/6|
|startVoiceSearch|[530, 563]|23/23|6/6|4/4|
|escapeHtml|[1551, 1558]|1/1|0/0|1/1|

Tổng48/48 statements,22/22 branch arms,11/11 functions (3 hàm gốc+8callback),48/48 executable lines. escapeHtml không có nhánh: ghi N/A, không tính0/0 là100% nhánh. Không có statement/branch instrumented chưa phủ trong phạm vi đã chọn. Chưa đo tự động condition coverage; bảng ở mục3 là phân tích thủ công. Không tuyên bố MC/DC hoặc bao phủ tất cả đường đi bất đồng bộ.

Lệnh tạo coverage tích hợp trong node tests/whitebox/search.test.cjs. Báo cáo: evidence/coverage/index.html; coverage-final.json; coverage-scope.json; coverage-by-function.json. Xem sourceFinder hiển thị toàn file để đối chiếu dòng nhưng chỉ dòng instrumented có hit.

## 7 Phát hiện và giới hạn
WB-SRH-F01 — ca19: geocoder mock ném exception; error không được bắt, không có toast error. Mong đợi xử lý lỗi dịch vụ an toàn. Đây là robustness fault injection; chưa khẳng định Nominatim thật phát đúng exception này.

WB-SRH-F02 — ca20: gửi old rồi new; callback new về trước, old về sau; map kết thúc ở old. Mong đợi kết quả cuối thuộc query mới. Phát hiện race được tái hiện bằng callback có kiểm soát.

WB-SRH-F03 — ca29: recognition.start mock ném exception; exception thoát hàm và button vẫn recording. Mong đợi bắt lỗi, trả icon và báo lỗi. Chưa kiểm trực tiếp lỗi quyền micro trên trình duyệt thật.

Các mãF01–F03 chỉ là tham chiếu hồ sơ, không phải mãBug Jira. Giữ nguyên37ca để retest trên bảnDev sửa; cần chạy lại sau gộp trênSHA mới. Phần mã dùng mock có thể bỏ sót hành vi thật của Leaflet/WebSpeech; chưa đánh giá toàn bộDOM/map/appboot.

## 8 Dấu vết tái lập
design_testcasse.csv là đầu vào thiết kế; report_run_testcase.csv là kết quả thực thi từ37snapshot. Mã test trong tests/whitebox, hồ sơ này trong docs/whitebox. SHA trước/sau giống nhau vì chỉ thêm tài liệu và test; FE/BE không đổi. Không có Jira comment/attachment/status mới.