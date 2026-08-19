/**
 * A dobra entre a Hero e o painel, tratada como a borda de uma lente.
 *
 * O corte seco entre as duas seções era o que incomodava: a Hero termina,
 * o painel começa, e no meio ficava uma linha morta.
 *
 * Aqui essa linha vira o lugar onde a luz atravessa. O desenho vem do
 * ofício de quem vai usar isto — uma ótica: um arco bem achatado, como o
 * bordo de uma lente vista de perfil, e um brilho que percorre esse bordo
 * devagar, do jeito que a luz corre na curvatura do vidro.
 *
 * Componente de servidor, sem JavaScript: é SVG e CSS. A animação é só
 * transform e opacity, então não custa layout.
 */
export function DobraLente() {
  return (
    <div className="dobra" aria-hidden="true">
      {/* O arco. `vectorEffect` mantém a espessura da linha igual em
          qualquer largura de tela — sem ele o traço engorda no desktop e
          some no celular. */}
      <svg
        className="dobra__arco"
        viewBox="0 0 1200 90"
        preserveAspectRatio="none"
        focusable="false"
      >
        <defs>
          <linearGradient id="bordo-lente" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="var(--color-simbionte)" stopOpacity="0" />
            <stop offset="28%" stopColor="var(--color-simbionte)" stopOpacity="0.55" />
            <stop offset="50%" stopColor="var(--color-pulso)" stopOpacity="0.95" />
            <stop offset="72%" stopColor="var(--color-simbionte)" stopOpacity="0.55" />
            <stop offset="100%" stopColor="var(--color-simbionte)" stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* Curva rasa: a lente é vista quase de lado, não de frente. */}
        <path
          d="M0 74 C 300 26, 900 26, 1200 74"
          fill="none"
          stroke="url(#bordo-lente)"
          strokeWidth="1.25"
          vectorEffect="non-scaling-stroke"
        />

        {/* Segunda linha, mais fraca e deslocada: dá espessura ao vidro
            sem precisar desenhar o vidro. */}
        <path
          d="M0 80 C 300 34, 900 34, 1200 80"
          fill="none"
          stroke="url(#bordo-lente)"
          strokeWidth="0.75"
          strokeOpacity="0.4"
          vectorEffect="non-scaling-stroke"
        />
      </svg>

      {/* O brilho que atravessa. Fica por cima do arco e corre de uma
          ponta à outra, como reflexo caminhando na curvatura. */}
      <span className="dobra__brilho" />
    </div>
  );
}
