# Sistema de movimento — círculo solar

O círculo é um único elemento DOM fixo (`.sun-orb`), renderizado por `SunMotion`. Ele fica atrás do conteúdo, não interfere com cliques e percorre a página com GSAP ScrollTrigger usando `scrub`. No hero, nasce pela borda direita do horizonte, evitando cobrir o título; no mobile aparece parcialmente e com menos intensidade. Lenis aciona `ScrollTrigger.update`; o `refresh()` inicial recalcula as medidas para o tamanho atual da página.

## Percurso por blocos

| Progresso da página | Clima | Cor | Escala / trajetória |
| --- | --- | --- | --- |
| Hero e busca | Amanhecer | `#ff9f4a` | Entra pequeno por baixo e sobe até o horizonte. |
| Diferenciais | Manhã | `#ffd27a` | Cresce discretamente e continua a subida. |
| Experiência / acomodações | Dia dourado | `#ffcf78` → `#ff9f4a` | Fica maior e se aproxima visualmente. |
| Chalés / região | Entardecer | `#ff6b57` | Maior escala, posição mais baixa e quente. |
| Galeria / públicos / relatos | Crepúsculo | `#ff6b57` | A trajetória desacelera e começa a descer. |
| Reserva e rodapé | Mergulho | `#ffd27a` | Reduz a escala, perde opacidade e desaparece abaixo da água. |

O hero também recebe uma entrada de 1,8 s. A posição do horizonte está em `.hero-horizon`; a curva de chegada é definida pela timeline inicial em `src/components/SunMotion.tsx`. Para ajustar a velocidade, altere `duration` no intro ou a duração relativa dos segmentos da timeline `route`. Para ajustar o caminho vertical, altere os valores `y` expressos como frações de `window.innerHeight`; para ajustar o tamanho em cada clima, altere `scale`; para cores, ajuste `backgroundColor`. Essas propriedades não alteram layout.

## Acessibilidade e adaptação

`prefers-reduced-motion: reduce` desativa Lenis/ScrollTrigger, esconde o círculo e deixa os títulos legíveis sem entrada caractere a caractere. Abaixo de 640 px, o círculo fica menor, menos opaco e sem blur pesado. O texto mantém seu nome acessível completo em `aria-label`; os caracteres visuais são marcados `aria-hidden`.

As imagens iniciais em `public/images/` são recortes de baixa resolução das referências visuais fornecidas para o projeto. Substitua esses arquivos por fotos originais autorizadas e otimizadas quando disponíveis; os gradientes CSS continuam como fallback para imagens não configuradas.
