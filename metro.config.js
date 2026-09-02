const path = require("path");
const { getDefaultConfig } = require("expo/metro-config");

const config = getDefaultConfig(__dirname);

// web/ klasörü ayrı bir Vite projesi (X-NETIC web yönetim paneli) —
// kendi node_modules'ı çok kalabalık, Metro'nun onu izlemesine gerek yok.
const webDir = path.join(__dirname, "web").replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
config.resolver.blockList = [new RegExp(`^${webDir}[/\\\\].*`)];

module.exports = config;
