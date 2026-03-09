import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.join(__dirname, "..");

// Source: WASM file from node_modules
const sourceWasm = path.join(
  rootDir,
  "node_modules",
  "sql.js",
  "dist",
  "sql-wasm.wasm",
);

// Destination: public/lib folder
const destDir = path.join(rootDir, "public", "lib");
const destWasm = path.join(destDir, "sql-wasm.wasm");

// Create destination directory if it doesn't exist
if (!fs.existsSync(destDir)) {
  fs.mkdirSync(destDir, { recursive: true });
  console.log(`✓ Created directory: ${destDir}`);
}

// Copy WASM file
if (fs.existsSync(sourceWasm)) {
  fs.copyFileSync(sourceWasm, destWasm);
  console.log(`✓ Copied sql-wasm.wasm to ${destWasm}`);
} else {
  console.error(`✗ Source WASM file not found: ${sourceWasm}`);
  process.exit(1);
}
