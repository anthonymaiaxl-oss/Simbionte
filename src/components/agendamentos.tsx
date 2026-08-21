"use client";

import { useMemo, useState } from "react";
import { FileText, FileX, FlaskConical } from "lucide-react";
import { Chips } from "@/components/chips";
import type { Agendamento } from "@/lib/dados-painel";

/**
 * Agendamentos fechados pela IA, esperando a conferência na loja.
 *
 * É a tela de trabalho da colaboradora: ela abre, vê quem vem hoje, qual
 * lente foi escolhida e abre a receita para conferir se o grau bate.
 *
 * Por isso a ordem é por horário e não por urgência, ao contrário das
 * conversas: aqui o que organiza o dia é a agenda, não quem gritou mais
 * alto.
 */

const FILTROS: { id: Agendamento["status"] | "todos"; rotulo: string }[] = [
  { id: "todos", rotulo: "Todos" },
  { id: "aguardando", rotulo: "Aguardando conferência" },
  { id: "conferido", rotulo: "Conferidos" },
  { id: "ajustado", rotulo: "Com ajuste" },
];

const SELO: Record<Agendamento["status"], { rotulo: string; cor: string }> = {
  aguardando: { rotulo: "Aguardando", cor: "var(--color-alerta)" },
  conferido: { rotulo: "Conferido", cor: "var(--color-simbionte-claro)" },
  ajustado: { rotulo: "Ajustado", cor: "var(--color-pulso)" },
};

export function Agendamentos({
  agendamentos,
  exemplo,
}: {
  agendamentos: Agendamento[];
  exemplo?: boolean;
}) {
  const [filtro, setFiltro] = useState<Agendamento["status"] | "todos">("todos");
  const [busca, setBusca] = useState("");

  const lista = useMemo(() => {
    const termo = busca.trim().toLowerCase();
    const digitos = termo.replace(/\D/g, "");

    return agendamentos.filter((a) => {
      if (filtro !== "todos" && a.status !== filtro) return false;
      if (!termo) return true;
      return (
        a.nome.toLowerCase().includes(termo) ||
        (digitos.length > 0 && a.telefone.replace(/\D/g, "").includes(digitos))
      );
    });
  }, [agendamentos, filtro, busca]);

  const filtrosComConta = useMemo(
    () =>
      FILTROS.map((f) => ({
        ...f,
        conta:
          f.id === "todos"
            ? agendamentos.length
            : agendamentos.filter((a) => a.status === f.id).length,
      })),
    [agendamentos],
  );

  return (
    <div id="painel-agendamentos" role="tabpanel">
      {exemplo && (
        <p className="agenda__exemplo">
          <FlaskConical size={15} />
          Estes agendamentos são de exemplo. O fluxo do n8n ainda não
          envia a agenda de verdade.
        </p>
      )}

      <div className="filtros">
        <Chips
          itens={filtrosComConta}
          atual={filtro}
          aoTrocar={setFiltro}
          grupo="agendamento"
          rotuloGrupo="Filtrar agendamentos"
        />

        <label htmlFor="busca-agendamentos" className="sr-only">
          Buscar agendamento por nome ou número
        </label>
        <input
          id="busca-agendamentos"
          type="search"
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          placeholder="Buscar por nome ou número…"
          className="busca"
        />
      </div>

      {lista.length === 0 ? (
        <p className="vazio">
          {agendamentos.length === 0
            ? "Nenhum agendamento ainda. Quando a IA fechar um, ele aparece aqui."
            : "Nenhum agendamento com esse filtro."}
        </p>
      ) : (
        <ul className="agenda">
          {lista.map((a, i) => (
            <Cartao key={a.id} agendamento={a} indice={i} />
          ))}
        </ul>
      )}
    </div>
  );
}

function Cartao({
  agendamento: a,
  indice,
}: {
  agendamento: Agendamento;
  indice: number;
}) {
  const selo = SELO[a.status];

  return (
    <li className="agenda__item" style={{ ["--ordem" as string]: indice }}>
      <div className="agenda__topo">
        <span className="agenda__quem">
          <span className="conversa__nome">{a.nome}</span>
          <span className="conversa__telefone">{a.telefone}</span>
        </span>

        <span className="agenda__marcas">
          <span className="agenda__quando">{a.quando}</span>
          {/* Cor com rótulo junto: estado nunca só por cor. */}
          <span
            className="conversa__selo"
            style={{ color: selo.cor, borderColor: selo.cor }}
          >
            {selo.rotulo}
          </span>
        </span>
      </div>

      <div className="agenda__lente">
        <span className="agenda__lente-nome">{a.lente}</span>
        {a.tratamentos.map((t) => (
          <span key={t} className="etiqueta">
            {t}
          </span>
        ))}
        <span className="agenda__preco">{a.preco}</span>
      </div>

      {/* O grau em fonte de máquina: é dado para conferir caractere a
          caractere, não texto para ler corrido. */}
      <p className="agenda__grau">{a.grau}</p>

      {a.observacao && <p className="agenda__obs">{a.observacao}</p>}

      {a.receitaUrl ? (
        <a
          href={a.receitaUrl}
          target="_blank"
          rel="noreferrer"
          className="agenda__receita"
        >
          <FileText size={15} />
          Ver receita
        </a>
      ) : (
        /* Sem arquivo, a tela DIZ que não tem — em vez de mostrar um botão
           que não leva a lugar nenhum e faz a pessoa clicar duas vezes
           achando que travou. */
        <span className="agenda__receita agenda__receita--sem">
          <FileX size={15} />
          Receita ainda não arquivada
        </span>
      )}
    </li>
  );
}
