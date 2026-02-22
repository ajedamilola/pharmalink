'use client';

import React, { useState } from 'react';
import { Plus, Minus, ArrowRight } from 'lucide-react';

interface FaqItem {
  question: string;
  answer: string;
}

const faqs: FaqItem[] = [
  {
    question: "What is PharmaLink?",
    answer: "PharmaLink is an advanced inventory management and supply chain platform. It connects pharmacies directly with verified vendors, automating restocks and managing expiring products."
  },
  {
    question: "How does auto-restock work?",
    answer: "Pharmacies set minimum stock thresholds for critical drugs. When stock falls below this level, an automated purchase order is generated and sent to a preferred vendor."
  },
  {
    question: "Who can use PharmaLink?",
    answer: "Both retail pharmacies and wholesale medicine vendors in Nigeria can register. We verify all vendors to ensure compliance and authenticity."
  },
  {
    question: "Is my transaction data secure?",
    answer: "Yes. All wallet transactions and procurement data are securely encrypted and compliant with local financial regulations, providing a fully auditable trail."
  },
  {
    question: "How does the buy-back program work?",
    answer: "When stock approaches its expiration date (e.g., within 60 days), you can request a buy-back at a discounted rate. Participating vendors can accept these requests to help minimize your losses."
  }
];

export default function Faq() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const toggleFaq = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <section id="faq" className="bg-white text-green-950 py-24 px-4 md:px-8 font-[arimo]">
      <div className="max-w-[1400px] mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-24">
        
        {/* Left Side - Header */}
        <div className="col-span-1 lg:col-span-4 flex flex-col gap-6">
          <h2 className="text-4xl md:text-5xl font-bold tracking-tight leading-tight text-green-950/90">
            Any questions?<br />
            We got you.
          </h2>
          
          <p className="text-green-950/70 text-sm md:text-base leading-relaxed max-w-sm">
            Learn more about how PharmaLink is revolutionizing pharmacy supply chains with automated restocking, buy-backs, and direct vendor access.
          </p>

          <a href="#contact" className="mt-2 text-[#22c55e] font-medium flex items-center gap-2 group">
            Contact Support 
            <ArrowRight size={16} className="group-hover:translate-x-1" />
          </a>
        </div>

        {/* Right Side - Accordion */}
        <div className="col-span-1 lg:col-span-8">
          <div className="flex flex-col">
            {faqs.map((faq, index) => (
              <div 
                key={index} 
                className={`border-b border-green-950/10 overflow-hidden ${index === 0 ? 'border-t' : ''} ${openIndex === index ? 'bg-green-950/5' : ''}`}
              >
                <div 
                  className="py-8 md:py-10 flex justify-between items-center cursor-pointer group px-4 md:px-6"
                  onClick={() => toggleFaq(index)}
                >
                  <h3 className={`text-lg md:text-4xl pr-8 select-none ${openIndex === index ? 'text-[#22c55e]' : 'text-green-950/90 group-hover:text-[#22c55e]'}`}>
                    {faq.question}
                  </h3>
                  <div className={`shrink-0 w-10 h-10 rounded-full border border-green-950/10 flex items-center justify-center ${openIndex === index ? 'bg-[#22c55e] text-black border-[#22c55e]' : 'text-gray-500 group-hover:border-[#22c55e] group-hover:text-[#22c55e]'}`}>
                    {openIndex === index ? (
                      <Minus size={20} />
                    ) : (
                      <Plus size={20} />
                    )}
                  </div>
                </div>
                
                <div 
                  className={`overflow-hidden ${
                    openIndex === index ? 'max-h-[500px] opacity-100 pb-10' : 'max-h-0 opacity-0'
                  }`}
                >
                  <div className="px-4 md:px-6">
                    <p className="text-green-950/70 md:text-xl text-sm leading-relaxed pr-8 max-w-2xl">
                      {faq.answer}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </section>
  );
}
