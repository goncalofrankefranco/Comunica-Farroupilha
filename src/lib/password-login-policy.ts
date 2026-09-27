export function canUsePasswordLogin(role: string, studentPasswordFallbackEnabled: boolean) {
  return role === "gef" || (role === "student" && studentPasswordFallbackEnabled);
}
