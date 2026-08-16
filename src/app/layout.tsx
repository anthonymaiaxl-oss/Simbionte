import type { Metadata } from "next";
import { DM_Sans, Fira_Code, Gabarito, Space_Mono } from "next/font/google";
import "./globals.css";

const gabarito = Gabarito({
  variable: "--fonte-gabarito",
  subsets: ["latin"],
  weight: ["500", "600", "700", "800"],
  display: "swap",
});

const dmSans = DM_Sans({
  variable: "--fonte-dm-sans",
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  display: "swap",
});

const firaCode = Fira_Code({
  variable: "--fonte-fira-code",
  subsets: ["latin"],
  weight: ["400", "500"],
  display: "swap",
});

/**
 * Só para os números do fundo. A Fira Code é a mono padrão de editor —
 * lê como "código", que é justamente o genérico que não serve aqui. A
 * Space Mono tem numerais com terminais marcados e desenho próprio:
 * lê como painel de instrumento, e aguenta os corpos grandes.
 */
const spaceMono = Space_Mono({
  variable: "--fonte-space-mono",
  subsets: ["latin"],
  weight: ["400", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Simbionte — o agente que atende seu WhatsApp",
  description:
    "Um agente que responde no WhatsApp da sua empresa o dia inteiro e passa para a equipe quando a conversa precisa de gente.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-BR">
      <body
        className={`${gabarito.variable} ${dmSans.variable} ${firaCode.variable} ${spaceMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
