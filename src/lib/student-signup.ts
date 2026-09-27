export type StudentSignupInput = {
  name: string;
  turma: string;
  password: string;
};

export function parseStudentSignup(value: unknown): StudentSignupInput | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const body = value as Record<string, unknown>;
  if (typeof body.name !== "string" || typeof body.turma !== "string" || typeof body.password !== "string") return null;

  const name = body.name.trim();
  const turma = body.turma.trim();
  const password = body.password;
  if (!name || name.length > 160 || !turma || turma.length > 80 || password.length < 8 || password.length > 256) return null;

  return { name, turma, password };
}
