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
    // 入力が空の場合は終了
    if (!inputData || inputData.trim() === "") {
      process.exit(0);
    }

    const data = JSON.parse(inputData);

    // ファイルパスを取得（複数の形式に対応）
    let filePath = null;

    // 直接file_pathがある場合
    if (data.file_path) {
      filePath = data.file_path;
    }
    // tool_input内にある場合
    else if (data.tool_input && data.tool_input.file_path) {
      filePath = data.tool_input.file_path;
    }
    // tool_input内にtarget_fileがある場合
    else if (data.tool_input && data.tool_input.target_file) {
      filePath = data.tool_input.target_file;
    }
    // inputにある場合
    else if (data.input && data.input.file_path) {
      filePath = data.input.file_path;
    }

    if (!filePath) {
      // ファイルパスが見つからない場合は静かに終了
      process.exit(0);
    }

    // 対象ファイル拡張子
    const targetExtensions = [".js", ".jsx", ".ts", ".tsx", ".mjs", ".cjs"];
    const ext = path.extname(filePath).toLowerCase();

    if (!targetExtensions.includes(ext)) {
      process.exit(0);
    }

    // .claudeディレクトリ内のファイルはスキップ
    if (filePath.includes(".claude")) {
      process.exit(0);
    }

    const projectDir = process.env.CLAUDE_PROJECT_DIR || process.cwd();

    // Prettierでフォーマット
    try {
      execSync(`npx prettier --write "${filePath}"`, {
        stdio: "pipe",
        cwd: projectDir,
      });
    } catch (e) {
      // Prettierエラーは無視
    }

    // ESLintでチェック＆修正
    try {
      execSync(`npx eslint --fix "${filePath}"`, {
        stdio: "pipe",
        cwd: projectDir,
      });
    } catch (e) {
      // ESLintエラーは無視（エラーがあってもプロセスは正常終了）
    }

    process.exit(0);
  } catch (e) {
    // JSONパースエラーなどは静かに終了
    process.exit(0);
  }
});

// タイムアウト（5秒後に強制終了）
setTimeout(() => {
  process.exit(0);
}, 5000);
