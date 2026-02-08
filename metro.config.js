const { getDefaultConfig } = require("expo/metro-config");

const config = getDefaultConfig(__dirname);

const envBlockList = /[\\/]\.env(\..*)?$/;

config.resolver = config.resolver || {};
config.resolver.blockList = config.resolver.blockList
  ? new RegExp(`${config.resolver.blockList.source}|${envBlockList.source}`)
  : envBlockList;

module.exports = config;
