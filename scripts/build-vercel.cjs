/**
 * Build step for Vercel static output.
 * Creates dist/ with the exact runtime files used by the site.
 */
const fs = require("node:fs");
const path = require("node:path");

const ROOT_DIR = path.resolve(__dirname, "..");
const DIST_DIR = path.join(ROOT_DIR, "dist");
const REQUIRED_PATHS = ["index.html", "src", "public"];

function assertExists(targetPath) {
  if (!fs.existsSync(targetPath)) {
    throw new Error(`Missing required path: ${targetPath}`);
  }
}

function copyIntoDist(relativePath) {
  const source = path.join(ROOT_DIR, relativePath);
  const destination = path.join(DIST_DIR, relativePath);
  assertExists(source);
  fs.cpSync(source, destination, { recursive: true });
}

function runBuild() {
  fs.rmSync(DIST_DIR, { recursive: true, force: true });
  fs.mkdirSync(DIST_DIR, { recursive: true });

  REQUIRED_PATHS.forEach(copyIntoDist);

  console.log("Build pronto em dist/");
}

runBuild();
