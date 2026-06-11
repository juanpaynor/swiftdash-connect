'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';

const NAV_ITEMS = [
  { label: 'About', href: '#about', num: '01' },
  { label: 'Projects', href: '#projects', num: '02' },
  { label: 'Stack', href: '#stack', num: '03' },
  { label: 'Contact', href: '#contact', num: '04' },
];

export function PortfolioNavbar() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 60);
    window.addEventListener('scroll', handler, { passive: true });
    return () => window.removeEventListener('scroll', handler);
  }, []);

  return (
    <motion.nav
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 1.0 }}
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
        scrolled
          ? 'bg-black/85 backdrop-blur-md border-b border-white/5'
          : 'bg-transparent'
      }`}
    >
      <div className="max-w-5xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        {/* Logo / monogram */}
        <Link
          href="/"
          className="font-mono text-lg font-bold tracking-tight text-white hover:text-[#00d4ff] transition-colors"
          style={{ fontFamily: "'JetBrains Mono', monospace" }}
        >
          <span className="text-[#00d4ff]">&gt;</span>_jp
        </Link>

        {/* Nav links */}
        <div className="hidden sm:flex items-center gap-6">
          {NAV_ITEMS.map((item, i) => (
            <motion.div
              key={item.label}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.1 + i * 0.08 }}
            >
              <Link
                href={item.href}
                className="text-sm text-white/40 hover:text-white transition-colors group"
                style={{ fontFamily: "'JetBrains Mono', monospace" }}
              >
                <span className="text-[#00d4ff]/50 group-hover:text-[#00d4ff] transition-colors">
                  {item.num}.
                </span>{' '}
                {item.label}
              </Link>
            </motion.div>
          ))}


        </div>

        {/* Mobile contact shortcut */}
        <div className="sm:hidden">
          <Link
            href="#contact"
            className="text-[#00d4ff] text-sm font-mono"
          >
            Contact
          </Link>
        </div>
      </div>
    </motion.nav>
  );
}
