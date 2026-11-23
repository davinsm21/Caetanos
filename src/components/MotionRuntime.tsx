"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

export function MotionRuntime() {
  const pathname = usePathname();

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches || !("IntersectionObserver" in window)) return;
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(({ target, isIntersecting }) => {
        if (!isIntersecting) return;
        const element = target as HTMLElement;
        element.classList.add(
          element.classList.contains("split-heading") ? "split-visible" :
          element.classList.contains("reveal") ? "reveal-visible" : "photo-visible"
        );
        observer.unobserve(element);
      });
    }, { rootMargin: "120px 0px" });

    document.querySelectorAll<HTMLElement>(".split-heading, .reveal, .image-reveal:not(.hero-actual-image)").forEach((element) => {
      element.classList.add(
        element.classList.contains("split-heading") ? "split-ready" :
        element.classList.contains("reveal") ? "reveal-ready" : "photo-ready"
      );
      observer.observe(element);
    });

    return () => observer.disconnect();
  }, [pathname]);

  return null;
}
