"use client";

import React from "react";
import { Activity, Mic } from "lucide-react";
import { Link } from 'react-router-dom';

export default function Home() {
  return (
    <main className="flex flex-col gap-12 pt-46 md:mt-36">
      {/* Centered Heading */}
      <div className="text-center space-y-2 relative z-10">
        <h1 className="text-5xl md:text-8xl lg:text-9xl tracking-tight text-green-950/90">
          PharmaLink:{" "}
          <span className="text-green-950 bg-[#22c55e] px-4 rounded-3xl">
            Inventory
          </span>
        </h1>
        <h1 className="text-5xl md:text-8xl lg:text-9xl font-medium tracking-tight text-[#22c55e] flex items-center justify-center gap-4 flex-wrap">
          Supply Chain
          <div className="hidden md:flex -mb-4">
            {/* Decorative element or small icon if needed */}
          </div>
        </h1>
      </div>

      {/* content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 w-full max-w-[1400px] mx-auto mt-4">
        {/* Left Column - Utilities */}
        <div className="col-span-1 lg:col-span-4 flex flex-col justify-end gap-12 relative">
          {/* Subtext */}
          <div className="max-w-xs">
            <p className="text-xl md:text-2xl font-light text-green-950/80 leading-relaxed max-w-2xl mx-auto">
              Solving inventory chaos in our pharmacies.
              <br />
              <span className="text-green-950/60 text-lg block mt-4">
                Streamlining supply with{" "}
                <span className="text-[#22c55e]">Smart Restock & Buy-Backs</span>.
              </span>
            </p>
          </div>

          {/* App & Utilities Group */}
          <div className="flex flex-col gap-8">
            {/* Get App Row */}
            <div className="flex items-center gap-8">
              <div className="flex flex-col gap-4 bg-green-950/5 border border-green-950/10 rounded-3xl p-6 backdrop-blur-sm">
                <span className="btext-lg font-medium text-green-950">Smart Procurement</span>
                <p className="text-xs text-green-950/60 max-w-[150px]">
                  Connects pharmacies and verified vendors instantly.
                </p>
                <div className="flex gap-3 mt-2">
                  {/* Voice Icon */}
                  <div className="w-8 h-8 bg-green-950/10 rounded-full flex items-center justify-center text-green-950">
                    <Mic size={16} />
                  </div>
                  {/* Activity Icon */}
                  <div className="w-8 h-8 bg-green-950/10 rounded-full flex items-center justify-center text-green-950">
                    <Activity size={16} />
                  </div>
                </div>
              </div>

              {/* Circular Call Button */}
              <Link
                to="#solutions"
                className="w-24 h-24 rounded-full bg-[#22c55e] text-green-950 font-medium text-lg flex flex-col items-center justify-center leading-tight hover:scale-105 transition-transform text-center group"
              >
                Start{" "}
                <span className="text-xs font-bold group-hover:underline">
                  DEMO
                </span>
              </Link>
            </div>

            {/* Left Bottom Image */}
            <div className="w-full h-48 rounded-[2.5rem] overflow-hidden relative">
              <img
                src="/homeImage1.png"
                alt="User"
                className="w-full h-full object-cover object-top filter sepia-[.2]"
              />
              <div className="absolute inset-0 bg-[#22c55e]/10 mix-blend-overlay"></div>
            </div>
          </div>
        </div>

        {/* Right Column - Main Visual */}
        <div className="col-span-1 lg:col-span-8 relative">
          <div className="w-full h-[500px] md:h-[600px] bg-gray-100 rounded-[3rem] overflow-hidden relative group">
            <img
              src="/homeImage2.png"
              alt="Collaboration"
              className="w-full h-full object-cover opacity-90 transition-transform duration-700 group-hover:scale-105"
            />

            {/* Overlay Gradient */}
            <div className="absolute inset-0 bg-linear-to-t from-black/60 via-transparent to-transparent"></div>

            {/* Floating UI Elements (Fake Interface) */}
            <div className="absolute top-8 right-8">
              <div className="flex flex-col gap-4 bg-green-950/5 border border-green-950/10 rounded-3xl p-6 backdrop-blur-sm">
                <div className="flex items-center gap-4">
                  <div className="w-8 h-8 bg-green-950/10 rounded-full flex items-center justify-center text-green-950">
                    <span className="w-2 h-2 bg-[#22c55e] rounded-full animate-pulse"></span>
                  </div>
                  <span className="text-sm font-bold tracking-widest text-[#22c55e] uppercase">System Active</span>
                </div>
              </div>
            </div>

            {/* Red Alert Pill */}
            <div className="absolute bottom-6 left-6 md:bottom-10 md:left-10 z-20">
              <div className="bg-red-500/80 backdrop-blur-md text-white px-6 py-3 rounded-full border border-red-400/30 flex items-center gap-2">
                <div className="w-2 h-2 bg-white rounded-full animate-ping"></div>
                <span className="text-sm font-medium">
                  Critical Stock Alert
                </span>
              </div>
            </div>
          </div>

          {/* Bottom Floating Actions */}
          <div className="flex flex-col md:flex-row items-center justify-between mt-8">
            <span className="text-[#22c55e] font-medium hidden md:block uppercase tracking-wider text-sm">
              Real-time Stock • Automated Buy-Backs
            </span>

            <div className="flex gap-4">
              <button className="px-8 py-3 rounded-full border border-green-950/20 text-green-950 font-medium hover:bg-gray-100 transition-colors">
                Read Docs
              </button>
              <button className="px-8 py-3 rounded-full bg-[#22c55e] text-green-950 font-medium hover:bg-[#16a34a] transition-colors">
                View Demo
              </button>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

