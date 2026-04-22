"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";

export default function TopProgressBar() {
  const pathname = usePathname();
  const [width, setWidth] = useState(0);
  const [visible, setVisible] = useState(false);
  const timerRefs = useRef<ReturnType<typeof setTimeout>[]>([]);

  // Clear all running timers
  const clearTimers = () => {
    timerRefs.current.forEach(clearTimeout);
    timerRefs.current = [];
  };

  // When pathname changes, navigation is complete → jump to 100 then hide
  useEffect(() => {
    clearTimers();
    setWidth(100);
    const t = setTimeout(() => {
      setVisible(false);
      setWidth(0);
    }, 350);
    timerRefs.current.push(t);
  }, [pathname]);

  // Intercept <a> clicks to start the bar
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      const anchor = (e.target as HTMLElement).closest("a");
      if (!anchor) return;
      const href = anchor.getAttribute("href");
      if (!href) return;
      // Only internal links that aren't anchors (#) or external
      if (href.startsWith("#") || href.startsWith("http") || href.startsWith("mailto")) return;

      clearTimers();
      setVisible(true);
      setWidth(15);

      const t1 = setTimeout(() => setWidth(40), 100);
      const t2 = setTimeout(() => setWidth(65), 300);
      const t3 = setTimeout(() => setWidth(80), 600);
      const t4 = setTimeout(() => setWidth(90), 1000);
      timerRefs.current.push(t1, t2, t3, t4);
    };

    document.addEventListener("click", handleClick, true);
    return () => document.removeEventListener("click", handleClick, true);
  }, []);

  if (!visible && width === 0) return null;

  return (
    <div
      className="fixed top-0 left-0 z-[9999] h-[3px] bg-primary-600 pointer-events-none"
      style={{
        width: `${width}%`,
        opacity: visible ? 1 : 0,
        transitionProperty: "width, opacity",
        transitionDuration: width === 100 ? "0.2s, 0.3s" : "0.4s, 0.1s",
        transitionTimingFunction: "ease, ease",
      }}
    />
  );
}
