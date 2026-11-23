"use client";

import { useEffect, useRef, useState } from "react";
import { X, ChevronLeft, ChevronRight } from "lucide-react";
import { ImagePlaceholder } from "./ImagePlaceholder";

const items = ["Praia e vista", "Acomodações", "Áreas de convivência", "Passeios e arredores", "Gastronomia local"];

export function Gallery({ images = [] }: { images?: (string | undefined)[] }) {
  const [active, setActive] = useState<number | null>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const openerRef = useRef<HTMLButtonElement | null>(null);
  const close = () => setActive(null);
  useEffect(() => {
    if (active === null) return;
    closeRef.current?.focus();
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") close();
      if (event.key === "ArrowLeft") setActive((current) => current === null ? null : (current + items.length - 1) % items.length);
      if (event.key === "ArrowRight") setActive((current) => current === null ? null : (current + 1) % items.length);
      if (event.key === "Tab") {
        const controls = document.querySelectorAll<HTMLButtonElement>(".lightbox button");
        const first = controls[0];
        const last = controls[controls.length - 1];
        if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
        else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      openerRef.current?.focus();
    };
  }, [active]);
  return (
    <>
      <div className="gallery-grid">
        {items.map((item, index) => <button key={item} className={`gallery-item gallery-item-${index + 1}`} onClick={(event) => { openerRef.current = event.currentTarget; setActive(index); }} aria-label={`Ampliar: ${item}`}>
          <ImagePlaceholder src={images[index]} alt={item} /><span>{item}</span>
        </button>)}
      </div>
      {active !== null && <div className="lightbox" role="dialog" aria-modal="true" aria-label={items[active]} onClick={close}>
        <button ref={closeRef} className="lightbox-close" onClick={close} aria-label="Fechar"><X /></button>
        <button className="lightbox-arrow prev" onClick={(e) => { e.stopPropagation(); setActive((active + items.length - 1) % items.length); }} aria-label="Imagem anterior"><ChevronLeft /></button>
        <div className="lightbox-content" onClick={(e) => e.stopPropagation()}><ImagePlaceholder src={images[active]} alt={items[active]} /><p>{items[active]}</p></div>
        <button className="lightbox-arrow next" onClick={(e) => { e.stopPropagation(); setActive((active + 1) % items.length); }} aria-label="Próxima imagem"><ChevronRight /></button>
      </div>}
    </>
  );
}
