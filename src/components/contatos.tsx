"use client";

import { useMemo, useState } from "react";
import { Chips } from "@/components/chips";
import { CONTATOS } from "@/lib/dados-painel";

/**
 * Quem já falou com o agente.
 *
 * Tabela de verdade, não lista de cartões: aqui a pessoa compara linhas
 * — quem falou mais, quem sumiu — e comparação pede colunas alinhadas.
 * Cartão é bom para ler um item; tabela, para varrer muitos.
 */

type Ordem = "recente" | "conversas" | "nome";

const ORDENS: { id: Ordem; rotulo: string }[] = [
  { id: "recente", rotulo: "Mais recentes" },
  { id: "conversas", rotulo: "Mais conversas" },
  { id: "nome", rotulo: "Nome" },
];

export function Contatos() {
  const [busca, setBusca] = useState("");
  const [ordem, setOrdem] = useState<Ordem>("recente");

  const lista = useMemo(() => {
    const termo = busca.trim().toLowerCase();
    const digitos = termo.replace(/\D/g, "");

    return CONTATOS.filter((c) => {
      if (!termo) return true;
      return (
        c.nome.toLowerCase().includes(termo) ||
        (digitos.length > 0 && c.telefone.replace(/\D/g, "").includes(digitos))
      );
    }).sort((a, b) => {
      if (ordem === "nome") return a.nome.localeCompare(b.nome, "pt-BR");
      if (ordem === "conversas") return b.conversas - a.conversas;
      // "recente" já é a ordem em que os dados chegam
      return 0;
    });
  }, [busca, ordem]);

  return (
    <div id="painel-contatos" role="tabpanel">
      <div className="filtros">
        <Chips
          itens={ORDENS}
          atual={ordem}
          aoTrocar={setOrdem}
          grupo="ordem"
          rotuloGrupo="Ordenar por"
        />

        <label htmlFor="busca-contatos" className="sr-only">
          Buscar contato por nome ou número
        </label>
        <input
          id="busca-contatos"
          type="search"
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          placeholder="Buscar por nome ou número…"
          className="busca"
        />
      </div>

      {lista.length === 0 ? (
        <p className="vazio">
          Nenhum contato encontrado.{" "}
          <button
            type="button"
            onClick={() => setBusca("")}
            className="vazio__acao"
          >
            Limpar busca
          </button>
        </p>
      ) : (
        <div className="tabela__caixa">
          {/* A tabela rola dentro do próprio container: a página nunca
              rola de lado. */}
          <table className="tabela">
            <thead>
              <tr>
                <th scope="col">Nome</th>
                <th scope="col">WhatsApp</th>
                <th scope="col">Conversas</th>
                <th scope="col">Último contato</th>
                <th scope="col">Etiquetas</th>
              </tr>
            </thead>
            <tbody>
              {lista.map((c, i) => (
                <tr key={c.id} style={{ ["--ordem" as string]: Math.min(i, 10) }}>
                  <td className="tabela__nome">{c.nome}</td>
                  <td className="tabela__mono">{c.telefone}</td>
                  <td className="tabela__mono">{c.conversas}</td>
                  <td className="tabela__mono">{c.ultimoContato}</td>
                  <td>
                    <span className="etiquetas">
                      {c.etiquetas.map((e) => (
                        <span key={e} className="etiqueta">
                          {e}
                        </span>
                      ))}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
