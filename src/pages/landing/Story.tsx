'use client';

import React from 'react';
import { Quote } from 'lucide-react';
import TextHighlight from './animation/TextHighlight';

export default function Story() {
  return (
    <section id="story" className="bg-[#050505] text-white py-24 px-4 md:px-12 font-[arimo]">
      <div className="max-w-[1400px] mx-auto">
        
        {/* Header - More Detailed Context */}
        <div className="mb-20 space-y-6 max-w-4xl">
           <span className="text-[#22c55e] font-bold uppercase tracking-[0.2em] text-sm">Deep Dive: Our Story</span>
           <TextHighlight 
             as="h2"
             text="Bridging the gap between Critical Need & **Immediate** **Care.**"
             className="text-5xl md:text-7xl font-medium tracking-tighter leading-tight"
           />
        </div>

        {/* Narrative Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 lg:gap-24">
          
          {/* Left: The Motivation (Detailed Narrative) */}
          <div className="col-span-1 lg:col-span-7 space-y-12">
            <div className="space-y-6">
                <h3 className="text-3xl font-medium text-white flex items-center gap-4">
                    <span className="w-10 h-px bg-[#22c55e]"></span>
                    The Inception
                </h3>
                <p className="text-xl text-white/70 leading-relaxed font-light">
                   PharmaLink wasn&apos;t born in a sterile lab, but in the back rooms of busy pharmacies in Lagos. 
                   We witnessed a supply chain failure: pharmacies running out of critical drugs and struggling to restock. 
                   Manual inventory checks and fragmented vendor communications were slowing down life-saving availability.
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 ring-1 ring-white/10 p-8 rounded-[2.5rem] bg-white/5 backdrop-blur-sm">
                <div className="space-y-4">
                    <div className="w-12 h-12 bg-red-500/20 rounded-full flex items-center justify-center text-red-400">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 9v4m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 17c-.77 1.333.192 3 1.732 3z"/></svg>
                    </div>
                    <h4 className="text-xl font-bold">The Problem</h4>
                    <p className="text-sm text-white/60">
                        Inefficient inventory tracking leading to stockouts and preventable delays in patient care.
                    </p>
                </div>
                <div className="space-y-4">
                    <div className="w-12 h-12 bg-[#22c55e]/20 rounded-full flex items-center justify-center text-[#22c55e]">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 13l4 4L19 7"/></svg>
                    </div>
                    <h4 className="text-xl font-bold">The Solution</h4>
                    <p className="text-sm text-white/60">
                        Automated inventory management and smart procurement connecting pharmacies to verified vendors instantly.
                    </p>
                </div>
            </div>

            <div className="space-y-8">
               <h3 className="text-3xl font-medium text-white">Technological Infrastructure</h3>
               <div className="space-y-6">
                   <div className="flex gap-6 group">
                       <span className="text-[#22c55e] font-mono text-xl">01</span>
                       <div>
                           <h5 className="text-xl font-bold mb-1 group-hover:text-[#22c55e] transition-colors">Real-time Sync Engine</h5>
                           <p className="text-white/50">Utilizing real-time database technology to achieve sub-500ms synchronization across all branches.</p>
                       </div>
                   </div>
                   <div className="flex gap-6 group">
                       <span className="text-[#22c55e] font-mono text-xl">02</span>
                       <div>
                           <h5 className="text-xl font-bold mb-1 group-hover:text-[#22c55e] transition-colors">Multi-Vendor Architecture</h5>
                           <p className="text-white/50">Native support for various verification levels ensures no pharmacy is left behind due to regulatory barriers.</p>
                       </div>
                   </div>
               </div>
            </div>
          </div>

          {/* Right: Visual Narrative & Quote */}
          <div className="col-span-1 lg:col-span-5 flex flex-col gap-12">
            <div className="relative aspect-3/4 rounded-[3.5rem] overflow-hidden border border-white/10 group">
                <img 
                    src="/assets/home/image3.jpg" 
                    alt="PharmaLink Impact" 
                    className="w-full h-full object-cover grayscale-[0.5] group-hover:grayscale-0 transition-all duration-700"
                />
                <div className="absolute inset-0 bg-linear-to-b from-transparent via-transparent to-[#22c55e]/20"></div>
                
                <div className="absolute bottom-10 left-10 right-10">
                    <div className="bg-black/60 backdrop-blur-2xl border border-white/20 p-8 rounded-3xl">
                        <Quote className="text-[#22c55e] mb-6" size={40} />
                        <p className="text-2xl font-medium leading-tight">
                            &quot;Pharmacy supply chain in Nigeria needed a new backbone. PharmaLink is that backbone.&quot;
                        </p>
                        <div className="mt-8 flex items-center gap-4">
                            <div className="w-10 h-px bg-[#22c55e]"></div>
                            <span className="text-xs font-bold uppercase tracking-widest text-white/60">Legacy Of Care</span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="bg-[#22c55e] rounded-[2.5rem] p-10 flex flex-col gap-6 text-black">
                <div className="space-y-2">
                    <span className="text-4xl font-black">99.9%</span>
                    <p className="font-bold uppercase text-xs tracking-tighter">Stock Accuracy</p>
                </div>
                <p className="text-lg leading-snug font-medium">
                    Our system synchronizes thousands of inventory items to ensure the highest reliability standards in automated restocking.
                </p>
                <div className="pt-4 mt-auto">
                    <div className="w-full h-px bg-black/20 mb-4"></div>
                    <span className="text-xs font-bold opacity-60">NAFDAC COMPLIANT • SECURE</span>
                </div>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
