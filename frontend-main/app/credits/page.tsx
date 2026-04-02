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

// 2D noise helper for topographic contour generation
function noise2D(x: number, y: number, seed: number): number {
  const dot = x * 12.9898 + y * 78.233 + seed * 43.1234;
  const s = Math.sin(dot) * 43758.5453;
  return s - Math.floor(s);
}

function smoothNoise(x: number, y: number, seed: number): number {
  const ix = Math.floor(x);
  const iy = Math.floor(y);
  const fx = x - ix;
  const fy = y - iy;
  const u = fx * fx * (3 - 2 * fx);
  const v = fy * fy * (3 - 2 * fy);

  const a = noise2D(ix, iy, seed);
  const b = noise2D(ix + 1, iy, seed);
  const c = noise2D(ix, iy + 1, seed);
  const d = noise2D(ix + 1, iy + 1, seed);

  return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
}

function fbm(x: number, y: number, seed: number, octaves = 5): number {
  let val = 0;
  let amp = 0.5;
  let freq = 1;
  for (let i = 0; i < octaves; i++) {
    val += amp * smoothNoise(x * freq, y * freq, seed + i * 17.3);
    amp *= 0.5;
    freq *= 2;
  }
  return val;
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

  // Topographic contour map canvas (matching reference image style)
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let width = 0;
    let height = 0;
    let pageHeight = 0;

    const resize = () => {
      width = canvas.width = window.innerWidth;
      pageHeight = document.documentElement.scrollHeight;
      height = canvas.height = pageHeight;
    };

    const onMouseMove = (e: MouseEvent) => {
      mouseRef.current = { x: e.clientX, y: e.clientY + window.scrollY };
    };

    resize();
    window.addEventListener("resize", resize);
    window.addEventListener("mousemove", onMouseMove);

    let time = 0;

    const contourLevels = 12;
    const gridStep = 6;

    const animate = () => {
      time += 0.025;
      ctx.clearRect(0, 0, width, height);

      // Build scalar field using fbm noise
      const cols = Math.ceil(width / gridStep) + 1;
      const rows = Math.ceil(height / gridStep) + 1;
      const field = new Float32Array(cols * rows);

      const mx = mouseRef.current.x;
      const my = mouseRef.current.y;

      for (let gy = 0; gy < rows; gy++) {
        for (let gx = 0; gx < cols; gx++) {
          const px = gx * gridStep;
          const py = gy * gridStep;
          // Use time only as phase — field topology stays fixed, just breathes
          const nx = px * 0.003;
          const ny = py * 0.003;
          let val = fbm(
            nx + Math.sin(time * 0.4) * 0.3,
            ny + Math.cos(time * 0.3) * 0.3,
            42
          );

          // Mouse distortion
          const dx = px - mx;
          const dy = py - my;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 250) {
            const strength = (1 - dist / 250);
            val += strength * strength * 0.35;
          }

          field[gy * cols + gx] = val;
        }
      }

      // Marching squares for contour lines
      for (let level = 0; level < contourLevels; level++) {
        const threshold = level / contourLevels;
        const alpha = 0.35 + Math.sin(time * 0.5 + level * 0.4) * 0.12;

        ctx.beginPath();
        ctx.strokeStyle = `rgba(255, 184, 107, ${alpha})`;
        ctx.lineWidth = 0.8;

        for (let gy = 0; gy < rows - 1; gy++) {
          for (let gx = 0; gx < cols - 1; gx++) {
            const i = gy * cols + gx;
            const a = field[i];
            const b = field[i + 1];
            const c = field[i + cols + 1];
            const d = field[i + cols];

            const state =
              (a >= threshold ? 8 : 0) |
              (b >= threshold ? 4 : 0) |
              (c >= threshold ? 2 : 0) |
              (d >= threshold ? 1 : 0);

            if (state === 0 || state === 15) continue;

            const x0 = gx * gridStep;
            const y0 = gy * gridStep;
            const x1 = x0 + gridStep;
            const y1 = y0 + gridStep;

            const lerp = (v1: number, v2: number) => {
              const denom = v2 - v1;
              if (Math.abs(denom) < 0.0001) return 0.5;
              return (threshold - v1) / denom;
            };

            const topX = x0 + lerp(a, b) * gridStep;
            const rightY = y0 + lerp(b, c) * gridStep;
            const bottomX = x0 + lerp(d, c) * gridStep;
            const leftY = y0 + lerp(a, d) * gridStep;

            const segments: [number, number, number, number][] = [];

            switch (state) {
              case 1: case 14: segments.push([x0, leftY, bottomX, y1]); break;
              case 2: case 13: segments.push([bottomX, y1, x1, rightY]); break;
              case 3: case 12: segments.push([x0, leftY, x1, rightY]); break;
              case 4: case 11: segments.push([topX, y0, x1, rightY]); break;
              case 5:
                segments.push([x0, leftY, topX, y0]);
                segments.push([bottomX, y1, x1, rightY]);
                break;
              case 6: case 9: segments.push([topX, y0, bottomX, y1]); break;
              case 7: case 8: segments.push([x0, leftY, topX, y0]); break;
              case 10:
                segments.push([topX, y0, x1, rightY]);
                segments.push([x0, leftY, bottomX, y1]);
                break;
            }

            for (const [sx, sy, ex, ey] of segments) {
              ctx.moveTo(sx, sy);
              ctx.lineTo(ex, ey);
            }
          }
        }
        ctx.stroke();
      }

      frameRef.current = requestAnimationFrame(animate);
    };

    frameRef.current = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(frameRef.current);
      window.removeEventListener("resize", resize);
      window.removeEventListener("mousemove", onMouseMove);
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
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 credits-nav-glass ${
          navHidden
            ? "-translate-y-full opacity-0"
            : "translate-y-0 opacity-100"
        }`}
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
              className={`z-10 flex flex-col items-center justify-center transition-opacity duration-[1800ms] ease-out ${heroVisible ? "opacity-100" : "opacity-0"}`}
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
                className="text-white font-normal tracking-[0.25em] uppercase drop-shadow-md"
                style={{
                  fontSize: `clamp(1rem, ${2.5 - scrollProgress * 1}rem, 2.5rem)`,
                }}
              >
                Meet the Team
              </h2>

              {/* Initial text: PEA Internship Present - fades out on scroll */}
              <div
                className="flex items-baseline gap-3 mt-2"
                style={{
                  opacity: Math.max(0, 1 - scrollProgress * 3),
                  transform: `translateY(${scrollProgress * -20}px)`,
                  position: scrollProgress > 0.5 ? "absolute" : "relative",
                  pointerEvents: scrollProgress > 0.3 ? "none" : "auto",
                }}
              >
                <span
                  className="text-primary-600 italic drop-shadow-sm"
                  style={{
                    fontSize: `clamp(1.5rem, ${4 - scrollProgress * 1.5}rem, 4rem)`,
                  }}
                >
                  PEA Internship
                </span>
                <span
                  className="text-white drop-shadow-sm uppercase"
                  style={{
                    fontSize: `clamp(1.5rem, ${4 - scrollProgress * 1.5}rem, 4rem)`,
                  }}
                >
                  Present
                </span>
              </div>

              {/* Final text: Our Designers - fades in on scroll */}
              <h1
                className="text-purple-900 italic mt-2 drop-shadow-sm"
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
