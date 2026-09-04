import type { Metadata, Viewport } from "next";
import "@fontsource-variable/archivo";
import "@fontsource-variable/manrope";
import "./globals.css";

export const metadata: Metadata = {
  title: "Grêmio Comunica Farroupilha | O recreio também é seu",
  description:
    "Uma proposta para aproximar estudantes e GEF: ouvir ideias, pensar o lazer e acompanhar mudanças no recreio do Colégio Farroupilha.",
  openGraph: {
    title: "O recreio também é seu. | Grêmio Comunica Farroupilha",
    description: "Mais escuta. Mais participação. Um recreio com a nossa cara.",
    locale: "pt_BR",
    type: "website",
  },
  icons: { icon: "/brand/gremio-comunica.webp", apple: "/brand/gremio-comunica.webp" },
};

export const viewport: Viewport = { themeColor: "#153d66" };

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="pt-BR"><body>{children}</body></html>;
}
