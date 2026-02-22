import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Globe } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-[#050505] text-white font-[arimo]">
      <div className="max-w-[1400px] mx-auto px-4 md:px-8 pt-20 pb-10">
        
        {/* Top Section */}
        <div className="flex flex-col md:flex-row justify-between items-start gap-12 mb-20">
            {/* Left Info */}
            <div className="max-w-xl space-y-8 w-full">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-1 bg-[#22c55e] rounded-full"></div>
                    <p className="text-white/60 text-sm">
                        Uncover the power of autonomous inventory management at
                    </p>
                </div>
                
                <a href="mailto:hello@pharmalink.ng" className="text-3xl md:text-6xl font-bold tracking-tight hover:text-[#22c55e] transition-colors inline-block border-b border-white/20 pb-2 break-all md:break-normal">
                    hello@pharmalink.ng
                </a>
            </div>

            {/* Right Card - Lime */}
            <Link to="/login" className="bg-[#22c55e] rounded-[2rem] p-8 w-full md:w-72 h-64 md:h-72 flex flex-col justify-between text-black relative group overflow-hidden cursor-pointer transition-transform hover:-translate-y-2">
                 <h3 className="text-2xl font-medium">Get Started</h3>
                 
                 <div className="bg-black text-white rounded-full px-6 py-3 flex items-center justify-between group-hover:bg-[#1a1a1a] transition-colors">
                     <span className="text-sm font-medium">Go</span>
                     <ArrowRight size={18} />
                 </div>
            </Link>
        </div>

        {/* Middle Section - Links & Address */}
        <div className="flex flex-col md:flex-row justify-between items-start gap-12 mb-24">
            <div className="flex flex-col gap-4 text-xl md:text-2xl font-medium">
                 <Link to="/#about" className="hover:text-[#22c55e] transition-colors">About</Link>
                 <Link to="/#story" className="hover:text-[#22c55e] transition-colors">Story</Link>
                 <Link to="/#solutions" className="hover:text-[#22c55e] transition-colors">Solution</Link>
                 <Link to="/#process" className="hover:text-[#22c55e] transition-colors">Process</Link>
                 <Link to="/#faq" className="hover:text-[#22c55e] transition-colors">FAQ</Link>
            </div>

            <div className="text-left md:text-right">
                <h4 className="text-xl md:text-2xl font-medium mb-4">Office</h4>
                <div className="text-white/60 leading-relaxed text-sm md:text-base">
                    12 Adeola Odeku St,<br/>
                    Victoria Island,<br/>
                    Lagos 101241
                </div>
            </div>
        </div>

        {/* Massive Brand Text */}
        <div className="w-full overflow-hidden border-t border-white/10 pt-4">
             <h1 className="text-[17vw] leading-[0.8] font-normal tracking-tighter text-center select-none uppercase">
                 PharmaLink
             </h1>
        </div>

      </div>

      {/* Bottom Bar - Purple Strip */}
      <div className="bg-[#22c55e] text-black w-full py-6 px-4 md:px-8">
          <div className="max-w-[1400px] mx-auto flex flex-col md:flex-row justify-between items-center gap-4 text-xs font-bold uppercase tracking-wider">
              <span>Copyright © PharmaLink 2026</span>
              
              <div className="flex items-center gap-2">
                  <Globe size={14} />
                  <span>Lagos, NG</span>
              </div>

              <div className="flex gap-8">
                  <Link to="#" className="hover:opacity-70">Instagram</Link>
                  <Link to="#" className="hover:opacity-70">LinkedIn</Link>
              </div>
          </div>
      </div>
    </footer>
  );
}
