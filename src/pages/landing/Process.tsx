'use client';

import React from 'react';
import { MessageSquare, Zap, Bell, ShieldCheck } from 'lucide-react';

const STEPS = [
  {
    icon: <MessageSquare size={24} />,
    title: "Inventory Tracking",
    description: "Pharmacies track stock levels, expirations, and batches in real-time.",
    detail: "Automated low-stock alerts and expiration tracking."
  },
  {
    icon: <Zap size={24} />,
    title: "Smart Procurement",
    description: "PharmaLink analyzes stock thresholds and auto-generates purchase orders.",
    detail: "Connects with verified vendors instantly."
  },
  {
    icon: <Bell size={24} />,
    title: "Automated Restock",
    description: "Approved orders trigger immediate notifications to the vendor's dashboard.",
    detail: "Prevents critical stockouts from going unnoticed in busy pharmacies."
  },
  {
    icon: <ShieldCheck size={24} />,
    title: "Buy-Back Requests",
    description: "Near-expiry items are automatically flagged for buy-back requests.",
    detail: "Seamlessly transfers expiring stock to willing vendors."
  }
];

export default function Process() {
  return (
    <section id="process" className="bg-white text-green-950 py-24 px-4 md:px-12 font-[arimo]">
      <div className="max-w-[1400px] mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-20 gap-8">
          <h2 className="text-5xl md:text-7xl font-medium tracking-tighter">How <br /> PharmaLink Works</h2>
          <span className="text-[#22c55e] font-bold uppercase tracking-[0.2em] text-sm md:mb-4">System Workflow</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {STEPS.map((step, index) => (
            <div key={index} className="group relative p-8 rounded-4xl bg-green-950/5 border border-green-950/10 hover:border-[#22c55e]/50 transition-all duration-500 hover:-translate-y-2">
              <div className="w-14 h-14 bg-[#22c55e] text-background rounded-2xl flex items-center justify-center mb-8 rotate-3 group-hover:rotate-0 transition-transform">
                {step.icon}
              </div>
              <div className="absolute top-8 right-8 text-green-950/10 text-6xl font-black select-none group-hover:text-[#22c55e]/10 transition-colors">
                0{index + 1}
              </div>
              <h3 className="text-2xl font-bold mb-4 text-green-950">{step.title}</h3>
              <p className="text-green-950/60 mb-6 leading-relaxed">
                {step.description}
              </p>
              <div className="pt-6 border-t border-green-950/10 mt-auto">
                <p className="text-xs font-mono text-[#22c55e] uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity">
                  Technical Detail: {step.detail}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
