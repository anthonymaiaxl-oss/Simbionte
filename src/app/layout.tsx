import type { Metadata } from "next";
import {
  Archivo,
  DM_Sans,
  Fira_Code,
  Gabarito,
  Space_Mono,
} from "next/font/google";
import "./globals.css";

/**
 * Sem `weight` de propósito: Gabarito e DM Sans são fontes variáveis.
 * Pedir pesos fixos faz o Next gerar um arquivo estático por peso e por
 * conjunto de caracteres — foi o que quebrou o build da Vercel, com um
 * erro por arquivo. No eixo variável é um arquivo só, e todos os pesos
 * continuam disponíveis.
 */
const gabarito = Gabarito({
  variable: "--fonte-gabarito",
  subsets: ["latin"],
  display: "swap",
});

/**
 * Archivo: grotesca de desenho quadrado, para o letreiro da passagem.
 *
 * DM Sans e Gabarito sao geometricas de curva aberta — em caixa alta e
 * corpo grande elas ficam macias e sem peso. Archivo tem o contorno
 * reto que da o impacto ali.
 *
 * Sem `weight`, pelo mesmo motivo das outras: e variavel, e pedir peso
 * fixo faz o Next gerar um arquivo por peso e por conjunto de
 * caracteres — foi o que quebrou o build da Vercel uma vez.
 */
const archivo = Archivo({
  variable: "--fonte-archivo",
  subsets: ["latin"],
  display: "swap",
});

const dmSans = DM_Sans({
  variable: "--fonte-dm-sans",
  subsets: ["latin"],
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
      <head>
        {/* Começa a baixar o quadro visível do robô junto com o HTML, em
            vez de esperar o React montar para só então pedir. */}
        <link
          rel="preload"
          as="image"
          href="/robo/verde/frame_030.webp"
          type="image/webp"
          fetchPriority="high"
        />
      </head>
      <body
        className={`${archivo.variable} ${gabarito.variable} ${dmSans.variable} ${firaCode.variable} ${spaceMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
