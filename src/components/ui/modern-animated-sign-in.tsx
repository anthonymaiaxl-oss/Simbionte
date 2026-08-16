"use client";

import {
  memo,
  useState,
  useEffect,
  useRef,
  forwardRef,
  type ReactNode,
  type ChangeEvent,
  type FormEvent,
} from "react";
import {
  motion,
  useAnimation,
  useInView,
  useMotionTemplate,
  useMotionValue,
} from "motion/react";
import { Eye, EyeOff } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Peças da tela de entrada, adaptadas à marca.
 *
 * Mudanças em relação ao componente original:
 *
 * - Azul (#3b82f6) trocado pelo verde do Simbionte no brilho do campo.
 * - Tema claro removido: este produto é escuro, e manter os dois seria
 *   carregar CSS que nunca roda.
 * - Ícones em SVG inline no lugar de <Image> apontando para CDN: sem
 *   requisição de rede, sem liberar domínio no next.config, e nítidos
 *   em qualquer tamanho.
 * - Entrada com Google removida: não existe essa autenticação aqui, e
 *   botão que não funciona é pior que botão ausente.
 */

// ==================== Input ====================

const Input = memo(
  forwardRef(function Input(
    { className, type, ...props }: React.InputHTMLAttributes<HTMLInputElement>,
    ref: React.ForwardedRef<HTMLInputElement>,
  ) {
    const raio = 120;
    const [visivel, setVisivel] = useState(false);

    const mouseX = useMotionValue(0);
    const mouseY = useMotionValue(0);

    return (
      <motion.div
        style={{
          background: useMotionTemplate`
            radial-gradient(
              ${visivel ? raio + "px" : "0px"} circle at ${mouseX}px ${mouseY}px,
              var(--color-simbionte),
              transparent 80%
            )
          `,
        }}
        onMouseMove={({ currentTarget, clientX, clientY }) => {
          const { left, top } = currentTarget.getBoundingClientRect();
          mouseX.set(clientX - left);
          mouseY.set(clientY - top);
        }}
        onMouseEnter={() => setVisivel(true)}
        onMouseLeave={() => setVisivel(false)}
        className="group/input rounded-xl p-[1.5px] transition duration-300"
      >
        <input
          type={type}
          ref={ref}
          className={cn(
            "flex h-12 w-full rounded-[10px] border border-borda bg-breu px-4 text-[15px] text-marfim",
            "placeholder:text-bruma focus-visible:outline-none",
            "disabled:cursor-not-allowed disabled:opacity-50",
            className,
          )}
          {...props}
        />
      </motion.div>
    );
  }),
);

Input.displayName = "Input";

// ==================== BoxReveal ====================

type BoxRevealProps = {
  children: ReactNode;
  width?: string;
  boxColor?: string;
  duration?: number;
  overflow?: string;
  className?: string;
};

const BoxReveal = memo(function BoxReveal({
  children,
  width = "fit-content",
  boxColor = "var(--color-simbionte)",
  duration = 0.4,
  overflow = "hidden",
  className,
}: BoxRevealProps) {
  const conteudo = useAnimation();
  const cortina = useAnimation();
  const ref = useRef(null);
  const naTela = useInView(ref, { once: true });

  useEffect(() => {
    if (!naTela) return;
    cortina.start("visible");
    conteudo.start("visible");
  }, [naTela, conteudo, cortina]);

  return (
    <section
      ref={ref}
      style={{ position: "relative", width, overflow }}
      className={className}
    >
      <motion.div
        variants={{
          hidden: { opacity: 0, y: 40 },
          visible: { opacity: 1, y: 0 },
        }}
        initial="hidden"
        animate={conteudo}
        transition={{ duration, delay: 0.2 }}
      >
        {children}
      </motion.div>

      {/* A cortina varre da esquerda para a direita revelando o conteúdo. */}
      <motion.div
        variants={{ hidden: { left: 0 }, visible: { left: "100%" } }}
        initial="hidden"
        animate={cortina}
        transition={{ duration, ease: "easeIn" }}
        style={{
          position: "absolute",
          top: 3,
          bottom: 3,
          left: 0,
          right: 0,
          zIndex: 20,
          background: boxColor,
          borderRadius: 4,
        }}
      />
    </section>
  );
});

// ==================== Ripple ====================

const Ripple = memo(function Ripple({
  tamanhoBase = 180,
  opacidadeBase = 0.2,
  aneis = 9,
  className = "",
}: {
  tamanhoBase?: number;
  opacidadeBase?: number;
  aneis?: number;
  className?: string;
}) {
  return (
    <section
      aria-hidden="true"
      className={cn(
        "pointer-events-none absolute inset-0 flex items-center justify-center",
        "[mask-image:linear-gradient(to_bottom,black,transparent)]",
        className,
      )}
    >
      {Array.from({ length: aneis }, (_, i) => (
        <span
          key={i}
          className="anima-ripple absolute rounded-full border"
          style={{
            width: `${tamanhoBase + i * 78}px`,
            height: `${tamanhoBase + i * 78}px`,
            opacity: Math.max(opacidadeBase - i * 0.02, 0),
            animationDelay: `${i * 0.12}s`,
            borderStyle: i === aneis - 1 ? "dashed" : "solid",
            borderColor: `color-mix(in srgb, var(--color-simbionte) ${
              38 - i * 3
            }%, transparent)`,
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
          }}
        />
      ))}
    </section>
  );
});

// ==================== OrbitingCircles ====================

type OrbitaProps = {
  className?: string;
  children: ReactNode;
  reverse?: boolean;
  duration?: number;
  delay?: number;
  radius?: number;
  path?: boolean;
};

const OrbitingCircles = memo(function OrbitingCircles({
  className,
  children,
  reverse = false,
  duration = 20,
  delay = 10,
  radius = 50,
  path = true,
}: OrbitaProps) {
  return (
    <>
      {path && (
        <svg
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 size-full"
        >
          <circle
            cx="50%"
            cy="50%"
            r={radius}
            fill="none"
            className="stroke-borda"
            strokeWidth="1"
          />
        </svg>
      )}
      <section
        aria-hidden="true"
        style={
          {
            "--duration": duration,
            "--radius": radius,
            "--delay": -delay,
          } as React.CSSProperties
        }
        className={cn(
          "anima-orbita absolute flex size-full transform-gpu items-center justify-center rounded-full",
          reverse && "[animation-direction:reverse]",
          className,
        )}
      >
        {children}
      </section>
    </>
  );
});

// ==================== Label ====================

const Label = memo(function Label({
  className,
  ...props
}: React.LabelHTMLAttributes<HTMLLabelElement>) {
  return (
    <label
      className={cn(
        "text-sm font-medium leading-none text-marfim",
        className,
      )}
      {...props}
    />
  );
});

// ==================== Formulário ====================

type Campo = {
  id: string;
  label: string;
  required?: boolean;
  type: "text" | "email" | "password";
  placeholder?: string;
  onChange: (event: ChangeEvent<HTMLInputElement>) => void;
};

type FormProps = {
  header: string;
  subHeader?: string;
  fields: Campo[];
  submitButton: string;
  errorField?: string | null;
  enviando?: boolean;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  rodape?: ReactNode;
};

const AnimatedForm = memo(function AnimatedForm({
  header,
  subHeader,
  fields,
  submitButton,
  errorField,
  enviando,
  onSubmit,
  rodape,
}: FormProps) {
  const [senhaVisivel, setSenhaVisivel] = useState(false);
  const [erros, setErros] = useState<Record<string, string>>({});

  const validar = (event: FormEvent<HTMLFormElement>) => {
    const atuais: Record<string, string> = {};
    const alvo = event.target as HTMLFormElement;

    for (const campo of fields) {
      const valor = (alvo.elements.namedItem(campo.id) as HTMLInputElement)
        ?.value;

      // As mensagens dizem o que fazer, não apenas o que está errado.
      if (campo.required && !valor) {
        atuais[campo.id] = `Preencha ${campo.label.toLowerCase()}.`;
      } else if (campo.type === "email" && valor && !/\S+@\S+\.\S+/.test(valor)) {
        atuais[campo.id] = "Esse e-mail não parece completo.";
      }
    }
    return atuais;
  };

  return (
    <section className="mx-auto flex w-full max-w-sm flex-col gap-4">
      <BoxReveal duration={0.3}>
        <h1 className="font-[family-name:var(--fonte-gabarito)] text-3xl font-extrabold tracking-tight text-marfim">
          {header}
        </h1>
      </BoxReveal>

      {subHeader && (
        <BoxReveal duration={0.3} className="pb-1">
          <p className="max-w-sm text-sm leading-relaxed text-bruma">
            {subHeader}
          </p>
        </BoxReveal>
      )}

      <form
        noValidate
        onSubmit={(event) => {
          event.preventDefault();
          const encontrados = validar(event);
          if (Object.keys(encontrados).length > 0) {
            setErros(encontrados);
            return;
          }
          setErros({});
          onSubmit(event);
        }}
      >
        <section className="mb-2 grid grid-cols-1 gap-1">
          {fields.map((campo) => (
            <section key={campo.id} className="flex flex-col gap-2">
              <BoxReveal duration={0.3}>
                <Label htmlFor={campo.id}>{campo.label}</Label>
              </BoxReveal>

              <BoxReveal
                width="100%"
                duration={0.3}
                className="flex w-full flex-col"
              >
                <section className="relative">
                  <Input
                    id={campo.id}
                    name={campo.id}
                    type={
                      campo.type === "password"
                        ? senhaVisivel
                          ? "text"
                          : "password"
                        : campo.type
                    }
                    autoComplete={
                      campo.type === "password" ? "current-password" : "username"
                    }
                    placeholder={campo.placeholder}
                    aria-invalid={Boolean(erros[campo.id])}
                    aria-describedby={
                      erros[campo.id] ? `erro-${campo.id}` : undefined
                    }
                    onChange={campo.onChange}
                  />

                  {campo.type === "password" && (
                    <button
                      type="button"
                      onClick={() => setSenhaVisivel((v) => !v)}
                      aria-label={
                        senhaVisivel ? "Ocultar senha" : "Mostrar senha"
                      }
                      className="absolute inset-y-0 right-0 flex w-12 items-center justify-center text-bruma transition-colors hover:text-marfim"
                    >
                      {senhaVisivel ? (
                        <EyeOff className="h-[18px] w-[18px]" />
                      ) : (
                        <Eye className="h-[18px] w-[18px]" />
                      )}
                    </button>
                  )}
                </section>

                <section className="h-5 pt-1">
                  {erros[campo.id] && (
                    <p id={`erro-${campo.id}`} className="text-xs text-falha">
                      {erros[campo.id]}
                    </p>
                  )}
                </section>
              </BoxReveal>
            </section>
          ))}
        </section>

        {errorField && (
          <p
            role="alert"
            className="mb-4 rounded-[10px] border border-falha/40 bg-falha/10 px-4 py-3 text-sm leading-relaxed text-marfim"
          >
            {errorField}
          </p>
        )}

        <BoxReveal width="100%" duration={0.3} overflow="visible">
          <button
            type="submit"
            disabled={enviando}
            aria-busy={enviando}
            className="group/btn relative block h-12 w-full cursor-pointer rounded-[10px] bg-simbionte font-semibold text-breu transition-colors hover:bg-simbionte-claro disabled:cursor-not-allowed disabled:opacity-60"
          >
            {enviando ? "Entrando…" : submitButton}
            <BottomGradient />
          </button>
        </BoxReveal>

        {rodape}
      </form>
    </section>
  );
});

const BottomGradient = () => (
  <>
    <span className="absolute inset-x-0 -bottom-px block h-px w-full bg-gradient-to-r from-transparent via-pulso to-transparent opacity-0 transition duration-500 group-hover/btn:opacity-100" />
    <span className="absolute inset-x-10 -bottom-px mx-auto block h-px w-1/2 bg-gradient-to-r from-transparent via-simbionte-claro to-transparent opacity-0 blur-sm transition duration-500 group-hover/btn:opacity-100" />
  </>
);

export {
  Input,
  BoxReveal,
  Ripple,
  OrbitingCircles,
  AnimatedForm,
  Label,
  BottomGradient,
};
