"use client";

import { useEffect, useRef, useState } from "react";
import { sair } from "@/app/acoes-auth";

/**
 * Quem está usando o painel, no canto superior direito.
 *
 * Antes ali havia só um botão "Sair" solto, e nada dizia com qual conta
 * você estava. Num painel que vai atender várias óticas, saber isso deixa
 * de ser enfeite: a pessoa precisa ver de quem é a sessão antes de mexer
 * em conversa de cliente.
 *
 * Os dados vêm da tabela `usuarios` do n8n, pela sessão — o servidor lê o
 * cookie e passa para cá. Nada é buscado pelo navegador.
 */

export function ContaUsuario({
  email,
  nome,
  empresa,
}: {
  email: string;
  nome?: string;
  empresa?: string;
}) {
  const [aberto, setAberto] = useState(false);
  const caixa = useRef<HTMLDivElement>(null);

  // Clique fora e Esc fecham. Menu que só fecha no próprio botão prende a
  // pessoa quando ela já olhou para outro canto da tela.
  useEffect(() => {
    if (!aberto) return;

    const aoClicar = (e: MouseEvent) => {
      if (caixa.current && !caixa.current.contains(e.target as Node)) {
        setAberto(false);
      }
    };
    const aoTeclar = (e: KeyboardEvent) => {
      if (e.key === "Escape") setAberto(false);
    };

    document.addEventListener("mousedown", aoClicar);
    document.addEventListener("keydown", aoTeclar);
    return () => {
      document.removeEventListener("mousedown", aoClicar);
      document.removeEventListener("keydown", aoTeclar);
    };
  }, [aberto]);

  const rotulo = nome?.trim() || email;

  // Iniciais em vez de foto: não existe upload de avatar ainda, e um
  // círculo cinza vazio comunica menos que duas letras.
  const iniciais = rotulo
    .split(/[\s@.]+/)
    .filter((p) => p.length > 1)
    .slice(0, 2)
    .map((p) => p[0])
    .join("")
    .toUpperCase();

  return (
    <div className="conta" ref={caixa}>
      <button
        type="button"
        onClick={() => setAberto((v) => !v)}
        aria-expanded={aberto}
        aria-haspopup="menu"
        className="conta__gatilho"
      >
        <span className="conta__avatar" aria-hidden="true">
          {iniciais || "?"}
        </span>
        <span className="conta__quem">
          <span className="conta__nome">{rotulo}</span>
          {empresa && <span className="conta__empresa">{empresa}</span>}
        </span>
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={`conta__seta ${aberto ? "conta__seta--aberta" : ""}`}
          aria-hidden="true"
        >
          <path d="M6 9l6 6 6-6" />
        </svg>
      </button>

      {aberto && (
        <div className="conta__menu" role="menu">
          <div className="conta__cabeca">
            <span className="conta__avatar conta__avatar--grande" aria-hidden="true">
              {iniciais || "?"}
            </span>
            <span className="conta__detalhe">
              {nome && <strong className="conta__nome">{nome}</strong>}
              <span className="conta__email">{email}</span>
              {empresa && <span className="conta__empresa">{empresa}</span>}
            </span>
          </div>

          <form action={sair}>
            <button type="submit" role="menuitem" className="conta__sair">
              Sair da conta
            </button>
          </form>

          {/* Trocar de conta é sair e entrar de novo: não há sessão
              paralela para alternar entre elas. Dizer isso evita a pessoa
              procurar um botão que não existe. */}
          <p className="conta__nota">
            Para entrar com outra conta, saia e faça login de novo.
          </p>
        </div>
      )}
    </div>
  );
}
