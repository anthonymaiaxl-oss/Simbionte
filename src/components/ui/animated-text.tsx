"use client";

import * as React from "react";
import { motion, type Variants } from "motion/react";
import { cn } from "@/lib/utils";

interface AnimatedTextProps extends React.HTMLAttributes<HTMLDivElement> {
  text: string;
  duration?: number;
  delay?: number;
  replay?: boolean;
  className?: string;
  textClassName?: string;
  underlineClassName?: string;
  as?: "h1" | "h2" | "h3" | "h4" | "h5" | "h6" | "p" | "span";
  underlineGradient?: string;
  underlineHeight?: string;
  underlineOffset?: string;
  /** Água verde correndo pelas letras. */
  fluxo?: boolean;
  /** Sublinhado só faz sentido quando o texto é um rótulo curto. */
  underline?: boolean;
}

const AnimatedText = React.forwardRef<HTMLDivElement, AnimatedTextProps>(
  (
    {
      text,
      duration = 0.5,
      delay = 0.1,
      replay = true,
      className,
      textClassName,
      underlineClassName,
      // `as` continua aceito para não quebrar quem já passa a prop, mas
      // não é usado: o elemento semântico é escolhido por quem chama, e
      // este componente só desenha as letras dentro dele.
      as: _as,
      underlineGradient = "from-simbionte via-pulso to-simbionte",
      underlineHeight = "h-1",
      underlineOffset = "-bottom-2",
      fluxo = true,
      underline = false,
      ...props
    },
    ref,
  ) => {
    const letters = Array.from(text);

    const container: Variants = {
      hidden: { opacity: 0 },
      visible: (i: number = 1) => ({
        opacity: 1,
        transition: {
          staggerChildren: duration,
          delayChildren: i * delay,
        },
      }),
    };

    const child: Variants = {
      visible: {
        opacity: 1,
        y: 0,
        transition: { type: "spring", damping: 12, stiffness: 200 },
      },
      hidden: {
        opacity: 0,
        y: 20,
        transition: { type: "spring", damping: 12, stiffness: 200 },
      },
    };

    const lineVariants: Variants = {
      hidden: { width: "0%", left: "50%" },
      visible: {
        width: "100%",
        left: "0%",
        transition: {
          delay: letters.length * delay,
          duration: 0.8,
          ease: "easeOut",
        },
      },
    };

    return (
      <div ref={ref} className={cn("flex flex-col", className)} {...props}>
        <div className="relative">
          <motion.div
            variants={container}
            initial="hidden"
            animate={replay ? "visible" : "hidden"}
            /* overflow-hidden faz as letras subirem por trás de uma
               linha de corte, em vez de simplesmente aparecerem. */
            className={cn(
              "flex overflow-hidden",
              fluxo && "fluxo-verde",
              "text-4xl font-bold",
              textClassName,
            )}
          >
            {/* Leitor de tela lê a palavra inteira; as letras soltas
                viram ruído se não forem escondidas. */}
            <span className="sr-only">{text}</span>

            {letters.map((letter, index) => (
              <motion.span key={index} variants={child} aria-hidden="true">
                {letter === " " ? " " : letter}
              </motion.span>
            ))}
          </motion.div>

          {underline && (
            <motion.div
              variants={lineVariants}
              initial="hidden"
              animate="visible"
              aria-hidden="true"
              className={cn(
                "absolute",
                underlineHeight,
                underlineOffset,
                "bg-gradient-to-r",
                underlineGradient,
                underlineClassName,
              )}
            />
          )}
        </div>
      </div>
    );
  },
);
AnimatedText.displayName = "AnimatedText";

export { AnimatedText };
