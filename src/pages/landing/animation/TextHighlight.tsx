  "use client";

  import { useEffect, useRef } from "react";
  import gsap from "gsap";
  import { ScrollTrigger } from "gsap/ScrollTrigger";

  gsap.registerPlugin(ScrollTrigger);

  interface TextHighlightProps {
    text: string;
    className?: string;
    as?: "p" | "span" | "blockquote" | "h1" | "h2" | "h3";
  }

  export default function TextHighlight({ 
    text, 
    className = "", 
    as: Component = "p" 
  }: TextHighlightProps) {
    const containerRef = useRef<HTMLElement>(null);

    useEffect(() => {
      if (!containerRef.current) return;

      const chars = containerRef.current.querySelectorAll(".char");

      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: containerRef.current,
          start: "top 80%",
          end: "bottom 40%",
          scrub: true,
        }
      });

      tl.fromTo(chars, 
        { opacity: 0.2 },
        { 
          opacity: 1, 
          stagger: 0.1,
          ease: "none"
        }
      );

      const element = containerRef.current;
      return () => {
        ScrollTrigger.getAll().forEach(st => {
            if (st.vars.trigger === element) st.kill();
        });
      };
    }, []);

    // Manually split text into characters for the highlight effect
    const words = text.split(" ");

    return (
      <Component ref={containerRef as React.RefObject<any>} className={className}>
        {words.map((word, wIdx) => {
          const highlight = word.startsWith("**") && (word.endsWith("**") || word.endsWith("**.") || word.endsWith("**,"));
          let displayWord = word;
          if (highlight) {
            displayWord = word.replace(/\*\*/g, "");
          }
          
          return (
            <span 
                key={wIdx} 
                className={`inline-block whitespace-nowrap mr-[0.2em] ${highlight ? 'text-[#22c55e]' : ''}`}
            >
              {displayWord.split("").map((char, cIdx) => (
                <span key={cIdx} className="char inline-block opacity-20">
                  {char}
                </span>
              ))}
            </span>
          );
        })}
      </Component>
    );
  }

