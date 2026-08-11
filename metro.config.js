const { getDefaultConfig } = require("expo/metro-config");
const { withNativeWind } = require("nativewind/metro");

const config = getDefaultConfig(__dirname);

module.exports = withNativeWind(config, {
  input: "./global.css",
  // Virtual modules work reliably for Metro development and static export.
  // Set this only when diagnosing a platform-specific Metro file-system issue.
  forceWriteFileSystem: process.env.EXPO_NATIVEWIND_WRITE_FILES === "1",
});
