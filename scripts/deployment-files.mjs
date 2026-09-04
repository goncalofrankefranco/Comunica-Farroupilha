// Emit only the files needed to build this site via Vercel's deployment API.
// No local credentials, original assets, temporary files or design tooling.
import fs from "node:fs";
import path from "node:path";

const rootFiles = ["package.json", "pnpm-lock.yaml", "pnpm-workspace.yaml", "tsconfig.json", "next.config.ts", "eslint.config.mjs", "vercel.json"];
function walk(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((item) => {
    const file = path.posix.join(dir, item.name);
    return item.isDirectory() ? walk(file) : [file];
  });
}
const files = [...rootFiles, ...walk("src"), ...walk("public")].map((file) => {
  const binary = /\.(png|jpe?g|webp|woff2?)$/.test(file);
  return { file, data: fs.readFileSync(file, binary ? "base64" : "utf8"), encoding: binary ? "base64" : "utf-8" };
});
process.stdout.write(JSON.stringify(files));
