const AUTH_ERRORS: Record<string, string> = {
  "google-unavailable": "O acesso com Google ainda não está configurado.",
  "google-expired": "A tentativa de acesso expirou. Tente novamente.",
  "google-domain": "Use uma conta escolar verificada @farroups.com.br.",
  "google-failed": "Não foi possível entrar com o Google.",
  "legacy-link-expired": "O vínculo expirou ou a conta antiga não pode ser recuperada. Tente novamente.",
  "legacy-link-conflict": "Essa conta Google já está associada a outra conta. Procure o GEF para ajuda.",
  "legacy-link-unavailable": "Não foi possível concluir o vínculo agora. Tente novamente mais tarde.",
};

export function getAuthErrorMessage(code: string) {
  return Object.prototype.hasOwnProperty.call(AUTH_ERRORS, code) ? AUTH_ERRORS[code] : "";
}
