const request = require("supertest");
const express = require("../../BE/node_modules/express");
const jwt = require("../../BE/node_modules/jsonwebtoken");

const SECRET_KEY = "ITS_SURVEY_SECRET_KEY_2026";
const validToken = jwt.sign({ id: 1, username: "admin" }, SECRET_KEY);

describe("[WHITEBOX][WB-SVY] Kiểm thử Controller & Model Khảo sát BE", () => {
  let app;
  let surveyModel;

  // Cô lập dữ liệu test trước mỗi test case bằng cách reset module cache
  beforeEach(() => {
    jest.resetModules();
    const surveyRoutes = require("../../BE/src/routes/surveyRoutes");
    surveyModel = require("../../BE/src/models/surveyModel");

    app = express();
    app.use(express.json());
    app.use("/api/surveys", surveyRoutes);
  });

  // =========================================================================
  // PHẦN 1: KIỂM THỬ CONTROLLER & ROUTE (API ENDPOINTS)
  // =========================================================================

  describe("1. Lấy danh sách khảo sát (GET /api/surveys)", () => {
    test("TC-WB-01: Lấy danh sách khi có dữ liệu mặc định", async () => {
      const res = await request(app).get("/api/surveys");

      expect(res.status).toBe(200);
      expect(res.body.status).toBe("success");
      expect(res.body.total).toBe(1);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data[0]).toMatchObject({
        id: 1,
        title: "Khảo sát vị trí GPS",
      });
    });

    test("TC-WB-02: Lấy danh sách khi dữ liệu rỗng", async () => {
      // Xóa phần tử mặc định (id: 1) để đưa danh sách về trạng thái rỗng
      await request(app)
        .delete("/api/surveys/1")
        .set("Authorization", `Bearer ${validToken}`);

      const res = await request(app).get("/api/surveys");

      expect(res.status).toBe(200);
      expect(res.body).toEqual({
        status: "success",
        total: 0,
        page: 1,
        limit: 10,
        totalPages: 1,
        data: [],
      });
    });

    test("TC-WB-03: Phân trang với tham số hợp lệ (page=2, limit=1)", async () => {
      // Tạo thêm 1 khảo sát để có tổng 2 bản ghi
      await request(app)
        .post("/api/surveys")
        .set("Authorization", `Bearer ${validToken}`)
        .send({ title: "Khảo sát tuyến đường 2", lat: 10.82, lng: 106.72 });

      const res = await request(app).get("/api/surveys?page=2&limit=1");

      expect(res.status).toBe(200);
      expect(res.body.status).toBe("success");
      expect(res.body.total).toBe(2);
      expect(res.body.page).toBe(2);
      expect(res.body.limit).toBe(1);
      expect(res.body.totalPages).toBe(2);
      expect(res.body.data).toHaveLength(1);
      expect(res.body.data[0].title).toBe("Khảo sát tuyến đường 2");
    });

    test("TC-WB-04: Phân trang với tham số không hợp lệ (page/limit là chữ cái -> fallback mặc định)", async () => {
      const res = await request(app).get("/api/surveys?page=abc&limit=xyz");

      expect(res.status).toBe(200);
      expect(res.body.page).toBe(1);
      expect(res.body.limit).toBe(10);
      expect(res.body.data).toHaveLength(1);
    });

    test("TC-WB-05: Phân trang với tham số không hợp lệ (page âm: page=-1&limit=5)", async () => {
      const res = await request(app).get("/api/surveys?page=-1&limit=5");

      // Ghi nhận hành vi hiện tại của code: parseInt("-1") || 1 giữ nguyên -1 và trả 200
      expect(res.status).toBe(200);
      expect(res.body.page).toBe(-1);
      expect(res.body.data).toEqual([]);
    });
  });

  describe("2. Lấy chi tiết khảo sát theo ID (GET /api/surveys/:id)", () => {
    test("TC-WB-06: Lấy chi tiết khảo sát với ID tồn tại", async () => {
      const res = await request(app).get("/api/surveys/1");

      expect(res.status).toBe(200);
      expect(res.body.status).toBe("success");
      expect(res.body.data.id).toBe(1);
    });

    test("TC-WB-07: Lấy chi tiết khảo sát với ID không tồn tại -> trả 404", async () => {
      const res = await request(app).get("/api/surveys/99999");

      expect(res.status).toBe(404);
      expect(res.body).toEqual({
        status: "error",
        message: "Không tìm thấy điểm khảo sát",
      });
    });
  });

  describe("3. Tạo mới khảo sát (POST /api/surveys)", () => {
    test("TC-WB-08: Tạo khảo sát thành công với dữ liệu hợp lệ và token", async () => {
      const payload = {
        title: "Khảo sát ngã tư Thủ Đức",
        lat: 10.849,
        lng: 106.771,
      };

      const res = await request(app)
        .post("/api/surveys")
        .set("Authorization", `Bearer ${validToken}`)
        .send(payload);

      expect(res.status).toBe(200);
      expect(res.body.status).toBe("success");
      expect(res.body.message).toBe("Tạo mới khảo sát thành công");
      expect(res.body.data).toMatchObject({
        title: "Khảo sát ngã tư Thủ Đức",
        lat: 10.849,
        lng: 106.771,
        status: "Active",
      });
    });

    test("TC-WB-09: Tạo khảo sát thất bại khi thiếu tên khảo sát -> 400", async () => {
      const res = await request(app)
        .post("/api/surveys")
        .set("Authorization", `Bearer ${validToken}`)
        .send({ title: "   ", lat: 10.8, lng: 106.7 });

      expect(res.status).toBe(400);
      expect(res.body).toEqual({
        status: "error",
        message: "Tên khảo sát là bắt buộc",
      });
    });

    test("TC-WB-10: Tạo khảo sát thất bại khi vĩ độ (lat) không phải số -> 400", async () => {
      const res = await request(app)
        .post("/api/surveys")
        .set("Authorization", `Bearer ${validToken}`)
        .send({ title: "Test Lat", lat: "abc", lng: 106.7 });

      expect(res.status).toBe(400);
      expect(res.body).toEqual({
        status: "error",
        message: "Vĩ độ (lat) phải là kiểu số hợp lệ",
      });
    });

    test("TC-WB-11: Tạo khảo sát thất bại khi kinh độ (lng) không phải số -> 400", async () => {
      const res = await request(app)
        .post("/api/surveys")
        .set("Authorization", `Bearer ${validToken}`)
        .send({ title: "Test Lng", lat: 10.8, lng: "xyz" });

      expect(res.status).toBe(400);
      expect(res.body).toEqual({
        status: "error",
        message: "Kinh độ (lng) phải là kiểu số hợp lệ",
      });
    });

    test("TC-WB-12: Từ chối tạo khảo sát khi không gửi Token -> 401", async () => {
      const res = await request(app)
        .post("/api/surveys")
        .send({ title: "Không token" });

      expect(res.status).toBe(401);
      expect(res.body).toHaveProperty("error");
    });
    test("TC-WB-15: Tạo khảo sát dùng trường `name` và bỏ trống tọa độ lat/lng", async () => {
      const res = await request(app)
        .post("/api/surveys")
        .set("Authorization", `Bearer ${validToken}`)
        .send({ name: "Khảo sát mặc định tọa độ" });

      expect(res.status).toBe(200);
      expect(res.body.data).toMatchObject({
        title: "Khảo sát mặc định tọa độ",
        lat: 0,
        lng: 0,
      });
    });
  });

  describe("4. Xóa khảo sát (DELETE /api/surveys/:id)", () => {
    test("TC-WB-13: Xóa khảo sát với ID tồn tại -> 200", async () => {
      const res = await request(app)
        .delete("/api/surveys/1")
        .set("Authorization", `Bearer ${validToken}`);

      expect(res.status).toBe(200);
      expect(res.body).toEqual({
        status: "success",
        message: "Đã xóa thành công",
      });
    });

    test("TC-WB-14: Xóa khảo sát với ID không tồn tại (99999) -> kỳ vọng 404 Not Found", async () => {
      const res = await request(app)
        .delete("/api/surveys/99999")
        .set("Authorization", `Bearer ${validToken}`);

      // Giữ nguyên kỳ vọng 404 theo đúng đặc tả nghiệp vụ (không ép PASS nếu API trả 200)
      expect(res.status).toBe(404);
      expect(res.body.status).toBe("error");
    });
  });

  // =========================================================================
  // PHẦN 2: KIỂM THỬ MODEL & LUỒNG DỮ LIỆU (DATA FLOW TESTING - BIẾN `surveys`)
  // =========================================================================

  describe("5. Kiểm thử luồng dữ liệu (Def-Use) trên surveyModel.js", () => {
    test("TC-WB-DF-01: Đường đi Def(dòng 1) -> Use(dòng 30) -> Def(dòng 34) -> Use(dòng 28) của biến `surveys`", () => {
      // 1. Def tại dòng 1: `let surveys = [...]` khởi tạo 2 phần tử mặc định
      // 2. Use tại dòng 28: `exports.getAll = () => surveys`
      expect(surveyModel.getAll()).toHaveLength(2);

      // 3. Use tại dòng 30: `surveys.push(survey)` trong `exports.add`
      const added = surveyModel.add({ id: 3, name: "Cầu Sài Gòn" });
      expect(added.id).toBe(3);
      expect(surveyModel.getAll()).toHaveLength(3);

      // 4. Use & Def tại dòng 34: `surveys = surveys.filter((s) => s.id != id)` trong `exports.delete`
      surveyModel.delete(1);
      const remaining = surveyModel.getAll();
      expect(remaining).toHaveLength(2);
      expect(remaining.find((item) => item.id === 1)).toBeUndefined();
    });
  });
});