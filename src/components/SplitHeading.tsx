import type { ReactNode } from "react";

type Props = { children: string; as?: "h1" | "h2" | "h3"; className?: string; id?: string };

export function SplitHeading({ children, as = "h2", className = "", id }: Props) {
  const Tag = as;
  const content: ReactNode[] = [];
  let charIndex = 0;
  children.split(/(\s+)/).forEach((token, index) => {
    if (/^\s+$/.test(token)) {
      content.push(<span key={`space-${index}`} aria-hidden="true" className="split-space"> </span>);
      return;
    }
    content.push(
      <span key={`word-${index}`} aria-hidden="true" className="split-word">
        {Array.from(token).map((character) => <span key={charIndex} className="split-char" style={{ transitionDelay: `${charIndex++ * 22}ms` }}>{character}</span>)}
      </span>
    );
  });
  return <Tag id={id} className={`split-heading ${className}`} aria-label={children}>{content}</Tag>;
}
