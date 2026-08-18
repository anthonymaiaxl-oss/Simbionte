import { NextResponse, type NextRequest } from "next/server";
import { COOKIE_SESSAO } from "@/lib/auth";

/**
 * Protege o painel.
 *
 * Sem sessão, qualquer rota cai em /entrar. Com sessão, /entrar devolve
 * para o painel — quem já entrou não precisa ver a tela de login de novo.
 */
export function proxy(request: NextRequest) {
  const temSessao = request.cookies.has(COOKIE_SESSAO);
  const caminho = request.nextUrl.pathname;

  if (caminho === "/entrar") {
    if (!temSessao) return NextResponse.next();
    const destino = request.nextUrl.clone();
    destino.pathname = "/";
    return NextResponse.redirect(destino);
  }

  if (!temSessao) {
    // API responde 401, nunca redireciona. Um fetch() que segue o
    // redirecionamento recebe o HTML da tela de entrada e estoura ao
    // tentar ler JSON — o erro que aparece é "Unexpected token '<'", que
    // não diz nada sobre sessão expirada.
    if (caminho.startsWith("/api/")) {
      return NextResponse.json(
        { erro: "Sessão expirada. Entre de novo." },
        { status: 401 },
      );
    }

    const destino = request.nextUrl.clone();
    destino.pathname = "/entrar";
    return NextResponse.redirect(destino);
  }

  return NextResponse.next();
}

export const config = {
  // Deixa passar arquivos estáticos e os quadros do robô: bloquear
  // imagem só faria a tela de entrada carregar quebrada.
  matcher: ["/((?!_next/static|_next/image|robo/|favicon.ico).*)"],
};
