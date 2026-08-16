/**
 * Constantes da autenticação.
 *
 * Ficam fora do arquivo de Server Actions porque um arquivo marcado com
 * "use server" só pode exportar funções async — exportar um objeto dali
 * quebra o build.
 */

/**
 * Credencial provisória, enquanto o Supabase não existe.
 *
 * ATENÇÃO: qualquer pessoa com o link e esta senha entra. Não coloque
 * conversa real de cliente no painel antes de trocar por autenticação
 * de verdade.
 */
export const ACESSO = {
  email: "admin@simbionte.app",
  senha: "simbionte2026",
};

export const COOKIE_SESSAO = "simbionte-sessao";

export type EstadoLogin = { erro: string | null };
