import Image from "next/image";

type Props = { src?: string; alt: string; className?: string; priority?: boolean };

export function ImagePlaceholder({ src, alt, className = "", priority = false }: Props) {
  if (src) {
    return <Photo src={src} alt={alt} className={className} priority={priority} />;
  }
  // Swap this gradient for approved property photography; avoid shipping fabricated or unlicensed imagery.
  return (
    <div role="img" aria-label={alt} className={`image-fallback ${className}`}>
      <span className="fallback-sun" aria-hidden="true" />
      <span className="fallback-horizon" aria-hidden="true" />
      <span className="fallback-label" aria-hidden="true">Caetanos · Ceará</span>
    </div>
  );
}

function Photo({ src, alt, className, priority }: Required<Pick<Props, "src" | "alt" | "className" | "priority">>) {
  return <div className={`image-reveal ${className}`}><Image src={src} alt={alt} fill priority={priority} fetchPriority={priority ? "high" : "auto"} sizes="(max-width: 768px) 100vw, 50vw" className="object-cover" /></div>;
}
