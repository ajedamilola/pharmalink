'use client';

import React from 'react';
import { Star } from 'lucide-react';
import TextHighlight from './animation/TextHighlight';

export default function About() {
  return (
    <section id="about" className="bg-[#050505] text-white py-20 px-4 md:px-12 font-[arimo]">
      <div className="max-w-[1400px] mx-auto flex flex-col gap-20">
        
        {/* Top Section */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
          
          {/* Main Content */}
          <div className="col-span-1 lg:col-span-8 flex flex-col gap-8">
            <TextHighlight 
              as="h2"
              text="We are passionate about **empowering** pharmacies and verified vendors to take control of their inventory and achieve **zero** **stockouts**."
              className="text-4xl md:text-5xl lg:text-6xl font-medium tracking-tight leading-[1.1]"
            />
            
            <p className="text-gray-400 text-lg md:text-xl max-w-2xl leading-relaxed">
              We are dedicated to revolutionizing the way pharmacies manage their drug supply chain. 
              Our team is committed to providing intuitive, AI-driven solutions that empower pharmacists 
              to easily restock through an automated, streamlined marketplace.
            </p>
          </div>

          {/* Right Content - Image & Rating */}
          <div className="col-span-1 lg:col-span-4 relative">
             <div className="relative w-full aspect-4/5 md:aspect-square lg:aspect-3/4 rounded-4xl overflow-hidden border border-white/10 group">
                <img 
                   src="/assets/home/image2.png" 
                   alt="Medical Professional" 
                   className="w-full h-full object-cover object-center transition-transform duration-700 group-hover:scale-105 grayscale-[0.2]"
                />
                
                {/* Floating Rating Badge */}
                <div className="absolute top-6 right-6 bg-black/40 border border-white/10 rounded-full px-4 py-2 flex items-center gap-3 backdrop-blur-md">
                     <div className="flex gap-1 text-[#22c55e]">
                        {[1, 2, 3, 4, 5].map((star) => (
                            <Star key={star} size={14} fill="#22c55e" />
                        ))}
                    </div>
                    <span className="text-xs font-medium text-white/90">
                        4.9/5
                    </span>
                </div>
             </div>
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-x-8 gap-y-12 border-t border-white/10 pt-16">
            
            {/* Stat 1 */}
            <div className="flex flex-col gap-2">
                <span className="text-5xl md:text-6xl font-medium text-white">
                    500<span className="text-[#22c55e] text-3xl">ms</span>
                </span>
                <p className="text-gray-400 text-sm leading-relaxed max-w-[150px]">
                    Sub-millisecond latency for real-time inventory synchronisation.
                </p>
            </div>

            {/* Stat 2 */}
            <div className="flex flex-col gap-2">
                <span className="text-5xl md:text-6xl font-medium text-white">
                    5<span className="text-[#22c55e] text-3xl">+</span>
                </span>
                <p className="text-gray-400 text-sm leading-relaxed max-w-[150px]">
                    Major verified vendors onboarded for fast delivery.
                </p>
            </div>

            {/* Stat 3 */}
            <div className="flex flex-col gap-2">
                <span className="text-5xl md:text-6xl font-medium text-white">
                    100<span className="text-[#22c55e] text-3xl">%</span>
                </span>
                <p className="text-gray-400 text-sm leading-relaxed max-w-[150px]">
                    Compliance with NAFDAC regulatory standards.
                </p>
            </div>

             {/* Stat 4 */}
             <div className="flex flex-col gap-2">
                <span className="text-5xl md:text-6xl font-medium text-white">
                    0<span className="text-[#22c55e] text-3xl">PII</span>
                </span>
                <p className="text-gray-400 text-sm leading-relaxed max-w-[150px]">
                    Automated buy-back processing for expiring drugs.
                </p>
            </div>

        </div>

      </div>
    </section>
  );
}
