"use client";

import { useEffect, useState } from "react";

export function CookieConsent() {
  const [visible, setVisible] = useState(false);
  useEffect(() => { setVisible(localStorage.getItem("penareia-cookie-consent") !== "accepted"); }, []);
  useEffect(() => {
    const id = process.env.NEXT_PUBLIC_META_PIXEL_ID;
    if (!id || localStorage.getItem("penareia-cookie-consent") !== "accepted") return;
    const script = document.createElement("script");
    script.innerHTML = `!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');fbq('init','${id}');fbq('track','PageView');`;
    document.head.appendChild(script);
    return () => { script.remove(); };
  }, [visible]);
  if (!visible) return null;
  return (
    <aside className="cookie-banner" aria-label="Preferências de cookies">
      <p>Usamos cookies para melhorar sua experiência. O Meta Pixel só é ativado com seu consentimento.</p>
      <button className="button button-small" onClick={() => { localStorage.setItem("penareia-cookie-consent", "accepted"); setVisible(false); }}>Aceitar</button>
      <button className="text-button" onClick={() => { localStorage.setItem("penareia-cookie-consent", "declined"); setVisible(false); }}>Recusar</button>
    </aside>
  );
}
