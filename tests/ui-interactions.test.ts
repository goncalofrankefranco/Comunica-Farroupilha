import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

const shellSource = readFileSync("src/components/gefshell.tsx", "utf8");
const stylesSource = readFileSync("src/app/globals.css", "utf8");

test("proposal card keeps action controls outside an interactive card button", () => {
  assert.match(shellSource, /<div\s+className="proposal-card-main"/s);
  assert.match(shellSource, /<button type="button" className="proposal-card-select"/s);
  assert.doesNotMatch(shellSource, /<button\s+className="proposal-card-main"/s);
  assert.match(shellSource, /<button type="button" className=\{`support-button/);
});

test("tactile press feedback is scoped to controls instead of every button", () => {
  assert.match(stylesSource, /\.tactile-control:active:not\(:disabled\)/);
  assert.doesNotMatch(stylesSource, /button:active:not\(:disabled\)\{transform/);
});

test("new proposal panel has an intentional materialized entrance", () => {
  assert.match(stylesSource, /@keyframes composer-panel-in/);
  assert.match(stylesSource, /\.composer-panel[^}]*animation:[^;}]*composer-panel-in/);
});

test("app selection controls use the rounded listbox component", () => {
  assert.match(shellSource, /<SelectMenu/);
  assert.match(readFileSync("src/components/select-menu.tsx", "utf8"), /role="listbox"/);
  assert.match(readFileSync("src/components/select-menu.tsx", "utf8"), /aria-expanded/);
});

test("comment count is an action that opens the proposal detail", () => {
  assert.match(shellSource, /<button type="button" className="comment-count tactile-control"/);
  assert.match(shellSource, /className="comment-count tactile-control"[^>]*onClick=\{[^}]*onSelect\(\);/);
  assert.doesNotMatch(shellSource, /<span className="comment-count"/);
});

test("tactile controls have a visible press and commit response", () => {
  assert.match(stylesSource, /\.tactile-control:active:not\(:disabled\)\{transform:translateY\(1px\) scale\(\.94\)/);
  assert.match(stylesSource, /@keyframes control-commit/);
  assert.match(stylesSource, /\.tactile-control\.is-committing[^}]*animation:[^;}]*control-commit/);
});

test("proposal comments detail has a smooth card-attached entrance", () => {
  assert.match(stylesSource, /@keyframes proposal-detail-in/);
  assert.match(stylesSource, /\.detail-grid[^}]*animation:[^;}]*proposal-detail-in/);
});
