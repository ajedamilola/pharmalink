'use client';

import React, { useState, useEffect } from 'react';
import { useLocation, Link } from 'react-router-dom';
import { useLenis } from 'lenis/react';
// import { X } from 'lucide-react';

const NAV_ITEMS = [
  { label: 'About', href: '/#about' },
  { label: 'Story', href: '/#story' },
  { label: 'Solutions', href: '/#solutions' },
  { label: 'Process', href: '/#process' },
  { label: 'FAQ', href: '/#faq' },
];

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);
  const location = useLocation();
  const pathname = location.pathname;
  const lenis = useLenis();

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      
      if (currentScrollY < 10) {
        setIsVisible(true);
      } else if (currentScrollY > lastScrollY) {
        setIsVisible(false); // Scrolling down
      } else {
        setIsVisible(true); // Scrolling up
      }
      
      setLastScrollY(currentScrollY);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [lastScrollY]);

  const handleLinkClick = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    // Only intercept if we are on the home page and it's a hash link
    if (pathname === '/' && href.startsWith('/#')) {
        e.preventDefault();
        const targetId = href.replace('/', '');
        lenis?.scrollTo(targetId, { offset: -100 });
        setIsOpen(false);
    } else {
        // Normal navigation for other pages or non-hash links
        setIsOpen(false);
    }
  };


  return (
    <>
      <nav className={`flex items-center justify-between py-4 fixed top-0 left-0 right-0 z-50 max-w-[1400px] mx-auto w-full px-4 md:px-8 transition-transform duration-300 ${isVisible || isOpen ? 'translate-y-0' : '-translate-y-full'}`}>
        <Link to="/" className="flex items-center gap-2 relative z-50 group">
          <img src="/logo-green.png" alt="PharmaLink" className="h-14 transition-transform group-hover:scale-105" />
          <span className="text-3xl md:text-4xl font-bold tracking-tight text-green-950 ml-2">PHARMALINK</span>
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center gap-8 text-xl md:text-2xl text-green-950/80 border border-green-950/10 rounded-full px-8 py-3 bg-green-950/5 backdrop-blur-md">
          {NAV_ITEMS.map((item) => (
              <Link 
                key={item.label} 
                to={item.href} 
                className="hover:text-green-950 transition-colors"
                onClick={(e) => handleLinkClick(e, item.href)}
              >
                  {item.label}
              </Link>
          ))}
        </div>

        {/* Desktop Actions */}
        <div className="hidden md:flex items-center gap-4">
            {/* <Link to="/docs" className="text-green-950 hover:text-[#22c55e] font-medium text-lg px-6 transition-colors">
              Read Docs
            </Link> */}
            {/* <Link to="#coming-soon" className="text-green-950 hover:text-green-950/80 font-medium text-lg border border-green-950/20 px-8 py-3 rounded-full transition-all">
              View Demo
            </Link> */}
            <Link to="/login" className="bg-[#22c55e] hover:bg-[#16a34a] text-green-950 px-8 py-3 rounded-full text-lg font-bold transition-all shadow-[0_0_20px_rgba(204,255,0,0.2)]">
              Login
            </Link>
        </div>
        
        {/* Mobile Menu Toggle */}
        <button 
          className="md:hidden relative z-50 text-green-950 p-2"
          onClick={() => setIsOpen(!isOpen)}
          aria-label="Toggle menu"
        >
            {isOpen ? (
              <div className="relative w-10 h-2.5">
                  <div className="absolute top-1/2 left-0 w-10 h-0.5 bg-white -translate-y-1/2 rotate-45"></div>
                  <div className="absolute top-1/2 left-0 w-10 h-0.5 bg-white -translate-y-1/2 -rotate-45"></div>
              </div>
            ) : (
              <div className="flex flex-col gap-1.5">
                <div className="w-10 h-0.5 bg-white"></div>
                <div className="w-10 h-0.5 bg-white"></div>
              </div>
            )}
        </button>
      </nav>

      {/* Mobile Menu Overlay */}
      {isOpen && (
        <div className="fixed inset-0 bg-white z-40 flex flex-col items-center justify-center gap-8 md:hidden animate-in fade-in duration-200">
            <div className="flex flex-col items-center gap-6">
                {NAV_ITEMS.map((item) => (
                    <Link 
                        key={item.label} 
                        to={item.href} 
                        className="text-4xl text-green-950 font-medium hover:text-[#22c55e] transition-colors"
                        onClick={(e) => handleLinkClick(e, item.href)}
                    >
                        {item.label}
                    </Link>
                ))}
            </div>
            
            <div className="flex flex-col items-center gap-4 mt-8 w-64">
                <Link 
                    to="/docs" 
                    className="text-green-950 font-medium text-xl border border-green-950/20 rounded-full py-4 w-full text-center hover:bg-green-950/5 transition-colors"
                    onClick={() => setIsOpen(false)}
                >
                    Read Docs
                </Link>
                <Link 
                    to="/demo" 
                    className="text-green-950 font-medium text-xl border border-green-950/20 rounded-full py-4 w-full text-center hover:bg-green-950/5 transition-colors"
                    onClick={() => setIsOpen(false)}
                >
                    View Demo
                </Link>
                <Link 
                    to="/login" 
                    className="bg-[#22c55e] text-green-950 font-bold text-xl rounded-full py-4 w-full text-center hover:bg-[#16a34a] transition-colors"
                    onClick={() => setIsOpen(false)}
                >
                    Login
                </Link>
            </div>
        </div>
      )}
    </>
  );
}
