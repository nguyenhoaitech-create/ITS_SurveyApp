import fs from "node:fs";

const code = `
import test from "node:test";
import assert from "node:assert/strict";

globalThis.document = {
  getElementById: () => ({
    classList: { remove: () => {}, add: () => {} },
    innerHTML: "",
  }),
};
globalThis.window = { print: () => {} };
globalThis.surveyPoints = [{
  id: 1,
  name: "Test",
  category: "school",
  trafficFlow: "medium",
  roadCondition: "good",
  laneCount: 2,
  description: "Desc",
  timestamp: new Date().toISOString(),
  lat: 10.76,
  lng: 106.66,
}];
globalThis.tripHistory = [];
globalThis.categoryConfig = { school: { label: "Truong hoc" } };
globalThis.trafficFlowConfig = { medium: { label: "Trung binh" } };
globalThis.showToast = (m, t) => ({ m, t });
globalThis.Blob = class {
  constructor(c, o) {
    this.c = c;
    this.o = o;
  }
};
globalThis.URL = {
  createObjectURL: () => "blob:mock",
  revokeObjectURL: () => {},
};

test("getDateString returns a 10-character date", async () => {
  // Import sau khi khởi tạo các mock ở trên.
  const { getDateString } = await import("../../FE/app.js");
  assert.strictEqual(getDateString().length, 10);
});
`;

fs.mkdirSync("tests/whitebox", { recursive: true });
fs.writeFileSync("tests/whitebox/export.test.js", code, "utf8");
console.log("Tạo xong tests/whitebox/export.test.js!");