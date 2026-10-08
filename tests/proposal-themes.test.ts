import assert from "node:assert/strict";
import { test } from "node:test";

test("school proposal areas include broad categories while keeping recreation as one example", async () => {
  const { PROPOSAL_THEME_CHOICES, OTHER_PROPOSAL_THEME } = await import("../src/lib/proposal-themes.ts");

  assert.ok(PROPOSAL_THEME_CHOICES.includes("Ensino e aprendizagem"));
  assert.ok(PROPOSAL_THEME_CHOICES.includes("Espaços e infraestrutura"));
  assert.ok(PROPOSAL_THEME_CHOICES.includes("Convivência e bem-estar"));
  assert.ok(PROPOSAL_THEME_CHOICES.includes("Recreio e lazer"));
  assert.equal(PROPOSAL_THEME_CHOICES.at(-1), OTHER_PROPOSAL_THEME);
});

test("custom proposal area is trimmed and respects the database limit", async () => {
  const { OTHER_PROPOSAL_THEME, resolveProposalTheme } = await import("../src/lib/proposal-themes.ts");

  assert.equal(resolveProposalTheme(OTHER_PROPOSAL_THEME, "  Transporte escolar  "), "Transporte escolar");
  assert.equal(resolveProposalTheme(OTHER_PROPOSAL_THEME, "   "), null);
  assert.equal(resolveProposalTheme(OTHER_PROPOSAL_THEME, "x".repeat(81)), null);
  assert.equal(resolveProposalTheme(OTHER_PROPOSAL_THEME, "😀".repeat(40)), "😀".repeat(40));
  assert.equal(resolveProposalTheme(OTHER_PROPOSAL_THEME, "😀".repeat(41)), null);
  assert.equal(resolveProposalTheme("Recreio e lazer", "ignored"), "Recreio e lazer");
});

test("theme filters retain historical values and remove duplicates", async () => {
  const { getProposalThemeFilters, OTHER_PROPOSAL_THEME } = await import("../src/lib/proposal-themes.ts");
  const filters = getProposalThemeFilters(["Esportes", "Descanso", "Esportes"]);

  assert.ok(filters.includes("Esportes"));
  assert.ok(filters.includes("Descanso"));
  assert.equal(filters.includes(OTHER_PROPOSAL_THEME), false);
  assert.equal(filters.length, new Set(filters).size);
});
