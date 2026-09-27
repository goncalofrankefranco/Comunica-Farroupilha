const AUTH_ERRORS: Record<string, string> = {
  "google-unavailable": "O acesso com Google ainda não está configurado.",
  "google-expired": "A tentativa de acesso expirou. Tente novamente.",
  "google-domain": "Use uma conta escolar verificada @farroups.com.br.",
  "google-failed": "Não foi possível entrar com o Google.",
};

export function getAuthErrorMessage(code: string) {
  return Object.prototype.hasOwnProperty.call(AUTH_ERRORS, code) ? AUTH_ERRORS[code] : "";
}
