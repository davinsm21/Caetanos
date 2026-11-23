"use client";

import { useEffect } from "react";
import type LenisInstance from "lenis";

export function SunMotion() {
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let context: { revert: () => void } | undefined;
    let cancelled = false;
    let lenis: LenisInstance | undefined;
    let removeScrollListener: (() => void) | undefined;
    let removeTicker: () => void = () => {};
    let ticker: ((time: number) => void) | undefined;
    let removeScrollRoute: () => void = () => {};

    const initializeScrollMotion = () => {
      if (cancelled) return;
      const orb = document.querySelector<HTMLElement>(".sun-orb");
      if (orb) {
        const computed = window.getComputedStyle(orb);
        const transform = computed.transform;
        const opacity = computed.opacity;
        orb.style.animation = "none";
        orb.style.transform = transform;
        orb.style.opacity = opacity;
      }

      void Promise.all([import("gsap"), import("gsap/ScrollTrigger"), import("lenis")]).then(([gsapModule, triggerModule, lenisModule]) => {
        if (cancelled) return;
        const gsap = gsapModule.gsap;
        const ScrollTrigger = triggerModule.ScrollTrigger;
        gsap.registerPlugin(ScrollTrigger);
        const Lenis = lenisModule.default;
        lenis = new Lenis({ duration: 1.15, smoothWheel: true });
        removeScrollListener = lenis.on("scroll", ScrollTrigger.update);
        ticker = (time: number) => { lenis?.raf(time * 1000); };
        gsap.ticker.add(ticker);
        removeTicker = () => { if (ticker) gsap.ticker.remove(ticker); };
        gsap.ticker.lagSmoothing(0);
        context = gsap.context(() => {
          // A single fixed sun follows the page's section markers; only its transform, opacity, and color change.
          const route = gsap.timeline({
            scrollTrigger: { trigger: ".site-main", start: "top top", end: "bottom bottom", scrub: 1, invalidateOnRefresh: true }
          });
          route.to(".sun-orb", { y: () => -window.innerHeight * 0.04, scale: 0.96, backgroundColor: "#ffd27a", ease: "none", duration: 1.3 })
            .to(".sun-orb", { y: () => -window.innerHeight * 0.01, scale: 1.05, backgroundColor: "#ffcf78", ease: "none", duration: 1.2 })
            .to(".sun-orb", { y: () => window.innerHeight * 0.04, scale: 1.24, backgroundColor: "#ff9f4a", ease: "none", duration: 1.4 })
            .to(".sun-orb", { y: () => window.innerHeight * 0.08, scale: 1.38, backgroundColor: "#ff6b57", ease: "none", duration: 1.5 })
            .to(".sun-orb", { y: () => window.innerHeight * 0.28, scale: 0.6, opacity: 0.15, backgroundColor: "#ffd27a", ease: "none", duration: 1.6 });
          const mobile = window.matchMedia("(max-width: 640px)").matches;
          gsap.utils.toArray<HTMLImageElement>(".image-reveal:not(.hero-actual-image) img").forEach((image) => {
            gsap.fromTo(image, { yPercent: mobile ? 2 : 5 }, {
              yPercent: mobile ? -2 : -5, ease: "none",
              scrollTrigger: { trigger: image.parentElement, start: "top bottom", end: "bottom top", scrub: 0.6 }
            });
          });
          removeScrollRoute = () => { route.scrollTrigger?.kill(); route.kill(); };
        });
        ScrollTrigger.refresh();
      });
    };

    window.addEventListener("scroll", initializeScrollMotion, { once: true, passive: true });
    return () => {
      cancelled = true;
      window.removeEventListener("scroll", initializeScrollMotion);
      removeScrollRoute();
      context?.revert();
      removeTicker();
      removeScrollListener?.();
      lenis?.destroy();
    };
  }, []);

  return <div className="sun-orb" aria-hidden="true" />;
}
