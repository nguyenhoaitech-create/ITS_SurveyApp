import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const state = {
  blobs: [],
  anchors: [],
  revokedUrls: [],
  toasts: [],
  elements: {}
};

const sandbox = {
  window: { print: () => {} },

  document: {
    getElementById(id) {
      if (!state.elements[id]) {
        state.elements[id] = {
          innerHTML: '',
          classList: {
            removed: [],
            added: [],
            remove(value) {
              this.removed.push(value);
            },
            add(value) {
              this.added.push(value);
            }
          }
        };
      }
      return state.elements[id];
    },

    createElement(tag) {
      const element = {
        tag,
        href: '',
        download: '',
        clicked: false,
        click() {
          this.clicked = true;
        }
      };
      state.anchors.push(element);
      return element;
    }
  },

  surveyPoints: [],
  tripHistory: [],

  categoryConfig: {
    school: { label: 'Trường học', color: '#00ff00' },
    other: { label: 'Khác', color: '#666666' }
  },

  trafficFlowConfig: {
    low: { label: 'Thấp' },
    medium: { label: 'Trung bình' },
    high: { label: 'Cao' },
    congested: { label: 'Ùn tắc' }
  },

  Blob: class {
    constructor(parts, options) {
      this.parts = parts;
      this.options = options;
      state.blobs.push(this);
    }
  },

  URL: {
    createObjectURL(blob) {
      return `blob:mock-${state.blobs.indexOf(blob)}`;
    },
    revokeObjectURL(url) {
      state.revokedUrls.push(url);
    }
  },

  console,
  setTimeout,
  clearTimeout
};

sandbox.global = sandbox;

const appCode = fs.readFileSync('FE/app.js', 'utf8');
vm.createContext(sandbox);
vm.runInContext(appCode, sandbox);

// Ghi đè lại hàm showToast sau khi app.js đã load để chuyển tiếp về state.toasts của test
sandbox.showToast_mock = function(message, type) {
  state.toasts.push({ message, type });
};

vm.runInContext(`
  showToast = function(message, type) {
    if (global.showToast_mock) {
      global.showToast_mock(message, type);
    }
  };
`, sandbox);

function resetState(points = []) {
  vm.runInContext(
    `surveyPoints = ${JSON.stringify(points)}`,
    sandbox
  );

  vm.runInContext(
    `tripHistory = []`,
    sandbox
  );

  state.blobs.length = 0;
  state.anchors.length = 0;
  state.revokedUrls.length = 0;
  state.toasts.length = 0;

  for (const id of Object.keys(state.elements)) {
    delete state.elements[id];
  }
}

function getLatestBlobText() {
  assert.ok(state.blobs.length > 0, 'Không có Blob nào được tạo');
  return state.blobs.at(-1).parts.join('');
}

function getLatestAnchor() {
  assert.ok(state.anchors.length > 0, 'Không có thẻ a nào được tạo');
  return state.anchors.at(-1);
}

function samplePoint(overrides = {}) {
  return {
    id: 1,
    name: 'Điểm khảo sát 1',
    category: 'school',
    trafficFlow: 'medium',
    roadCondition: 'good',
    laneCount: 2,
    description: 'Mô tả kiểm thử',
    timestamp: '2026-11-15T10:00:00.000Z',
    lat: 10.7626,
    lng: 106.6601,
    ...overrides
  };
}

// 1. getDateString
test('getDateString trả về định dạng YYYY-MM-DD', () => {
  const result = sandbox.getDateString();

  assert.match(result, /^\d{4}-\d{2}-\d{2}$/);
});

// 2. downloadFile
test('downloadFile tạo Blob, gán tên file và tải xuống', () => {
  resetState();

  sandbox.downloadFile('Nội dung kiểm thử', 'test.txt', 'text/plain');

  assert.equal(state.blobs.length, 1);
  assert.equal(getLatestBlobText(), 'Nội dung kiểm thử');
  assert.equal(state.blobs[0].options.type, 'text/plain');

  const anchor = getLatestAnchor();
  assert.equal(anchor.download, 'test.txt');
  assert.equal(anchor.clicked, true);
  assert.equal(state.revokedUrls.length, 1);
});

// 3. exportJSON
test('exportJSON không tải file khi danh sách rỗng', () => {
  resetState([]);

  sandbox.exportJSON();

  assert.equal(state.blobs.length, 0);
  assert.equal(state.toasts.at(-1).type, 'warning');
});

test('exportJSON xuất đúng dữ liệu khi có điểm khảo sát', () => {
  resetState([samplePoint()]);

  sandbox.exportJSON();

  const data = JSON.parse(getLatestBlobText());

  assert.equal(data.appName, 'ITS Survey Application');
  assert.equal(data.totalPoints, 1);
  assert.equal(data.points[0].name, 'Điểm khảo sát 1');
  assert.deepEqual(data.tripHistory, []);

  assert.equal(state.blobs[0].options.type, 'application/json');
  assert.match(getLatestAnchor().download, /^its-survey-\d{4}-\d{2}-\d{2}\.json$/);
  assert.equal(state.toasts.at(-1).type, 'success');
});

// 4. exportCSV
test('exportCSV không tải file khi danh sách rỗng', () => {
  resetState([]);

  sandbox.exportCSV();

  assert.equal(state.blobs.length, 0);
  assert.equal(state.toasts.at(-1).type, 'warning');
});

test('exportCSV xuất tiêu đề, dữ liệu và BOM UTF-8', () => {
  resetState([samplePoint()]);

  sandbox.exportCSV();

  const csv = getLatestBlobText();

  assert.ok(csv.startsWith('\ufeff'));
  assert.ok(csv.includes('ID,Tên,Loại'));
  assert.ok(csv.includes('Điểm khảo sát 1'));
  assert.ok(csv.includes('10.7626'));
  assert.equal(
    state.blobs[0].options.type,
    'text/csv;charset=utf-8'
  );
  assert.equal(state.toasts.at(-1).type, 'success');
});

test('exportCSV xử lý dấu phẩy và dấu nháy kép trong tên điểm', () => {
  resetState([
    samplePoint({
      name: 'Trường học, gần đường "ABC"'
    })
  ]);

  sandbox.exportCSV();

  const csv = getLatestBlobText();

  // CSV đúng chuẩn phải nhân đôi dấu nháy kép bên trong trường dữ liệu.
  assert.ok(
    csv.includes('"Trường học, gần đường ""ABC"""'),
    'Tên điểm chưa được escape dấu nháy kép theo CSV'
  );
});

// 5. exportGeoJSON
test('exportGeoJSON không tải file khi danh sách rỗng', () => {
  resetState([]);

  sandbox.exportGeoJSON();

  assert.equal(state.blobs.length, 0);
  assert.equal(state.toasts.at(-1).type, 'warning');
});

test('exportGeoJSON tạo FeatureCollection với tọa độ đúng thứ tự', () => {
  resetState([samplePoint()]);

  sandbox.exportGeoJSON();

  const data = JSON.parse(getLatestBlobText());

  assert.equal(data.type, 'FeatureCollection');
  assert.equal(data.features.length, 1);
  assert.equal(data.features[0].geometry.type, 'Point');
  assert.deepEqual(
    data.features[0].geometry.coordinates,
    [106.6601, 10.7626]
  );
  assert.equal(
    state.blobs[0].options.type,
    'application/geo+json'
  );
  assert.equal(state.toasts.at(-1).type, 'success');
});

// 6. exportKML
test('exportKML không tải file khi danh sách rỗng', () => {
  resetState([]);

  sandbox.exportKML();

  assert.equal(state.blobs.length, 0);
  assert.equal(state.toasts.at(-1).type, 'warning');
});

test('exportKML tạo Placemark và tọa độ cho điểm khảo sát', () => {
  resetState([samplePoint()]);

  sandbox.exportKML();

  const kml = getLatestBlobText();

  assert.ok(kml.includes('<kml'));
  assert.ok(kml.includes('<Placemark>'));
  assert.ok(kml.includes('Điểm khảo sát 1'));
  assert.ok(kml.includes('106.6601,10.7626,0'));
  assert.ok(kml.includes('</kml>'));

  assert.equal(
    state.blobs[0].options.type,
    'application/vnd.google-earth.kml+xml'
  );
});

test('exportKML sử dụng cấu hình other khi category không tồn tại', () => {
  resetState([
    samplePoint({ category: 'unknown-category' })
  ]);

  sandbox.exportKML();

  assert.ok(getLatestBlobText().includes('Khác'));
});

test('exportKML xử lý ký tự kết thúc CDATA trong mô tả', () => {
  resetState([
    samplePoint({ description: 'Nội dung thử ]]> dữ liệu' })
  ]);

  sandbox.exportKML();

  const kml = getLatestBlobText();

  // CDATA không được bị đóng sớm bởi dữ liệu đầu vào.
  assert.ok(
    !kml.includes('Nội dung thử ]]> dữ liệu'),
    'Dữ liệu chứa ]]> chưa được xử lý an toàn trong CDATA'
  );
});

// 7. generateReport
test('generateReport hiển thị báo cáo khi không có dữ liệu', () => {
  resetState([]);

  sandbox.generateReport();

  const content = state.elements.reportContent;
  const modal = state.elements.reportModal;

  assert.ok(content.innerHTML.includes('Tổng số điểm khảo sát'));
  assert.ok(content.innerHTML.includes('<td>0</td>'));
  assert.ok(modal.classList.removed.includes('hidden'));
});

test('generateReport thống kê đúng số lượng và thông tin điểm', () => {
  resetState([
    samplePoint(),
    samplePoint({
      id: 2,
      name: 'Điểm khảo sát 2',
      category: 'school',
      trafficFlow: 'high',
      lat: 10.123456,
      lng: 106.123456
    })
  ]);

  sandbox.generateReport();

  const html = state.elements.reportContent.innerHTML;

  assert.ok(html.includes('Tổng số điểm khảo sát'));
  assert.ok(html.includes('<td>2</td>'));
  assert.ok(html.includes('Điểm khảo sát 1'));
  assert.ok(html.includes('Điểm khảo sát 2'));
  assert.ok(html.includes('10.1235, 106.1235'));
  assert.ok(html.includes('Trung bình'));
  assert.ok(html.includes('Cao'));
  assert.ok(state.elements.reportModal.classList.removed.includes('hidden'));
});

test('generateReport không tăng số lượng cho traffic flow không hợp lệ', () => {
  resetState([
    samplePoint({ trafficFlow: 'unknown-flow' })
  ]);

  sandbox.generateReport();

  const html = state.elements.reportContent.innerHTML;

  assert.ok(html.includes('<td>0</td>'));
});
