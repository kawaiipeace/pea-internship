"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import Image from "next/image";
import NavbarPublic from "@/components/ui/NavbarPublic";
import { DM_Serif_Display } from "next/font/google";

const dmSerif = DM_Serif_Display({
  subsets: ["latin"],
  weight: ["400"],
  style: ["normal", "italic"],
});

// ============================================================
// 2D Simplex Noise (Stefan Gustavson's algorithm)
// ============================================================
const _F2 = 0.5 * (Math.sqrt(3) - 1);
const _G2 = (3 - Math.sqrt(3)) / 6;
const _GRAD: [number, number][] = [[1, 1], [-1, 1], [1, -1], [-1, -1], [1, 0], [-1, 0], [0, 1], [0, -1]];
const _perm = new Uint8Array(512);
const _permMod8 = new Uint8Array(512);
(function _seed(s: number) {
  const p = new Uint8Array(256);
  for (let i = 0; i < 256; i++) p[i] = i;
  for (let i = 255; i > 0; i--) {
    s = (s * 16807) % 2147483647;
    const j = s % (i + 1);
    [p[i], p[j]] = [p[j], p[i]];
  }
  for (let i = 0; i < 512; i++) {
    _perm[i] = p[i & 255];
    _permMod8[i] = _perm[i] & 7;
  }
})(42);

function simplexNoise(xin: number, yin: number): number {
  const s = (xin + yin) * _F2;
  const i = Math.floor(xin + s), j = Math.floor(yin + s);
  const t = (i + j) * _G2;
  const x0 = xin - (i - t), y0 = yin - (j - t);
  const i1 = x0 > y0 ? 1 : 0, j1 = x0 > y0 ? 0 : 1;
  const x1 = x0 - i1 + _G2, y1 = y0 - j1 + _G2;
  const x2 = x0 - 1 + 2 * _G2, y2 = y0 - 1 + 2 * _G2;
  const ii = i & 255, jj = j & 255;
  let n0 = 0, n1 = 0, n2 = 0;
  let t0 = 0.5 - x0 * x0 - y0 * y0;
  if (t0 > 0) { t0 *= t0; const g = _GRAD[_permMod8[ii + _perm[jj]]]; n0 = t0 * t0 * (g[0] * x0 + g[1] * y0); }
  let t1 = 0.5 - x1 * x1 - y1 * y1;
  if (t1 > 0) { t1 *= t1; const g = _GRAD[_permMod8[ii + i1 + _perm[jj + j1]]]; n1 = t1 * t1 * (g[0] * x1 + g[1] * y1); }
  let t2 = 0.5 - x2 * x2 - y2 * y2;
  if (t2 > 0) { t2 *= t2; const g = _GRAD[_permMod8[ii + 1 + _perm[jj + 1]]]; n2 = t2 * t2 * (g[0] * x2 + g[1] * y2); }
  return 70 * (n0 + n1 + n2);
}

// ============================================================
// Marching-squares edge table  (Bits: TL=8 TR=4 BR=2 BL=1)
// ============================================================
const _EDGES: [number, number][][] = [
  [],             // 0
  [[3, 2]],        // 1
  [[2, 1]],        // 2
  [[3, 1]],        // 3
  [[0, 1]],        // 4
  [[0, 3], [2, 1]],  // 5 saddle
  [[0, 2]],        // 6
  [[0, 3]],        // 7
  [[0, 3]],        // 8
  [[0, 2]],        // 9
  [[0, 1], [3, 2]],  // 10 saddle
  [[0, 1]],        // 11
  [[3, 1]],        // 12
  [[2, 1]],        // 13
  [[3, 2]],        // 14
  [],             // 15
];

function _edgePoint(
  x: number, y: number, edge: number, step: number,
  tl: number, tr: number, bl: number, br: number, th: number
): [number, number] | undefined {
  const px = x * step, py = y * step;
  switch (edge) {
    case 0: { const a = (th - tl) / (tr - tl); return [px + step * a, py]; }
    case 1: { const a = (th - tr) / (br - tr); return [px + step, py + step * a]; }
    case 2: { const a = (th - bl) / (br - bl); return [px + step * a, py + step]; }
    case 3: { const a = (th - tl) / (bl - tl); return [px, py + step * a]; }
  }
}

export default function CreditsPage() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const frameRef = useRef<number>(0);
  const mouseRef = useRef({ x: -9999, y: -9999 });
  const scrollRef = useRef(0);
  const navRef = useRef<HTMLDivElement>(null);
  const [navHidden, setNavHidden] = useState(false);
  const [navGlass, setNavGlass] = useState(false);

  // Scroll-reveal refs
  const quoteLineRefs = useRef<(HTMLDivElement | null)[]>([]);
  const logoRefs = useRef<(HTMLDivElement | null)[]>([]);
  const [visibleLines, setVisibleLines] = useState<boolean[]>([]);
  const [visibleLogos, setVisibleLogos] = useState<boolean[]>([]);
  const [heroVisible, setHeroVisible] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);
  const heroSectionRef = useRef<HTMLDivElement>(null);

  // PLEA zoom-out section
  const pleaSectionRef = useRef<HTMLDivElement>(null);
  const [pleaProgress, setPleaProgress] = useState(0);

  // Team horizontal scroll section
  const teamSectionRef = useRef<HTMLDivElement>(null);
  const [teamProgress, setTeamProgress] = useState(0);

  // Card navigation
  const handleCardNav = useCallback((targetIdx: number) => {
    const sectionEl = teamSectionRef.current;
    if (!sectionEl) return;
    const totalCards = 13;
    const sectionTop = sectionEl.getBoundingClientRect().top + window.scrollY;
    const sectionH = sectionEl.offsetHeight;
    const viewH = window.innerHeight;
    // +0.05 stays near the start of the slot (cardFrac≈0.05, visually at rest), avoiding floating-point floor errors
    const targetProgress = (targetIdx + 0.05) / totalCards;
    const targetScrollY = sectionTop + targetProgress * (sectionH - viewH);
    window.scrollTo({ top: targetScrollY, behavior: "smooth" });
  }, []);

  // Window width — client only, to avoid hydration mismatch
  const [winW, setWinW] = useState(1280);
  useEffect(() => {
    const update = () => setWinW(window.innerWidth);
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  // Hero fade-in on mount
  useEffect(() => {
    const t = setTimeout(() => setHeroVisible(true), 200);
    return () => clearTimeout(t);
  }, []);

  // Scroll-driven hero shrink + PLEA + team
  useEffect(() => {
    let ticking = false;
    const onScroll = () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          const maxScroll = window.innerHeight * 0.7;
          const progress = Math.min(1, Math.max(0, window.scrollY / maxScroll));
          setScrollProgress(progress);

          // PLEA zoom-out progress
          if (pleaSectionRef.current) {
            const rect = pleaSectionRef.current.getBoundingClientRect();
            const sectionH = pleaSectionRef.current.offsetHeight;
            const raw = -rect.top / (sectionH - window.innerHeight);
            setPleaProgress(Math.min(1, Math.max(0, raw)));
          }

          // Team horizontal scroll progress
          if (teamSectionRef.current) {
            const rect = teamSectionRef.current.getBoundingClientRect();
            const sectionH = teamSectionRef.current.offsetHeight;
            const raw = -rect.top / (sectionH - window.innerHeight);
            setTeamProgress(Math.min(1, Math.max(0, raw)));
          }

          ticking = false;
        });
        ticking = true;
      }
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Navbar hide on scroll
  useEffect(() => {
    let lastScroll = 0;
    const onScroll = () => {
      const y = window.scrollY;
      scrollRef.current = y;
      setNavGlass(y > 60);
      setNavHidden(y > 200 && y > lastScroll);
      lastScroll = y;
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Intersection observer for scroll-step animations (bidirectional - show/hide)
  useEffect(() => {
    const obs = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          const idx = Number(e.target.getAttribute("data-idx"));
          const type = e.target.getAttribute("data-type");
          const visible = e.isIntersecting;
          if (type === "line") {
            setVisibleLines((prev) => {
              const next = [...prev];
              next[idx] = visible;
              return next;
            });
          } else if (type === "logo") {
            setVisibleLogos((prev) => {
              const next = [...prev];
              next[idx] = visible;
              return next;
            });
          }
        });
      },
      { threshold: 0.3, rootMargin: "0px 0px -40px 0px" }
    );

    // Observe after mount
    const timer = setTimeout(() => {
      quoteLineRefs.current.forEach((el) => el && obs.observe(el));
      logoRefs.current.forEach((el) => el && obs.observe(el));
    }, 100);

    return () => {
      clearTimeout(timer);
      obs.disconnect();
    };
  }, []);

  // Topographic contour map canvas — Simplex Noise + Marching Squares
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let dpr = 1;

    const resize = () => {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      const w = window.innerWidth, h = window.innerHeight;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      canvas.style.width = w + "px";
      canvas.style.height = h + "px";
    };

    const onPointer = (e: PointerEvent) => {
      mouseRef.current = { x: e.clientX, y: e.clientY };
    };
    const onLeave = () => {
      mouseRef.current = { x: -9999, y: -9999 };
    };

    resize();
    window.addEventListener("resize", resize);
    window.addEventListener("pointermove", onPointer);
    window.addEventListener("pointerleave", onLeave);

    // Thresholds & styling — same structure as resume Background3D
    const thresholds = [-0.38, -0.24, -0.10, 0.04, 0.18, 0.32, 0.46];
    const opacities = [0.04, 0.07, 0.10, 0.12, 0.10, 0.07, 0.04];
    const widths = [0.8, 1.0, 1.3, 1.5, 1.3, 1.0, 0.8];
    const MOUSE_RADIUS = 200;
    const GRID_STEP = 22;

    const draw = (time: number) => {
      const w = window.innerWidth, h = window.innerHeight;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, w, h);

      const t = time * 0.00006;
      const cols = Math.ceil(w / GRID_STEP) + 2;
      const rows = Math.ceil(h / GRID_STEP) + 2;
      const mx = mouseRef.current.x, my = mouseRef.current.y;

      // Build noise field
      const field = new Float32Array(rows * cols);
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const px = c * GRID_STEP, py = r * GRID_STEP;
          const nx = c * 0.035, ny = r * 0.035;

          let v = simplexNoise(nx + t, ny + t * 0.6) * 0.55
            + simplexNoise(nx * 2.2 + t * 1.4, ny * 2.2 - t * 0.4) * 0.3
            + simplexNoise(nx * 4.5 + t * 0.8, ny * 4.5 + t * 1.2) * 0.15;

          // Mouse scatter
          const dx = px - mx, dy = py - my;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < MOUSE_RADIUS) {
            const strength = Math.pow(1 - dist / MOUSE_RADIUS, 2.5) * 0.7;
            v += strength * (v >= 0 ? 1 : -1);
          }

          field[r * cols + c] = v;
        }
      }

      // Draw contour lines
      for (let ti = 0; ti < thresholds.length; ti++) {
        const th = thresholds[ti];
        // Keep original amber/orange color from credits page
        ctx.strokeStyle = `rgba(255, 184, 107, ${opacities[ti]})`;
        ctx.lineWidth = widths[ti];
        ctx.beginPath();

        for (let r = 0; r < rows - 1; r++) {
          for (let c = 0; c < cols - 1; c++) {
            const tl = field[r * cols + c];
            const tr = field[r * cols + c + 1];
            const br = field[(r + 1) * cols + c + 1];
            const bl = field[(r + 1) * cols + c];

            const idx = (tl >= th ? 8 : 0)
              | (tr >= th ? 4 : 0)
              | (br >= th ? 2 : 0)
              | (bl >= th ? 1 : 0);

            const segs = _EDGES[idx];
            for (let s = 0; s < segs.length; s++) {
              const p1 = _edgePoint(c, r, segs[s][0], GRID_STEP, tl, tr, bl, br, th);
              const p2 = _edgePoint(c, r, segs[s][1], GRID_STEP, tl, tr, bl, br, th);
              if (p1 && p2) { ctx.moveTo(p1[0], p1[1]); ctx.lineTo(p2[0], p2[1]); }
            }
          }
        }
        ctx.stroke();
      }

      frameRef.current = requestAnimationFrame(draw);
    };

    frameRef.current = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(frameRef.current);
      window.removeEventListener("resize", resize);
      window.removeEventListener("pointermove", onPointer);
      window.removeEventListener("pointerleave", onLeave);
    };
  }, []);

  const setQuoteRef = useCallback(
    (idx: number) => (el: HTMLDivElement | null) => {
      quoteLineRefs.current[idx] = el;
    },
    []
  );

  const setLogoRef = useCallback(
    (idx: number) => (el: HTMLDivElement | null) => {
      logoRefs.current[idx] = el;
    },
    []
  );

  const marqueeSegment1 = (
    <>
      <span className="text-white">Brightness </span>
      <span style={{ color: '#FFB86B' }}>for Life </span>
      <span className="text-white">Quality </span>
      <span className="inline-block w-16" />
      <span className="text-white">Brightness </span>
      <span style={{ color: '#FFB86B' }}>for Life </span>
      <span className="text-white">Quality </span>
      <span className="inline-block w-16" />
      <span className="text-white">Brightness </span>
      <span style={{ color: '#FFB86B' }}>for Life </span>
      <span className="text-white">Quality </span>
      <span className="inline-block w-16" />
    </>
  );

  const marqueeSegment2 = (
    <>
      <span style={{ color: '#FFB86B' }}>Smart Energy </span>
      <span className="text-white">for </span>
      <span style={{ color: '#FFB86B' }}>Better Life </span>
      <span className="text-white">and Sustainability </span>
      <span className="inline-block w-16" />
      <span style={{ color: '#FFB86B' }}>Smart Energy </span>
      <span className="text-white">for </span>
      <span style={{ color: '#FFB86B' }}>Better Life </span>
      <span className="text-white">and Sustainability </span>
      <span className="inline-block w-16" />
    </>
  );

  const quoteLines: { text: string; highlight?: string; after?: string }[] = [
    { text: "From learning to ", highlight: "doing", after: "," },
    { text: "from ideas to ", highlight: "real outcomes", after: "," },
    { text: "we build experience," },
    { text: "grow together, and shape ", highlight: "a future" },
    { text: "that reflects ", highlight: "the impact", after: " we create." },
  ];

  const universities = [
    { name: "PEA", src: "/images/PEAA.png" },
    { name: "แม่ฟ้าหลวง", src: "/images/mfu.png" },
    { name: "ราชภัฏพระนคร", src: "/images/rajabhat.png" },
    { name: "พระจอมเกล้าปราจีนบุรี", src: "/images/prajom.png" },
    { name: "พระจอมเกล้าธนบุรี", src: "/images/prajom2.png" },
    { name: "DPU", src: "/images/DPU.png" },
  ];

  return (
    <div className="min-h-screen bg-[#1a1a1a]">
      {/* Navbar - always blended into dark background */}
      <div
        ref={navRef}
        className="fixed left-0 right-0 z-50 credits-nav-glass"
        style={{
          top: navHidden ? "-100%" : "0",
          opacity: navHidden ? 0 : 1,
          transition: "top 0.5s ease, opacity 0.5s ease",
        }}
      >
        <NavbarPublic />
      </div>

      {/* Full-page topographic canvas */}
      <canvas
        ref={canvasRef}
        className="fixed top-0 left-0 pointer-events-none"
        style={{ zIndex: 1, width: "100%", height: "100%" }}
      />

      <main className={`relative ${dmSerif.className}`} style={{ zIndex: 2 }}>
        {/* Hero Section: Marquee + Gradient Card - scroll-driven shrink */}
        <section
          ref={heroSectionRef}
          className="relative"
          style={{ height: "170vh" }}
        >
          <div className="sticky top-0 w-full" style={{ height: "100vh", overflow: "hidden" }}>
            {/* Marquee rows behind the card */}
            <div
              className={`absolute inset-0 flex flex-col justify-center pointer-events-none select-none transition-opacity duration-[1500ms] ease-out ${heroVisible && scrollProgress > 0.3 ? "opacity-100" : heroVisible ? "opacity-0" : "opacity-0"}`}
              style={{
                opacity: scrollProgress > 0.3 ? Math.min(1, (scrollProgress - 0.3) / 0.4) : 0,
              }}
            >
              {/* Row 1: Right to Left */}
              <div className="overflow-hidden whitespace-nowrap py-2">
                <div
                  className="inline-flex"
                  style={{ animation: "marquee-rtl 35s linear infinite" }}
                >
                  <span className="text-5xl sm:text-6xl md:text-8xl lg:text-9xl font-black tracking-tight">
                    {marqueeSegment1}
                  </span>
                  <span className="text-5xl sm:text-6xl md:text-8xl lg:text-9xl font-black tracking-tight">
                    {marqueeSegment1}
                  </span>
                </div>
              </div>

              {/* Row 2: Left to Right */}
              <div className="overflow-hidden whitespace-nowrap py-2 mt-4">
                <div
                  className="inline-flex"
                  style={{ animation: "marquee-ltr 40s linear infinite" }}
                >
                  <span className="text-5xl sm:text-6xl md:text-8xl lg:text-9xl font-black tracking-tight">
                    {marqueeSegment2}
                  </span>
                  <span className="text-5xl sm:text-6xl md:text-8xl lg:text-9xl font-black tracking-tight">
                    {marqueeSegment2}
                  </span>
                </div>
              </div>
            </div>

            {/* Gradient Card - starts fullscreen, shrinks to card */}
            <div
              className={`z-10 flex flex-col items-center justify-center overflow-hidden transition-opacity duration-[1800ms] ease-out px-4 ${heroVisible ? "opacity-100" : "opacity-0"}`}
              style={{
                background:
                  "linear-gradient(135deg, #f472b6, #f9a8d4, #fbbf24, #f472b6, #f9a8d4)",
                backgroundSize: "300% 300%",
                animation: "gradient-shift 6s ease infinite",
                position: "absolute",
                top: `${scrollProgress * 15}%`,
                left: `${scrollProgress * 15}%`,
                right: `${scrollProgress * 15}%`,
                bottom: `${scrollProgress * 15}%`,
                borderRadius: `${scrollProgress * 1.5}rem`,
                boxShadow: scrollProgress > 0.1 ? "0 25px 50px -12px rgba(0,0,0,0.25)" : "none",
              }}
            >
              <h2
                className="text-white font-normal tracking-[0.1em] sm:tracking-[0.25em] uppercase drop-shadow-md text-center whitespace-nowrap"
                style={{
                  fontSize: `clamp(0.65rem, 4vw, ${2.5 - scrollProgress * 1}rem)`,
                }}
              >
                Meet the Team
              </h2>

              {/* Initial text: PEA Internship Present - fades out on scroll */}
              <div
                className="flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-3 mt-2"
                style={{
                  opacity: Math.max(0, 1 - scrollProgress * 3),
                  transform: `translateY(${scrollProgress * -20}px)`,
                  position: scrollProgress > 0.5 ? "absolute" : "relative",
                  pointerEvents: scrollProgress > 0.3 ? "none" : "auto",
                }}
              >
                <span
                  className="text-primary-600 italic drop-shadow-sm text-center"
                  style={{
                    fontSize: `clamp(1.25rem, 7vw, ${4 - scrollProgress * 1.5}rem)`,
                  }}
                >
                  PEA Internship
                </span>
                <span
                  className="text-white drop-shadow-sm uppercase text-center"
                  style={{
                    fontSize: `clamp(1.25rem, 7vw, ${4 - scrollProgress * 1.5}rem)`,
                  }}
                >
                  Present
                </span>
              </div>

              {/* Final text: Our Designers - fades in on scroll */}
              <h1
                className="text-primary-600 italic mt-2 drop-shadow-sm"
                style={{
                  fontSize: `clamp(1.5rem, ${3 - scrollProgress * 0.5}rem, 3.5rem)`,
                  opacity: Math.max(0, (scrollProgress - 0.4) / 0.4),
                  transform: `translateY(${Math.max(0, (1 - scrollProgress) * 15)}px)`,
                  position: scrollProgress < 0.3 ? "absolute" : "relative",
                  pointerEvents: scrollProgress < 0.5 ? "none" : "auto",
                }}
              >
                Our Designers
              </h1>
            </div>
          </div>
        </section>

        {/* Inspirational Quote - scroll step animation */}
        <section className="max-w-5xl mx-auto text-center py-20 md:py-32 px-6">
          {quoteLines.map((line, i) => (
            <div
              key={i}
              ref={setQuoteRef(i)}
              data-idx={i}
              data-type="line"
              className={`transition-all duration-700 ${visibleLines[i]
                ? "opacity-100 translate-y-0"
                : "opacity-0 translate-y-8"
                }`}
              style={{ transitionDelay: `${i * 120}ms` }}
            >
              <p className="text-xl sm:text-2xl md:text-4xl lg:text-5xl leading-snug md:leading-tight italic uppercase mb-1 md:mb-2">
                <span className="text-white">{line.text}</span>
                {line.highlight && (
                  <span style={{ color: '#FFB86B' }}>{line.highlight}</span>
                )}
                {line.after && (
                  <span className="text-white">{line.after}</span>
                )}
              </p>
            </div>
          ))}
        </section>

        {/* University Logos - scroll in one by one */}
        <section className="flex flex-wrap justify-center items-center gap-6 md:gap-10 py-8 pb-40 px-4">
          {universities.map((uni, i) => (
            <div
              key={i}
              ref={setLogoRef(i)}
              data-idx={i}
              data-type="logo"
              className={`transition-all duration-[600ms] ${visibleLogos[i]
                ? "opacity-100 translate-y-0 scale-100"
                : "opacity-0 translate-y-10 scale-75"
                }`}
              style={{ transitionDelay: `${i * 180}ms` }}
            >
              <div
                className="w-24 h-24 md:w-32 md:h-32 lg:w-40 lg:h-30 hover:scale-110 transition-transform duration-300"
                title={uni.name}
              >
                <Image
                  src={uni.src}
                  alt={uni.name}
                  width={96}
                  height={96}
                  className="w-full h-full object-contain"
                />
              </div>
            </div>
          ))}
        </section>

        {/* ─── PLEA Zoom-out Section ─────────────────────────────────── */}
        {/*
            Stage 0–25%  : full-screen amber bg, giant "L" centered
            Stage 25–55% : bg fades out, PLEA zooms out from L-position
            Stage 55–100%: PLEA final position + taglines fade in
        */}
        <section
          ref={pleaSectionRef}
          className="relative"
          style={{ height: "600vh" }}
        >
          <div
            className="sticky top-0 w-full overflow-hidden flex items-center justify-center"
            style={{ height: "100vh", backgroundColor: "#FFB86B" }}
          >
            {/* Dark overlay — fades IN as we scroll, covering the amber */}
            <div
              className="absolute inset-0 pointer-events-none"
              style={{
                background: "#1a1a1a",
                opacity: Math.min(1, Math.max(0, pleaProgress / 0.22)),
                zIndex: 0,
              }}
            />

            {/* Stage 1 + 2: L zooms out into PLEA (0–55%) */}
            {pleaProgress < 0.6 && (() => {
              // 0–0.25 → just L at scale 1 on amber bg
              // 0.25–0.55 → PLEA zooms from scale~5 down to scale~1
              const zoomT = pleaProgress < 0.25 ? 0 : Math.min(1, (pleaProgress - 0.25) / 0.3);
              const scale = 1 + (1 - zoomT) * 4.5; // 5.5 → 1

              return (
                <div
                  className="select-none pointer-events-none absolute"
                  style={{
                    fontFamily: dmSerif.style.fontFamily,
                    display: "flex",
                    gap: "0.02em",
                    lineHeight: 1,
                    transform: `scale(${scale})`,
                    transformOrigin: "center center",
                    // Clip so overflow doesn't bleed during zoom
                    willChange: "transform",
                  }}
                >
                  {["P", "L", "E", "A"].map((letter, i) => (
                    <span
                      key={i}
                      style={{
                        fontSize: "22vw",
                        // L E A fade in from 0 → 1 as zoom starts; P always visible
                        opacity: i === 0 ? 1 : Math.min(1, zoomT * 2),
                        color: i === 0
                          ? (pleaProgress < 0.22 ? "#1a1a1a" : "#FFB86B")
                          : "white",
                        textShadow: i === 0 && pleaProgress >= 0.22
                          ? "0 0 80px rgba(255,184,107,0.5)"
                          : "none",
                        zIndex: 1,
                        position: "relative",
                      }}
                    >
                      {letter}
                    </span>
                  ))}
                </div>
              );
            })()}

            {/* Stage 3: PLEA locked in final pos + taglines (55–100%) */}
            {pleaProgress >= 0.55 && (() => {
              const t = Math.min(1, (pleaProgress - 0.55) / 0.35);
              const words = [
                { letter: "P", word: "Play", tagline: "Explore creativity" },
                { letter: "L", word: "Listen", tagline: "Understand people" },
                { letter: "E", word: "Eat", tagline: "Enjoy life" },
                { letter: "A", word: "Art", tagline: "Express everything" },
              ];
              return (
                <div
                  className="flex flex-row items-end justify-center w-full px-4"
                  style={{ gap: "clamp(1rem, 4vw, 4rem)" }}
                >
                  {words.map((w, i) => (
                    <div
                      key={i}
                      className="flex flex-col items-center text-center"
                      style={{
                        opacity: t,
                        transform: `translateY(${(1 - t) * 30}px)`,
                      }}
                    >
                      <span
                        style={{
                          fontSize: "clamp(4rem, 15vw, 12rem)",
                          lineHeight: 0.85,
                          fontFamily: dmSerif.style.fontFamily,
                          color: i === 0 ? "#FFB86B" : "white",
                          textShadow: i === 0 ? "0 0 60px rgba(255,184,107,0.4)" : "none",
                        }}
                      >
                        {w.letter}
                      </span>
                      <span
                        style={{
                          fontSize: "clamp(0.9rem, 2vw, 1.5rem)",
                          marginTop: "0.5rem",
                          color: i === 0 ? "#FFB86B" : "white",
                          fontFamily: dmSerif.style.fontFamily,
                          letterSpacing: "0.03em",
                        }}
                      >
                        {w.word}
                      </span>
                      <span
                        style={{
                          fontSize: "clamp(0.55rem, 1vw, 0.8rem)",
                          color: "rgba(255,255,255,0.45)",
                          letterSpacing: "0.12em",
                          textTransform: "uppercase",
                          marginTop: "0.2rem",
                          fontFamily: dmSerif.style.fontFamily,
                        }}
                      >
                        {w.tagline}
                      </span>
                    </div>
                  ))}
                </div>
              );
            })()}
          </div>
        </section>

        {/* ─── Team Stacked Card Section ───────────────────────── */}
        <section
          ref={teamSectionRef}
          className="relative"
          style={{ height: "1500vh" }}
        >
          <div
            className="sticky top-0 w-full overflow-hidden"
            style={{ height: "100vh" }}
          >
            {/* Role label top center — enhanced design */}
            <div className="absolute top-6 left-0 right-0 flex justify-center z-10 pointer-events-none">
              {(() => {
                const activeIdx = Math.min(12, Math.floor(teamProgress * 13));
                const isDesigner = activeIdx >= 7;
                const activeBorderColor = isDesigner ? "rgba(192,132,252,0.5)" : "rgba(255,184,107,0.5)";
                return (
                  <div
                    className="relative flex flex-col items-center"
                    style={{ padding: "0.8rem 0" }}
                  >
                    {/* Decorative top line */}
                    <div
                      style={{
                        width: "60px",
                        height: "1px",
                        background: `linear-gradient(90deg, transparent, ${activeBorderColor}, transparent)`,
                        marginBottom: "0.9rem",
                        transition: "background 0.6s ease",
                      }}
                    />
                    <div className="flex gap-6 sm:gap-10 items-center">
                      {/* Developer label */}
                      <div className="flex flex-col items-center">
                        <span
                          style={{
                            fontFamily: dmSerif.style.fontFamily,
                            fontSize: "clamp(0.85rem, 2vw, 1.2rem)",
                            color: "#FFB86B",
                            letterSpacing: "0.35em",
                            textTransform: "uppercase",
                            opacity: isDesigner ? 0.2 : 1,
                            transition: "all 0.6s ease",
                            textShadow: !isDesigner ? "0 0 20px rgba(255,184,107,0.4), 0 0 40px rgba(255,184,107,0.15)" : "none",
                          }}
                        >
                          Developer
                        </span>
                        <div
                          style={{
                            width: isDesigner ? "0%" : "100%",
                            height: "2px",
                            background: "linear-gradient(90deg, transparent, #FFB86B, transparent)",
                            marginTop: "0.4rem",
                            transition: "width 0.5s ease",
                            borderRadius: "1px",
                            boxShadow: "0 0 8px rgba(255,184,107,0.3)",
                          }}
                        />
                      </div>

                      {/* Animated dot separator */}
                      <div className="flex gap-1.5 items-center">
                        <div
                          style={{
                            width: "3px",
                            height: "3px",
                            borderRadius: "50%",
                            background: isDesigner ? "rgba(192,132,252,0.4)" : "rgba(255,184,107,0.4)",
                            transition: "background 0.6s ease",
                          }}
                        />
                        <div
                          style={{
                            width: "5px",
                            height: "5px",
                            borderRadius: "50%",
                            background: isDesigner ? "rgba(192,132,252,0.7)" : "rgba(255,184,107,0.7)",
                            transition: "background 0.6s ease",
                            boxShadow: `0 0 6px ${isDesigner ? "rgba(192,132,252,0.3)" : "rgba(255,184,107,0.3)"}`,
                          }}
                        />
                        <div
                          style={{
                            width: "3px",
                            height: "3px",
                            borderRadius: "50%",
                            background: isDesigner ? "rgba(192,132,252,0.4)" : "rgba(255,184,107,0.4)",
                            transition: "background 0.6s ease",
                          }}
                        />
                      </div>

                      {/* Designer label */}
                      <div className="flex flex-col items-center">
                        <span
                          style={{
                            fontFamily: dmSerif.style.fontFamily,
                            fontSize: "clamp(0.85rem, 2vw, 1.2rem)",
                            color: "#c084fc",
                            letterSpacing: "0.35em",
                            textTransform: "uppercase",
                            opacity: isDesigner ? 1 : 0.2,
                            transition: "all 0.6s ease",
                            textShadow: isDesigner ? "0 0 20px rgba(192,132,252,0.4), 0 0 40px rgba(192,132,252,0.15)" : "none",
                          }}
                        >
                          Designer
                        </span>
                        <div
                          style={{
                            width: isDesigner ? "100%" : "0%",
                            height: "2px",
                            background: "linear-gradient(90deg, transparent, #c084fc, transparent)",
                            marginTop: "0.4rem",
                            transition: "width 0.5s ease",
                            borderRadius: "1px",
                            boxShadow: "0 0 8px rgba(192,132,252,0.3)",
                          }}
                        />
                      </div>
                    </div>
                    {/* Decorative bottom line */}
                    <div
                      style={{
                        width: "120px",
                        height: "1px",
                        background: `linear-gradient(90deg, transparent, ${activeBorderColor}, transparent)`,
                        marginTop: "0.9rem",
                        transition: "background 0.6s ease",
                      }}
                    />
                  </div>
                );
              })()}
            </div>

            {/* Stacked card shuffle + side detail panel */}
            {(() => {
              const members = [
                {
                  name: "Jom",
                  src: "/images/photodirevtor/jom4.png",
                  role: "Developer",
                  fullName: "",
                  position: "Backend Developer",
                  university: "Dhurakij Pundit University",
                  universityImg: "/images/DPU.png",
                  email: "65111398@dpu.ac.th",
                  projects: [
                    { name: "PEA Internship", logo: "/images/logo.png" },
                    { name: "PEA ITT", logo: "/images/ittlogo.png" },
                  ],
                },
                {
                  name: "Pat",
                  src: "/images/photodirevtor/pat1.png",
                  role: "Developer",
                  fullName: "Kittapas Viriyapappaibool",
                  position: "Frontend Developer",
                  university: "Mae Fah Luang University",
                  universityImg: "/images/mfu.png",
                  email: "kittapas.viriya@gmail.com",
                  projects: [
                    { name: "PEA Internship", logo: "/images/logo.png" },
                    { name: "PEA ITT", logo: "/images/ittlogo.png" },
                  ],
                },
                {
                  name: "Rif",
                  src: "/images/photodirevtor/rif2.png",
                  role: "Developer",
                  fullName: "",
                  position: "Backend Developer",
                  university: "Dhurakij Pundit University",
                  universityImg: "/images/DPU.png",
                  email: "",
                  projects: [
                    { name: "PEA Internship", logo: "/images/logo.png" },
                    { name: "PEA ITT", logo: "/images/ittlogo.png" },
                  ],
                },
                {
                  name: "Yam",
                  src: "/images/photodirevtor/yam3.png",
                  role: "Developer",
                  fullName: "Thanakorn Samngamnu",
                  position: "Frontend Developer",
                  university: "Mae Fah Luang University",
                  universityImg: "/images/mfu.png",
                  email: "6531503034@lamduan.mfu.ac.th",
                  projects: [
                    { name: "PEA Internship", logo: "/images/logo.png" },
                    { name: "PEA ITT", logo: "/images/ittlogo.png" },
                  ],
                },
                {
                  name: "Faii",
                  src: "/images/photodirevtor/faii10.png",
                  role: "Developer",
                  fullName: "",
                  position: "Frontend Developer",
                  university: "Dhurakij Pundit University",
                  universityImg: "/images/DPU.png",
                  email: "",
                  project: "PEA ITT",
                  projectLogo: "/images/ittlogo.png",
                },
                {
                  name: "Tam",
                  src: "/images/photodirevtor/tam5.png",
                  role: "Developer",
                  fullName: "",
                  position: "Frontend Developer",
                  university: "Dhurakij Pundit University",
                  universityImg: "/images/DPU.png",
                  email: "",
                  project: "PEA ITT",
                  projectLogo: "/images/ittlogo.png",
                },
                {
                  name: "Cream",
                  src: "/images/photodirevtor/cream12.png",
                  role: "Developer",
                  fullName: "",
                  position: "Frontend Developer",
                  university: "Dhurakij Pundit University",
                  universityImg: "/images/DPU.png",
                  email: "",
                  project: "PEA ITT",
                  projectLogo: "/images/ittlogo.png",
                },
                {
                  name: "Ice",
                  src: "/images/photodirevtor/ice6.png",
                  role: "Designer",
                  fullName: "",
                  position: "UI/UX Designer",
                  university: "Phranakhon Rajabhat University",
                  universityImg: "/images/rajabhat.png",
                  email: "nongice2546i@gmail.com",
                  project: "PEA Internship",
                  projectLogo: "/images/logo.png",
                },
                {
                  name: "RollYam",
                  src: "/images/photodirevtor/rollyam7.png",
                  role: "Designer",
                  fullName: "",
                  position: "UI/UX Designer",
                  university: "King Mongkut's University of Technology North Bangkok, Prachinburi Campus",
                  universityImg: "/images/prajom.png",
                  email: "S6506021622116@email.kmutnb.ac.th",
                  project: "PEA Internship",
                  projectLogo: "/images/logo.png",
                },
                {
                  name: "Nass",
                  src: "/images/photodirevtor/nass8.png",
                  role: "Designer",
                  fullName: "Panadda Paenjak",
                  position: "UI/UX Designer",
                  university: "Mae Fah Luang University",
                  universityImg: "/images/mfu.png",
                  email: "6531503045@lamduan.mfu.ac.th",
                  projects: [
                    { name: "PEA Internship", logo: "/images/logo.png" },
                    { name: "PEA ITT", logo: "/images/ittlogo.png" },
                  ],
                },
                {
                  name: "Pond",
                  src: "/images/photodirevtor/pond9.png",
                  role: "Designer",
                  fullName: "",
                  position: "UI/UX Designer",
                  university: "King Mongkut's University of Technology Thonburi",
                  universityImg: "/images/prajom2.png",
                  email: "poundpon@gmail.com",
                  projects: [
                    { name: "PEA Internship", logo: "/images/logo.png" },
                    { name: "PEA ITT", logo: "/images/ittlogo.png" },
                  ],
                },
                {
                  name: "Yo",
                  src: "/images/photodirevtor/yo11.png",
                  role: "Designer",
                  fullName: "",
                  position: "UI/UX Designer",
                  university: "Mae Fah Luang University",
                  universityImg: "/images/mfu.png",
                  email: "6531501008@lamduan.mfu.ac.th",
                  project: "PEA Internship",
                  projectLogo: "/images/logo.png",
                },
                {
                  name: "Natty",
                  src: "/images/photodirevtor/natty13.png",
                  role: "Designer",
                  fullName: "",
                  position: "UI/UX Designer",
                  university: "Mae Fah Luang University",
                  universityImg: "/images/mfu.png",
                  email: "6531501059@lamduan.mfu.ac.th",
                  projects: [
                    { name: "PEA Internship", logo: "/images/logo.png" },
                    { name: "PEA ITT", logo: "/images/ittlogo.png" },
                  ],
                },
              ];

              const isMobile = winW < 640;
              const cardW = isMobile ? Math.min(200, winW * 0.46) : 280;
              const cardH = isMobile ? cardW * (400 / 280) : 400;
              const totalCards = members.length;
              const rawIdx = teamProgress * totalCards;
              const activeIdx = Math.min(totalCards - 1, Math.floor(rawIdx));
              const cardFrac = activeIdx === totalCards - 1 ? 0 : rawIdx - activeIdx;
              const activeMember = members[activeIdx];
              const isDevActive = activeMember.role === "Developer";
              const gcActive = isDevActive ? "255,184,107" : "192,132,252";
              const gcColorActive = isDevActive ? "#FFB86B" : "#c084fc";

              return (
                <>
                  {/* Card + detail row (desktop) / column (mobile) */}
                  <div
                    className="absolute inset-0 flex items-center justify-center"
                    style={{
                      flexDirection: isMobile ? "column" : "row",
                      gap: isMobile ? "1.25rem" : "3rem",
                      paddingTop: isMobile ? "1rem" : 0,
                    }}
                  >
                    {/* Card stack */}
                    <div style={{ position: "relative", width: `${cardW}px`, height: `${cardH}px`, flexShrink: 0 }}>
                      {members.map((member, i) => {
                        const isDev = member.role === "Developer";
                        const diff = i - activeIdx;

                        let tx = 0, rot = 0, sc = 1, op = 1, z = 0;

                        if (diff === 0) {
                          tx = -cardFrac * 500;
                          rot = -cardFrac * 12;
                          sc = 1.05 - cardFrac * 0.2;
                          op = 1 - cardFrac * 0.6;
                          z = totalCards + 2;
                        } else if (diff === 1) {
                          tx = (1 - cardFrac) * 30;
                          sc = 0.88 + cardFrac * 0.17;
                          op = 0.5 + cardFrac * 0.5;
                          z = totalCards + 1;
                        } else if (diff > 1 && diff <= 3) {
                          tx = diff * 15;
                          sc = 0.88 - diff * 0.04;
                          op = Math.max(0, 0.3 - diff * 0.1);
                          z = totalCards - diff;
                        } else if (diff < 0 && diff >= -3) {
                          tx = diff * 100 - 200;
                          rot = diff * 4;
                          sc = 0.75;
                          op = Math.max(0, 0.4 + diff * 0.12);
                          z = i;
                        } else {
                          op = 0;
                          z = 0;
                        }

                        const isGlow = diff === 0 && cardFrac < 0.5;
                        const gc = isDev ? "255,184,107" : "192,132,252";

                        return (
                          <div
                            key={i}
                            style={{
                              position: "absolute",
                              top: 0,
                              left: 0,
                              width: `${cardW}px`,
                              zIndex: z,
                              opacity: op,
                              transform: `translateX(${tx}px) rotate(${rot}deg) scale(${sc})`,
                              willChange: "transform, opacity",
                              transition: diff !== 0 ? "transform 0.35s cubic-bezier(0.34,1.56,0.64,1), opacity 0.35s ease" : "none",
                            }}
                          >
                            <div
                              className="relative overflow-hidden"
                              style={{
                                width: `${cardW}px`,
                                height: `${cardH}px`,
                                borderRadius: "1.4rem",
                                boxShadow: isGlow
                                  ? `0 0 60px 12px rgba(${gc},0.5), 0 0 100px 25px rgba(${gc},0.15), 0 24px 48px rgba(0,0,0,0.7)`
                                  : "0 8px 32px rgba(0,0,0,0.6)",
                              }}
                            >
                              <Image
                                src={member.src}
                                alt={member.name}
                                fill
                                sizes="280px"
                                className="object-cover object-top"
                                style={{
                                  filter: isGlow
                                    ? "brightness(1.1) saturate(1.15)"
                                    : "brightness(0.65) saturate(0.7)",
                                }}
                              />
                              <div className="absolute inset-0" style={{ background: "linear-gradient(to top, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.1) 50%, transparent 100%)" }} />
                              <div
                                className="absolute top-3 right-3"
                                style={{
                                  background: isDev ? "rgba(255,184,107,0.18)" : "rgba(192,132,252,0.18)",
                                  border: `1px solid ${isDev ? "rgba(255,184,107,0.7)" : "rgba(192,132,252,0.7)"}`,
                                  borderRadius: "999px", padding: "2px 10px", fontSize: "0.6rem",
                                  color: isDev ? "#FFB86B" : "#c084fc",
                                  letterSpacing: "0.15em", textTransform: "uppercase",
                                  fontFamily: dmSerif.style.fontFamily, backdropFilter: "blur(4px)",
                                }}
                              >
                                {member.role}
                              </div>
                              <div
                                className="absolute bottom-5 left-5 right-5"
                                style={{
                                  fontFamily: dmSerif.style.fontFamily,
                                  fontSize: "clamp(1.5rem, 4vw, 2.2rem)",
                                  color: "white", textShadow: "0 2px 10px rgba(0,0,0,0.9)",
                                }}
                              >
                                {member.name}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* Detail panel — quote/comment style. key=activeIdx triggers slide-in on change */}
                    <div
                      key={activeIdx}
                      style={{
                        width: isMobile ? `${Math.min(cardW + 40, winW - 32)}px` : "240px",
                        flexShrink: 0,
                        animation: "detail-slide-in 0.45s cubic-bezier(0.22, 1, 0.36, 1) both",
                      }}
                    >
                      <div
                        style={{
                          position: "relative",
                          borderRadius: "1.2rem",
                          background: "rgba(255,255,255,0.03)",
                          border: "1px solid rgba(255,255,255,0.08)",
                          backdropFilter: "blur(16px)",
                          padding: isMobile ? "1.2rem 1.2rem 1.2rem 1.5rem" : "1.8rem 1.5rem 1.8rem 1.8rem",
                          overflow: "hidden",
                        }}
                      >
                        {/* Left accent bar */}
                        <div
                          style={{
                            position: "absolute",
                            left: 0,
                            top: "1.5rem",
                            bottom: "1.5rem",
                            width: "3px",
                            borderRadius: "0 3px 3px 0",
                            background: `linear-gradient(to bottom, ${gcColorActive}, rgba(${gcActive}, 0.15))`,
                          }}
                        />
                        {/* Decorative quote mark */}
                        <div
                          style={{
                            position: "absolute",
                            top: "-1rem",
                            right: "0.8rem",
                            fontSize: "7rem",
                            lineHeight: 1,
                            color: `rgba(${gcActive}, 0.07)`,
                            fontFamily: dmSerif.style.fontFamily,
                            userSelect: "none",
                            pointerEvents: "none",
                          }}
                        >
                          "
                        </div>

                        {/* University logo */}
                        {activeMember.universityImg && !isMobile && (
                          <div style={{ position: "relative", width: "52px", height: "52px", marginBottom: "1rem" }}>
                            <Image
                              src={activeMember.universityImg}
                              alt={activeMember.university || activeMember.name}
                              fill
                              className="object-contain"
                            />
                          </div>
                        )}

                        {/* Mobile: logo + name/role inline */}
                        {isMobile ? (
                          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "0.6rem" }}>
                            {activeMember.universityImg && (
                              <div style={{ position: "relative", width: "40px", height: "40px", flexShrink: 0 }}>
                                <Image src={activeMember.universityImg} alt={activeMember.university || activeMember.name} fill className="object-contain" />
                              </div>
                            )}
                            <div>
                              <div style={{ fontFamily: dmSerif.style.fontFamily, fontSize: "0.95rem", color: "white", lineHeight: 1.2, marginBottom: "0.3rem", WebkitFontSmoothing: "antialiased" } as React.CSSProperties}>
                                {activeMember.fullName || activeMember.name}
                              </div>
                              <div style={{ display: "inline-flex", alignItems: "center", background: isDevActive ? "rgba(255,184,107,0.12)" : "rgba(192,132,252,0.12)", border: `1px solid ${isDevActive ? "rgba(255,184,107,0.35)" : "rgba(192,132,252,0.35)"}`, borderRadius: "999px", padding: "1px 8px", fontSize: "0.52rem", color: gcColorActive, letterSpacing: "0.15em", textTransform: "uppercase", fontFamily: dmSerif.style.fontFamily }}>
                                {activeMember.role}
                              </div>
                            </div>
                          </div>
                        ) : (
                          <>
                            {/* Full name */}
                            <div style={{ fontFamily: dmSerif.style.fontFamily, fontSize: "1.2rem", color: "white", lineHeight: 1.25, marginBottom: "0.5rem", WebkitFontSmoothing: "antialiased" } as React.CSSProperties}>
                              {activeMember.fullName || activeMember.name}
                            </div>
                            {/* Role badge */}
                            <div style={{ display: "inline-flex", alignItems: "center", background: isDevActive ? "rgba(255,184,107,0.12)" : "rgba(192,132,252,0.12)", border: `1px solid ${isDevActive ? "rgba(255,184,107,0.35)" : "rgba(192,132,252,0.35)"}`, borderRadius: "999px", padding: "2px 10px", fontSize: "0.58rem", color: gcColorActive, letterSpacing: "0.15em", textTransform: "uppercase", fontFamily: dmSerif.style.fontFamily, marginBottom: "0.85rem" }}>
                              {activeMember.role}
                            </div>
                          </>
                        )}

                        {/* Divider */}
                        <div style={{ width: "100%", height: "1px", background: "rgba(255,255,255,0.07)", marginBottom: isMobile ? "0.6rem" : "0.85rem" }} />

                        {/* Position */}
                        {activeMember.position && (
                          <div style={{ fontSize: isMobile ? "0.62rem" : "0.7rem", color: gcColorActive, letterSpacing: "0.12em", textTransform: "uppercase", fontFamily: dmSerif.style.fontFamily, marginBottom: "0.4rem", WebkitFontSmoothing: "antialiased" } as React.CSSProperties}>
                            {activeMember.position}
                          </div>
                        )}

                        {/* University */}
                        {activeMember.university && (
                          <div style={{ fontSize: isMobile ? "0.65rem" : "0.76rem", color: "rgba(255,255,255,0.42)", fontFamily: dmSerif.style.fontFamily, marginBottom: "0.3rem", lineHeight: 1.5, WebkitFontSmoothing: "antialiased" } as React.CSSProperties}>
                            {activeMember.university}
                          </div>
                        )}

                        {/* Project */}
                        {(() => {
                          const projects = activeMember.projects ?? (activeMember.project ? [{ name: activeMember.project, logo: activeMember.projectLogo ?? "" }] : []);
                          if (projects.length === 0) return null;
                          return (
                            <>
                              <div style={{ width: "100%", height: "1px", background: "rgba(255,255,255,0.07)", margin: isMobile ? "0.5rem 0" : "0.75rem 0" }} />
                              <div style={{ display: "flex", flexDirection: "column", gap: "0.45rem" }}>
                                {projects.map((p, pi) => (
                                  <div key={pi} style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
                                    {p.logo && (
                                      <div style={{ position: "relative", width: "24px", height: "24px", flexShrink: 0 }}>
                                        <Image src={p.logo} alt={p.name} fill className="object-contain" />
                                      </div>
                                    )}
                                    <div style={{ fontSize: "0.68rem", color: "rgba(255,255,255,0.65)", fontFamily: dmSerif.style.fontFamily, WebkitFontSmoothing: "antialiased" } as React.CSSProperties}>
                                      {p.name}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </>
                          );
                        })()}

                        {/* Contact button */}
                        {activeMember.email && (
                          <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", marginTop: isMobile ? "0.6rem" : "1rem" }}>
                            <a
                              href={`mailto:${activeMember.email}`}
                              title={activeMember.email}
                              style={{
                                display: "inline-flex",
                                alignItems: "center",
                                justifyContent: "center",
                                width: "32px",
                                height: "32px",
                                borderRadius: "50%",
                                background: isDevActive ? "rgba(255,184,107,0.12)" : "rgba(192,132,252,0.12)",
                                border: `1px solid ${isDevActive ? "rgba(255,184,107,0.4)" : "rgba(192,132,252,0.4)"}`,
                                color: gcColorActive,
                                fontSize: "0.9rem",
                                textDecoration: "none",
                                transition: "background 0.2s ease, transform 0.15s ease",
                                flexShrink: 0,
                              } as React.CSSProperties}
                              onMouseEnter={e => { (e.currentTarget as HTMLAnchorElement).style.background = isDevActive ? "rgba(255,184,107,0.22)" : "rgba(192,132,252,0.22)"; (e.currentTarget as HTMLAnchorElement).style.transform = "scale(1.1)"; }}
                              onMouseLeave={e => { (e.currentTarget as HTMLAnchorElement).style.background = isDevActive ? "rgba(255,184,107,0.12)" : "rgba(192,132,252,0.12)"; (e.currentTarget as HTMLAnchorElement).style.transform = "scale(1)"; }}
                            >
                              ✉
                            </a>
                            <span style={{ fontSize: "0.58rem", color: "rgba(255,255,255,0.45)", fontFamily: dmSerif.style.fontFamily, wordBreak: "break-all", lineHeight: 1.4, WebkitFontSmoothing: "antialiased" } as React.CSSProperties}>
                              {activeMember.email}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Navigation buttons + counter */}
                  <div className="absolute bottom-8 left-0 right-0 flex flex-col items-center gap-3">
                    <div className="flex items-center gap-6">
                      <button
                        onClick={() => {
                          const cur = Math.min(12, Math.floor(teamProgress * 13));
                          if (cur > 0) handleCardNav(cur - 1);
                        }}
                        style={{
                          width: "44px", height: "44px", borderRadius: "50%",
                          background: "rgba(255,255,255,0.06)",
                          border: "1px solid rgba(255,255,255,0.15)",
                          color: "rgba(255,255,255,0.75)",
                          fontSize: "1.5rem", lineHeight: 1,
                          display: "flex", alignItems: "center", justifyContent: "center",
                          cursor: "pointer",
                          backdropFilter: "blur(8px)",
                          transition: "background 0.2s ease, transform 0.15s ease",
                          fontFamily: "sans-serif",
                        }}
                        onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = "rgba(255,255,255,0.15)"; (e.currentTarget as HTMLButtonElement).style.transform = "scale(1.1)"; }}
                        onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = "rgba(255,255,255,0.06)"; (e.currentTarget as HTMLButtonElement).style.transform = "scale(1)"; }}
                      >
                        ‹
                      </button>
                      <span style={{ fontFamily: dmSerif.style.fontFamily, fontSize: "0.75rem", color: "rgba(255,255,255,0.35)", letterSpacing: "0.2em", minWidth: "3rem", textAlign: "center" }}>
                        {Math.min(13, Math.floor(teamProgress * 13) + 1)} / 13
                      </span>
                      <button
                        onClick={() => {
                          const cur = Math.min(12, Math.floor(teamProgress * 13));
                          if (cur < 12) handleCardNav(cur + 1);
                        }}
                        style={{
                          width: "44px", height: "44px", borderRadius: "50%",
                          background: "rgba(255,255,255,0.06)",
                          border: "1px solid rgba(255,255,255,0.15)",
                          color: "rgba(255,255,255,0.75)",
                          fontSize: "1.5rem", lineHeight: 1,
                          display: "flex", alignItems: "center", justifyContent: "center",
                          cursor: "pointer",
                          backdropFilter: "blur(8px)",
                          transition: "background 0.2s ease, transform 0.15s ease",
                          fontFamily: "sans-serif",
                        }}
                        onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = "rgba(255,255,255,0.15)"; (e.currentTarget as HTMLButtonElement).style.transform = "scale(1.1)"; }}
                        onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = "rgba(255,255,255,0.06)"; (e.currentTarget as HTMLButtonElement).style.transform = "scale(1)"; }}
                      >
                        ›
                      </button>
                    </div>
                    <div style={{ width: "120px", height: "2px", background: "rgba(255,255,255,0.1)", borderRadius: "999px", overflow: "hidden" }}>
                      <div style={{ width: `${teamProgress * 100}%`, height: "100%", background: "#FFB86B", borderRadius: "999px", transition: "width 300ms ease" }} />
                    </div>
                  </div>
                </>
              );
            })()}

          </div>
        </section>
      </main>
    </div>
  );
}
