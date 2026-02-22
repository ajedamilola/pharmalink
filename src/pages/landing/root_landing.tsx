'use client';

import React from 'react'
import ReactLenis from 'lenis/react'

import Navbar from './Navbar'
import Home from './Home'
// import TriageAgent from '../components/TriageAgent'
import About from './About'
import Story from './Story'
import Features from './Features'
import Process from './Process'
import Faq from './Faq'
// import ComingSoon from '../components/ComingSoon'
import Footer from './Footer'

export default function FullPage() {
  return (
    <ReactLenis root>
        <div className="min-h-screen bg-white text-green-950 font-[arimo] overflow-x-hidden">
            <div className="p-4 md:p-8">
                {/* Navigation */}
                <Navbar />

                {/* Hero Section */}
                <Home />
      
                <div className="w-full mt-24 rounded-[3rem] overflow-hidden">
                    <About />
                </div>

                <div className="w-full mt-8 rounded-[3rem] overflow-hidden">
                    <Story />
                </div>

                <div className="w-full mt-8 rounded-[3rem] overflow-hidden">
                    <Features />
                </div>

                <div className="w-full mt-8 rounded-[3rem] overflow-hidden">
                    <Process />
                </div>

                <div className="w-full mt-8 rounded-[3rem] overflow-hidden">
                    <Faq />
                </div>

                <div className="w-full mt-8 rounded-[3rem] overflow-hidden">
                    {/* <ComingSoon /> */}
                </div>
            </div>
            
            <Footer />
        </div>
    </ReactLenis>
  )
}
