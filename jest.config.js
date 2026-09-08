/** @type {import('jest').Config} */
module.exports = {
  preset: "ts-jest",
  testEnvironment: "node",
  roots: ["<rootDir>/packages", "<rootDir>/services"],
  testPathIgnorePatterns: ["/node_modules/", "/dist/"],
  testMatch: ["**/*.test.ts"],
  moduleNameMapper: {
    "^@locaguide/shared$": "<rootDir>/packages/shared/src/index.ts",
    "^@locaguide/config$": "<rootDir>/packages/config/src/index.ts",
    "^@locaguide/contracts$": "<rootDir>/packages/contracts/src/index.ts",
    "^@locaguide/db$": "<rootDir>/packages/db/src/index.ts",
    "^@locaguide/providers$": "<rootDir>/packages/providers/src/index.ts",
    "^@locaguide/domain$": "<rootDir>/packages/domain/src/index.ts",
    "^@locaguide/runtime$": "<rootDir>/packages/runtime/src/index.ts",
  },
  transform: {
    "^.+\\.ts$": ["ts-jest", { tsconfig: "<rootDir>/tsconfig.jest.json" }],
  },
  collectCoverageFrom: ["packages/*/src/**/*.ts", "services/*/src/**/*.ts", "!**/*.test.ts", "!**/index.ts"],
};
