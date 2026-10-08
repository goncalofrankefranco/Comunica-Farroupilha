import type { Metadata, Viewport } from "next";
import "@fontsource-variable/archivo";
import "@fontsource-variable/manrope";
import "./globals.css";

export const metadata: Metadata = {
  title: "Comunica Farroupilha | Ideias para uma escola melhor",
  description:
    "Um espaço para estudantes e GEF compartilharem propostas sobre aprendizagem, espaços, convivência, atividades e outras áreas da vida escolar.",
  openGraph: {
    title: "Ideias para uma escola melhor | Comunica Farroupilha",
    description: "Proponha, acompanhe e construa melhorias em diferentes áreas da vida escolar.",
    locale: "pt_BR",
    type: "website",
  },
  icons: { icon: "/brand/gremio-comunica.webp", apple: "/brand/gremio-comunica.webp" },
};

export const viewport: Viewport = { themeColor: "#153d66" };

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="pt-BR"><body>{children}</body></html>;
}
