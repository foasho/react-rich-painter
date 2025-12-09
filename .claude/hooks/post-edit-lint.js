#!/usr/bin/env node
/**
 * Claude Code Post-Edit Hook
 * ファイル編集後にESLintとPrettierを実行する
 */

const { execSync } = require("child_process");
const path = require("path");

// 標準入力からJSONを読み取る
let inputData = "";

process.stdin.setEncoding("utf8");

process.stdin.on("data", (chunk) => {
  inputData += chunk;
});

process.stdin.on("end", () => {
  try {
    const data = JSON.parse(inputData);
    const filePath = data.file_path;

    if (!filePath) {
      console.log("No file path provided");
      process.exit(0);
    }

    // 対象ファイル拡張子
    const targetExtensions = [".js", ".jsx", ".ts", ".tsx", ".mjs", ".cjs"];
    const ext = path.extname(filePath).toLowerCase();

    if (!targetExtensions.includes(ext)) {
      console.log(`Skipping non-JS/TS file: ${filePath}`);
      process.exit(0);
    }

    console.log(`Running lint and format on: ${filePath}`);

    // Prettierでフォーマット
    try {
      execSync(`npx prettier --write "${filePath}"`, {
        stdio: "inherit",
        cwd: process.env.CLAUDE_PROJECT_DIR || process.cwd(),
      });
      console.log("Prettier: OK");
    } catch (e) {
      console.error("Prettier failed:", e.message);
    }

    // ESLintでチェック＆修正
    try {
      execSync(`npx eslint --fix "${filePath}"`, {
        stdio: "inherit",
        cwd: process.env.CLAUDE_PROJECT_DIR || process.cwd(),
      });
      console.log("ESLint: OK");
    } catch (e) {
      // ESLintはエラーがあっても続行（エラーはClaudeに報告される）
      console.error("ESLint found issues:", e.message);
    }
  } catch (e) {
    console.error("Hook error:", e.message);
    process.exit(1);
  }
});

