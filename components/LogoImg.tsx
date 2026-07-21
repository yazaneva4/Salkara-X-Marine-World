"use client";

import React, { useEffect, useState, type ReactNode } from "react";

interface Props {
  src: string;
  alt: string;
  className?: string;
  /** Shown until (or unless) the real image file loads successfully. */
  fallback: ReactNode;
}

/**
 * Renders a logo image from /public. Until the file loads successfully it shows
 * a styled placeholder, and it swaps to the real image only once that image is
 * confirmed to load. This guarantees no broken-image icon before the brand logo
 * files are uploaded to the repo, and the real logo appears automatically once
 * they are.
 */
export default function LogoImg({ src, alt, className, fallback }: Props) {
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let active = true;
    const img = new window.Image();
    img.onload = () => {
      if (active) setLoaded(true);
    };
    img.onerror = () => {
      if (active) setLoaded(false);
    };
    img.src = src;
    return () => {
      active = false;
    };
  }, [src]);

  if (!loaded) return <>{fallback}</>;

  // eslint-disable-next-line @next/next/no-img-element
  return <img src={src} alt={alt} className={className} />;
}
