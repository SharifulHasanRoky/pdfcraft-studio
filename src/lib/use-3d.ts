"use client";

import { useEffect, useRef, useState } from "react";

/**
 * 3D tilt hook — applies a mouse-tracking 3D rotation to an element.
 * Returns a ref to attach + tilt style info.
 *
 * Usage:
 *   const { ref, style } = useTilt();
 *   <div ref={ref} style={style}>...</div>
 */
export function useTilt(maxTilt: number = 8) {
  const ref = useRef<HTMLDivElement>(null);
  const [style, setStyle] = useState<React.CSSProperties>({
    transform: "perspective(1000px) rotateX(0deg) rotateY(0deg) translateZ(0px)",
    transition: "transform 0.2s ease-out",
  });

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia("(hover: none)").matches) return; // skip on touch

    const handleMove = (e: MouseEvent) => {
      const rect = el.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width;
      const y = (e.clientY - rect.top) / rect.height;
      const tiltX = (0.5 - y) * maxTilt * 2;
      const tiltY = (x - 0.5) * maxTilt * 2;
      setStyle({
        transform: `perspective(1000px) rotateX(${tiltX}deg) rotateY(${tiltY}deg) translateZ(20px)`,
        transition: "transform 0.1s ease-out",
      });
    };
    const handleLeave = () => {
      setStyle({
        transform: "perspective(1000px) rotateX(0deg) rotateY(0deg) translateZ(0px)",
        transition: "transform 0.4s ease-out",
      });
    };

    el.addEventListener("mousemove", handleMove);
    el.addEventListener("mouseleave", handleLeave);
    return () => {
      el.removeEventListener("mousemove", handleMove);
      el.removeEventListener("mouseleave", handleLeave);
    };
  }, [maxTilt]);

  return { ref, style };
}

/**
 * Count-up animation hook — animates a number from 0 to target when the
 * element enters the viewport.
 *
 * Usage:
 *   const { ref, value } = useCountUp(50000);
 *   <div ref={ref}>{value}+</div>
 */
export function useCountUp(target: number, duration: number = 2000) {
  const ref = useRef<HTMLDivElement>(null);
  const [value, setValue] = useState(0);
  const startedRef = useRef(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !startedRef.current) {
          startedRef.current = true;
          const startTime = performance.now();
          const animate = (now: number) => {
            const elapsed = now - startTime;
            const progress = Math.min(elapsed / duration, 1);
            // Ease out cubic
            const eased = 1 - Math.pow(1 - progress, 3);
            setValue(Math.floor(eased * target));
            if (progress < 1) {
              requestAnimationFrame(animate);
            } else {
              setValue(target);
            }
          };
          requestAnimationFrame(animate);
        }
      },
      { threshold: 0.3 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [target, duration]);

  return { ref, value };
}

/**
 * Mouse parallax hook — tracks the global mouse position and returns
 * a value between -1 and 1 for both axes, useful for parallax effects.
 *
 * Usage:
 *   const { x, y } = useParallax();
 *   <div style={{ transform: `translate(${x * 20}px, ${y * 20}px)` }} />
 */
export function useParallax() {
  const [pos, setPos] = useState({ x: 0, y: 0 });

  useEffect(() => {
    if (window.matchMedia("(hover: none)").matches) return;
    const handleMove = (e: MouseEvent) => {
      const x = (e.clientX / window.innerWidth - 0.5) * 2;
      const y = (e.clientY / window.innerHeight - 0.5) * 2;
      setPos({ x, y });
    };
    window.addEventListener("mousemove", handleMove);
    return () => window.removeEventListener("mousemove", handleMove);
  }, []);

  return pos;
}

/**
 * Scroll-triggered fade-in hook — returns true when the element is in viewport.
 *
 * Usage:
 *   const { ref, inView } = useInView();
 *   <div ref={ref} className={inView ? 'animate-in' : ''} />
 */
export function useInView<T extends Element = HTMLDivElement>(threshold: number = 0.2) {
  const ref = useRef<T>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          observer.disconnect();
        }
      },
      { threshold }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [threshold]);

  return { ref, inView };
}
