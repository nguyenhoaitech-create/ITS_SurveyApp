/** @type {CodeceptJS.MainConfig} */
export const config = {
  tests: "./tests/*_test.js",
  output: "./output",
  helpers: {
    Playwright: {
      browser: "chromium",
      url: process.env.TEST_BASE_URL || "http://localhost:8080",
      show: false,
      channel: process.env.PLAYWRIGHT_CHANNEL || undefined,
    },
  },
  include: {
    I: "./steps_file.js",
  },
  noGlobals: false,
  plugins: {},
  name: "DA_ITS",
};
