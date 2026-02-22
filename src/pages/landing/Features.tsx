'use client';

import React, { useEffect, useRef } from 'react';
import { Sparkles, Mic2 } from 'lucide-react';
import TextHighlight from './animation/TextHighlight';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

export default function Features() {
  const containerRef = useRef<HTMLDivElement>(null);
  const visualRefs = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    if (!containerRef.current) return;

    const ctx = gsap.context(() => {
      visualRefs.current.forEach((el, i) => {
        if (!el) return;
        gsap.fromTo(el, 
          { scale: 0.8, opacity: 0, rotate: i % 2 === 0 ? -10 : 10 },
          { 
            scale: 1, 
            opacity: 1, 
            rotate: i === 2 ? 12 : 0, // Keep the 12deg rotation for the last one
            duration: 1.2,
            ease: "elastic.out(1, 0.5)",
            scrollTrigger: {
              trigger: el,
              start: "top 90%",
            }
          }
        );
      });
    }, containerRef);

    return () => ctx.revert();
  }, []);

  return (
    <section id="solutions" ref={containerRef} className="bg-[#050505] py-20 px-4 md:px-8 font-[arimo] overflow-hidden">
      <div className="max-w-[1400px] mx-auto">
        <div className="flex flex-col items-center justify-center text-center">
            
            {/* Line 1: Medical of [Image] Future */}
            <div className="flex flex-wrap items-center justify-center gap-4 md:gap-8 mb-4 md:mb-6">
                <TextHighlight 
                    as="span"
                    text="Pharmacy of"
                    className="text-5xl md:text-8xl lg:text-8xl xl:text-[8rem] font-normal tracking-tight text-white/90"
                />
                <div 
                  ref={el => { visualRefs.current[0] = el; }}
                  className="relative w-32 h-16 md:w-56 md:h-24 lg:w-72 lg:h-32 rounded-full overflow-hidden bg-white/5 flex items-center justify-center border border-white/10"
                >
                     <img 
                        src="/assets/home/image1.jpg" 
                        alt="Medical Future" 
                        className="w-full h-full object-cover opacity-80 scale-125 grayscale-[0.3]"
                     />
                </div>
                <TextHighlight 
                    as="span"
                    text="future."
                    className="text-5xl md:text-8xl lg:text-9xl xl:text-[7rem] font-normal tracking-tight text-white/90"
                />
            </div>

            {/* Line 2: [Icon] AI-Powered */}
            <div className="flex flex-wrap items-center justify-center gap-4 md:gap-8 mb-4 md:mb-6">
                 <div 
                    ref={el => { visualRefs.current[1] = el; }}
                    className="w-12 h-12 md:w-20 md:h-20 lg:w-28 lg:h-28 bg-white/10 rounded-full flex items-center justify-center text-white border border-white/10 shadow-[0_0_30px_rgba(204,255,0,0.1)]"
                 >
                      <Sparkles className="w-6 h-6 md:w-10 md:h-10 lg:w-14 lg:h-14 text-[#22c55e]" />
                 </div>
                 <TextHighlight 
                    as="span"
                    text="Smart Supply"
                    className="text-5xl md:text-8xl lg:text-8xl xl:text-[8rem] font-normal tracking-tight text-white/90"
                />
            </div>

            {/* Line 3: triage [Image] agent */}
            <div className="flex flex-wrap items-center justify-center gap-4 md:gap-8">
                 <TextHighlight 
                    as="span"
                    text="inventory"
                    className="text-5xl md:text-8xl lg:text-9xl xl:text-[9rem] font-normal tracking-tight text-white/90"
                />
                 <div 
                    ref={el => { visualRefs.current[2] = el; }}
                    className="relative w-24 h-24 md:w-40 md:h-40 lg:w-52 lg:h-52"
                 >
                      <div className="w-full h-full bg-[#1a1a1a] rounded-3xl flex items-center justify-center transform rotate-12 shadow-2xl hover:rotate-0 transition-transform duration-500 border border-white/10 relative z-10">
                           <Mic2 className="w-12 h-12 md:w-20 md:h-20 lg:w-24 lg:h-24 text-white/90" />
                      </div>
                      <div className="absolute -top-4 -right-4 w-12 h-12 bg-[#22c55e] rounded-full mix-blend-overlay opacity-80 blur-xl animate-pulse"></div>
                      <div className="absolute -bottom-4 -left-4 w-10 h-10 bg-blue-500 rounded-full mix-blend-overlay opacity-40 blur-xl"></div>
                 </div>
                 <TextHighlight 
                    as="span"
                    text="system"
                    className="text-5xl md:text-8xl lg:text-9xl xl:text-[9rem] font-normal tracking-tight text-white/90"
                />
            </div>

        </div>
      </div>
    </section>
  );
}
