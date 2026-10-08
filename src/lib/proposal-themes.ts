export const OTHER_PROPOSAL_THEME = "Outro assunto";

export const PROPOSAL_THEME_CHOICES = [
  "Ensino e aprendizagem",
  "Espaços e infraestrutura",
  "Convivência e bem-estar",
  "Cultura, eventos e esportes",
  "Sustentabilidade e meio ambiente",
  "Comunicação e participação",
  "Recreio e lazer",
  OTHER_PROPOSAL_THEME,
] as const;

const LEGACY_PROPOSAL_THEMES = ["Esportes", "Jogos de mesa", "Música e cultura", "Convivência", "Descanso", "Outros"];

export function resolveProposalTheme(theme: string, customTheme: string) {
  const value = (theme === OTHER_PROPOSAL_THEME ? customTheme : theme).trim();
  return value.length > 0 && value.length <= 80 ? value : null;
}

export function getProposalThemeFilters(existingThemes: readonly string[]) {
  return [...new Set([
    ...PROPOSAL_THEME_CHOICES.filter((theme) => theme !== OTHER_PROPOSAL_THEME),
    ...LEGACY_PROPOSAL_THEMES,
    ...existingThemes.map((theme) => theme.trim()).filter(Boolean),
  ])];
}
