/** @type {import('jest').Config} */
module.exports = {
  preset: "jest-expo",
  testMatch: [
    "**/__tests__/**/*.(test|spec).[tj]s?(x)",
    "**/?(*.)+(test|spec).[tj]s?(x)",
  ],
  setupFilesAfterEnv: ["<rootDir>/jest.setup.ts"],
  transformIgnorePatterns: [
    "node_modules/(?!(jest-)?react-native|@react-native(-community)?/|@react-navigation/.*|expo(nent)?|@expo(nent)?/.*|@expo-google-fonts/.*|@expo/vector-icons|expo-router|expo-font|expo-asset|expo-constants|expo-crypto|expo-haptics|expo-image|expo-linking|expo-network|expo-splash-screen|expo-status-bar|expo-symbols|expo-system-ui|expo-web-browser|react-native-safe-area-context|react-native-screens|react-native-gesture-handler|react-native-reanimated|react-native-web|react-native-worklets)",
  ],
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/$1",
  },
  collectCoverageFrom: [
    "src/**/*.{ts,tsx}",
    "components/**/*.{ts,tsx}",
    "app/word/**/*.{ts,tsx}",
    "!**/*.d.ts",
    "!**/__tests__/**",
    "!src/data/**",
  ],
  coveragePathIgnorePatterns: [
    "/node_modules/",
    "/coverage/",
    "/.expo/",
    "expo-env\\.d\\.ts",
    "babel.config.js",
    "jest.config.js",
    "/app/word/\\[wordId\\]\\.tsx",
    "/components/StatusPill\\.tsx",
    "/components/StatusSelector\\.tsx",
    "/components/WordRow\\.tsx",
    "/src/domain/types\\.ts",
  ],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 88,
      lines: 90,
      statements: 90,
    },
  },
};
