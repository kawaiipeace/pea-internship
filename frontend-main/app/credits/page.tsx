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
const _GRAD: [number, number][] = [[1,1],[-1,1],[1,-1],[-1,-1],[1,0],[-1,0],[0,1],[0,-1]];
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
  let t0 = 0.5 - x0*x0 - y0*y0;
  if (t0 > 0) { t0 *= t0; const g = _GRAD[_permMod8[ii + _perm[jj]]]; n0 = t0*t0*(g[0]*x0+g[1]*y0); }
  let t1 = 0.5 - x1*x1 - y1*y1;
  if (t1 > 0) { t1 *= t1; const g = _GRAD[_permMod8[ii+i1+_perm[jj+j1]]]; n1 = t1*t1*(g[0]*x1+g[1]*y1); }
  let t2 = 0.5 - x2*x2 - y2*y2;
  if (t2 > 0) { t2 *= t2; const g = _GRAD[_permMod8[ii+1+_perm[jj+1]]]; n2 = t2*t2*(g[0]*x2+g[1]*y2); }
  return 70 * (n0 + n1 + n2);
}

// ============================================================
// Marching-squares edge table  (Bits: TL=8 TR=4 BR=2 BL=1)
// ============================================================
const _EDGES: [number, number][][] = [
  [],             // 0
  [[3,2]],        // 1
  [[2,1]],        // 2
  [[3,1]],        // 3
  [[0,1]],        // 4
  [[0,3],[2,1]],  // 5 saddle
  [[0,2]],        // 6
  [[0,3]],        // 7
  [[0,3]],        // 8
  [[0,2]],        // 9
  [[0,1],[3,2]],  // 10 saddle
  [[0,1]],        // 11
  [[3,1]],        // 12
  [[2,1]],        // 13
  [[3,2]],        // 14
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

  // Hero fade-in on mount
  useEffect(() => {
    const t = setTimeout(() => setHeroVisible(true), 200);
    return () => clearTimeout(t);
  }, []);

  // Scroll-driven hero shrink
  useEffect(() => {
    let ticking = false;
    const onScroll = () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          const maxScroll = window.innerHeight * 0.7;
          const progress = Math.min(1, Math.max(0, window.scrollY / maxScroll));
          setScrollProgress(progress);
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
    const opacities  = [ 0.04,  0.07,  0.10, 0.12, 0.10, 0.07,  0.04];
    const widths     = [ 0.8,   1.0,   1.3,  1.5,  1.3,  1.0,   0.8 ];
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
            const br = field[(r+1) * cols + c + 1];
            const bl = field[(r+1) * cols + c];

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
      <span style={{color:'#FFB86B'}}>for Life </span>
      <span className="text-white">Quality </span>
      <span className="inline-block w-16" />
      <span className="text-white">Brightness </span>
      <span style={{color:'#FFB86B'}}>for Life </span>
      <span className="text-white">Quality </span>
      <span className="inline-block w-16" />
      <span className="text-white">Brightness </span>
      <span style={{color:'#FFB86B'}}>for Life </span>
      <span className="text-white">Quality </span>
      <span className="inline-block w-16" />
    </>
  );

  const marqueeSegment2 = (
    <>
      <span style={{color:'#FFB86B'}}>Smart Energy </span>
      <span className="text-white">for </span>
      <span style={{color:'#FFB86B'}}>Better Life </span>
      <span className="text-white">and Sustainability </span>
      <span className="inline-block w-16" />
      <span style={{color:'#FFB86B'}}>Smart Energy </span>
      <span className="text-white">for </span>
      <span style={{color:'#FFB86B'}}>Better Life </span>
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
              className={`transition-all duration-700 ${
                visibleLines[i]
                  ? "opacity-100 translate-y-0"
                  : "opacity-0 translate-y-8"
              }`}
              style={{ transitionDelay: `${i * 120}ms` }}
            >
              <p className="text-xl sm:text-2xl md:text-4xl lg:text-5xl leading-snug md:leading-tight italic uppercase mb-1 md:mb-2">
                <span className="text-white">{line.text}</span>
                {line.highlight && (
                  <span style={{color:'#FFB86B'}}>{line.highlight}</span>
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
              className={`transition-all duration-[600ms] ${
                visibleLogos[i]
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
      </main>
    </div>
  );
}
