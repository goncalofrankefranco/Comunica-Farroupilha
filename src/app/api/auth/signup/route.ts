export const dynamic = "force-dynamic";

export async function POST() {
  return Response.json(
    { error: "A criação de contas por senha foi desativada. Entre com uma conta Google escolar @farroups.com.br." },
    { status: 410 },
  );
}
