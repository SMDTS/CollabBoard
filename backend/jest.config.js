export default {
  testEnvironment: "node",
  transform: {},
  testMatch: ["**/tests/**/*.test.js"],
  collectCoverageFrom: ["src/**/*.js", "!src/server.js"],
  testTimeout: 30000, // first run downloads the ~780MB Mongo binary; cached after that
};