'use client';

import dynamic from 'next/dynamic';
import { useRef, useEffect, useState } from 'react';
import { motion, useScroll, useMotionValueEvent, useInView } from 'framer-motion';
import Link from 'next/link';
import { ArrowDown, Mail } from 'lucide-react';
import { PortfolioNavbar } from '@/components/layout/portfolio-navbar';
import { NeonCursor } from '@/components/landing/neon-cursor';
import { ScrollProgressBar } from '@/components/landing/scroll-progress-bar';

const SphereScene = dynamic(() => import('@/components/landing/sphere-scene'), { ssr: false });

const SECTION_IDS = ['hero', 'about', 'projects', 'stack', 'contact'];

const PROJECTS = [
  {
    title: 'Deya PH',
    subtitle: 'HRIS Mobile App — Philippines',
    description:
      'Human Resource Information System mobile app for Philippine companies. Built the full mobile client — employee management, payroll, attendance, and leave tracking — shipped to the App Store.',
    tech: ['React Native', 'Expo', 'REST API', 'Firebase'],
    platform: 'Mobile',
    live: 'https://apps.apple.com/us/app/deya-ph/id6756650859',
    liveLabel: 'App Store ↗',
    color: '#00d4ff',
    icon: '💼',
  },
  {
    title: 'SwiftDash DMS',
    subtitle: 'Transportation Management System',
    description:
      'Full-stack TMS — think Fareye & Shipday. Custom domain support, live driver tracking, advanced dispatching engine, tracking links, and a dedicated driver app. My flagship product.',
    tech: ['Next.js', 'React Native', 'Expo', 'Node.js', 'PostgreSQL', 'Supabase'],
    platform: 'Web + Mobile',
    live: 'https://swiftdashdms.com',
    liveLabel: 'swiftdashdms.com ↗',
    color: '#8855ff',
    icon: '🚚',
  },
  {
    title: 'Hanghut',
    subtitle: 'Ticketing & Subscription for Social Media',
    description:
      'The most complex system I’ve built. Ticketing and subscription platform for social content creators. Designed and shipped 100% of the product with a team of 3 from zero to production.',
    tech: ['Next.js', 'React Native', 'Expo', 'TypeScript', 'Supabase', 'Stripe'],
    platform: 'Web + Mobile',
    live: 'https://hanghut.com',
    liveLabel: 'hanghut.com ↗',
    color: '#ff44aa',
    icon: '🎫',
  },
];

const TECH_STACK = [
  'Next.js', 'React', 'React Native', 'Expo', 'Flutter', 'Dart',
  'TypeScript', 'Node.js', 'Tauri', 'Electron', 'PostgreSQL',
  'Supabase', 'TailwindCSS', 'Three.js', 'Framer Motion',
  'Docker', 'Vercel', 'GraphQL', 'Firebase', 'WebRTC',
];

// ── Hooks ─────────────────────────────────────────────────────────────────

function useTypewriter(texts: string[], speed = 110, pause = 2400) {
  const [displayed, setDisplayed] = useState('');
  const state = useRef({ index: 0, charIndex: 0, deleting: false });

  useEffect(() => {
    const { index, charIndex, deleting } = state.current;
    const current = texts[index % texts.length];
    let timeout: ReturnType<typeof setTimeout>;

    if (!deleting && charIndex < current.length) {
      timeout = setTimeout(() => {
        setDisplayed(current.slice(0, charIndex + 1));
        state.current.charIndex++;
      }, speed);
    } else if (!deleting && charIndex === current.length) {
      timeout = setTimeout(() => { state.current.deleting = true; }, pause);
    } else if (deleting && charIndex > 0) {
      timeout = setTimeout(() => {
        setDisplayed(current.slice(0, charIndex - 1));
        state.current.charIndex--;
      }, speed / 2);
    } else {
      state.current.deleting = false;
      state.current.index++;
    }
    return () => clearTimeout(timeout);
  });

  return displayed;
}

function useScrambleText(finalText: string, duration = 1500) {
  const [displayed, setDisplayed] = useState(finalText);

  useEffect(() => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789@#$%';
    let startTime: number | null = null;
    let rafId: number;

    const tick = (ts: number) => {
      if (!startTime) startTime = ts;
      const elapsed = ts - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const result = finalText.split('').map((char, i) => {
        if (char === ' ') return ' ';
        const revealAt = (i / finalText.length) * 0.9;
        if (progress > revealAt) return char;
        return chars[Math.floor(Math.random() * chars.length)];
      }).join('');
      setDisplayed(result);
      if (progress < 1) rafId = requestAnimationFrame(tick);
    };

    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, [finalText, duration]);

  return displayed;
}

function AnimatedCounter({ value, suffix = '' }: { value: number; suffix?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const isInView = useInView(ref, { once: true });
  const [displayed, setDisplayed] = useState(0);
  const started = useRef(false);

  useEffect(() => {
    if (!isInView || started.current) return;
    started.current = true;
    let startTime: number | null = null;
    const dur = 2000;
    const frame = (ts: number) => {
      if (!startTime) startTime = ts;
      const p = Math.min((ts - startTime) / dur, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      setDisplayed(Math.round(eased * value));
      if (p < 1) requestAnimationFrame(frame);
    };
    requestAnimationFrame(frame);
  }, [isInView, value]);

  return <span ref={ref}>{displayed}{suffix}</span>;
}

// ── Components ────────────────────────────────────────────────────────────

function ProjectCard({ project, index }: { project: typeof PROJECTS[number]; index: number }) {
  const [mouse, setMouse] = useState({ x: 0, y: 0 });
  const [hovered, setHovered] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    setMouse({ x: e.clientX - rect.left, y: e.clientY - rect.top });
  };

  return (
    <motion.div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      initial={{ opacity: 0, y: 60 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-60px' }}
      transition={{ duration: 0.6, delay: index * 0.12, ease: 'easeOut' }}
      whileHover={{ scale: 1.02, transition: { duration: 0.2 } }}
      className="relative rounded-2xl border border-white/[0.08] bg-[#0a0a0a] p-7 overflow-hidden group"
      style={{
        boxShadow: hovered ? `0 0 35px ${project.color}18` : '0 0 0 transparent',
        transition: 'box-shadow 0.3s ease',
      }}
    >
      <div
        className="absolute inset-0 rounded-2xl pointer-events-none transition-opacity duration-300"
        style={{
          opacity: hovered ? 1 : 0,
          background: `radial-gradient(320px circle at ${mouse.x}px ${mouse.y}px, ${project.color}10, transparent)`,
        }}
      />
      <div
        className="absolute inset-0 rounded-2xl pointer-events-none transition-opacity duration-300"
        style={{ opacity: hovered ? 1 : 0, boxShadow: `inset 0 0 0 1px ${project.color}22` }}
      />
      <div className="relative z-10">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <span className="text-3xl">{project.icon}</span>
            <span
              className="text-[10px] px-2.5 py-1 rounded-full border"
              style={{
                fontFamily: "'JetBrains Mono', monospace",
                borderColor: `${project.color}30`,
                color: `${project.color}aa`,
                backgroundColor: `${project.color}08`,
              }}
            >
              {project.platform}
            </span>
          </div>
          <Link
            href={project.live}
            target="_blank"
            rel="noopener noreferrer"
            className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 text-white/30 hover:text-white text-xs flex items-center gap-1"
            style={{ fontFamily: "'JetBrains Mono', monospace" }}
          >
            {project.liveLabel}
          </Link>
        </div>
        <p
          className="text-[11px] mb-1 uppercase tracking-widest"
          style={{ fontFamily: "'JetBrains Mono', monospace", color: `${project.color}66` }}
        >
          {project.subtitle}
        </p>
        <h3 className="text-lg font-bold mb-2 text-white" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
          {project.title}
        </h3>
        <p className="text-white/40 text-sm leading-relaxed mb-6">{project.description}</p>
        <div className="flex flex-wrap gap-2">
          {project.tech.map((t) => (
            <span key={t} className="px-2.5 py-1 rounded-full text-xs border"
              style={{
                fontFamily: "'JetBrains Mono', monospace",
                borderColor: `${project.color}28`,
                color: `${project.color}cc`,
                backgroundColor: `${project.color}08`,
              }}>
              {t}
            </span>
          ))}
        </div>
      </div>
    </motion.div>
  );
}

function TechMarquee({ reverse = false }: { reverse?: boolean }) {
  const items = reverse ? [...TECH_STACK.slice(7), ...TECH_STACK.slice(0, 7)] : TECH_STACK;
  return (
    <div className="relative overflow-hidden py-3">
      <div className="pointer-events-none absolute inset-y-0 left-0 w-24 bg-gradient-to-r from-black to-transparent z-10" />
      <div className="pointer-events-none absolute inset-y-0 right-0 w-24 bg-gradient-to-l from-black to-transparent z-10" />
      <motion.div
        className="flex gap-4 w-max"
        animate={{ x: reverse ? ['-50%', '0%'] : ['0%', '-50%'] }}
        transition={{ duration: 22, repeat: Infinity, ease: 'linear' }}
      >
        {[...items, ...items].map((tech, i) => (
          <div key={i}
            className="flex items-center gap-2 px-4 py-2 rounded-full border border-white/[0.07] bg-white/[0.03] text-white/40 text-sm whitespace-nowrap hover:border-[#00d4ff]/30 hover:text-[#00d4ff]/80 transition-colors cursor-default"
            style={{ fontFamily: "'JetBrains Mono', monospace" }}>
            <span className="w-1.5 h-1.5 rounded-full"
              style={{ backgroundColor: reverse ? 'rgba(255,255,255,0.2)' : '#00d4ff' }} />
            {tech}
          </div>
        ))}
      </motion.div>
    </div>
  );
}

// ── Sections ──────────────────────────────────────────────────────────────

function HeroSection() {
  const name = useScrambleText('JOHN PATIÑO', 1500);
  const role = useTypewriter(
    ['Software Engineer', 'Web Developer', 'Mobile Developer', 'Desktop Developer', 'React & Flutter Dev'],
    115, 2400
  );

  return (
    <section id="hero" className="relative min-h-screen flex flex-col items-center justify-center text-center px-4 pt-20">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full bg-[#00d4ff]/[0.04] blur-[100px]" />
      </div>

      <motion.div
        initial={{ opacity: 0, scale: 0.85 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="mb-8 flex items-center gap-2.5 px-5 py-2 rounded-full border border-white/[0.08] bg-white/[0.03] backdrop-blur-sm"
      >
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-60" />
          <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400" />
        </span>
        <span className="text-sm text-white/50" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
          Available for opportunities — Web · Mobile · Desktop
        </span>
      </motion.div>

      <motion.h1
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.3 }}
        className="text-6xl sm:text-8xl md:text-9xl font-black tracking-tight mb-4 text-white"
        style={{ fontFamily: "'Space Grotesk', sans-serif", letterSpacing: '-0.02em' }}
      >
        {name}
      </motion.h1>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6, delay: 0.5 }}
        className="text-xl md:text-2xl font-light text-[#00d4ff] mb-6 h-9 flex items-center gap-0.5"
      >
        <span>{role}</span>
        <span className="animate-[pulse_0.8s_ease-in-out_infinite] text-[#00d4ff]">▍</span>
      </motion.div>

      <motion.p
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.7 }}
        className="max-w-lg text-white/35 text-base leading-relaxed mb-10"
      >
        I build for web, mobile, and desktop — React, Expo, Flutter, Next.js.
        From idea to shipped product, across every platform.
      </motion.p>

      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.9 }}
        className="flex flex-col sm:flex-row gap-4"
      >
        <Link href="#projects">
          <button
            className="h-12 px-8 rounded-full text-black font-semibold text-sm transition-all"
            style={{
              fontFamily: "'Space Grotesk', sans-serif",
              background: '#00d4ff',
              boxShadow: '0 0 20px rgba(0,212,255,0.35), 0 0 40px rgba(0,212,255,0.15)',
            }}
          >
            View Projects
          </button>
        </Link>
        <Link href="#contact">
          <button
            className="h-12 px-8 rounded-full text-white/70 text-sm border border-white/[0.12] hover:border-[#00d4ff]/40 hover:text-[#00d4ff] transition-all bg-transparent"
            style={{ fontFamily: "'Space Grotesk', sans-serif" }}
          >
            Contact Me
          </button>
        </Link>
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.8, duration: 1 }}
        className="absolute bottom-10 flex flex-col items-center gap-1.5 text-white/20"
      >
        <motion.span
          className="text-[10px] tracking-[0.3em] uppercase"
          style={{ fontFamily: "'JetBrains Mono', monospace" }}
          animate={{ y: [0, 4, 0] }}
          transition={{ duration: 1.8, repeat: Infinity }}
        >
          scroll
        </motion.span>
        <ArrowDown size={14} />
      </motion.div>
    </section>
  );
}

function AboutSection() {
  const stats = [
    { value: 8,   suffix: '+',  label: 'Years Experience' },
    { value: 3,   suffix: '',   label: 'Platforms (Web · Mobile · Desktop)' },
    { value: 300, suffix: '+',  label: 'Projects Shipped' },
    { value: 100, suffix: '%',  label: 'Passion for Code' },
  ];

  return (
    <section id="about" className="relative py-32 px-4">
      <div className="md:max-w-[56vw] md:ml-10">
        <motion.p
          initial={{ opacity: 0, x: -20 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="mb-5 text-[#00d4ff]/70 text-xs tracking-[0.3em] uppercase"
          style={{ fontFamily: "'JetBrains Mono', monospace" }}
        >
          01 — About
        </motion.p>

        <div className="space-y-10">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
          >
            <h2 className="text-4xl md:text-5xl font-bold mb-6 leading-tight"
              style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
              I build for{' '}
              <span className="text-[#00d4ff]" style={{ textShadow: '0 0 20px rgba(0,212,255,0.4)' }}>
                every platform
              </span>.
            </h2>
            <p className="text-white/40 text-base leading-relaxed mb-4">
              I&apos;m a Software Engineer who builds across the full spectrum — web apps with Next.js, cross-platform
              mobile apps with React Native + Expo and Flutter, and native desktop software too. One codebase
              or three, I make it feel native.
            </p>
            <p className="text-white/40 text-base leading-relaxed">
              I care about clean architecture, real performance, and experiences that feel right on
              every screen — from a 6&quot; phone to a 4K monitor.
            </p>
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={{ hidden: {}, visible: { transition: { staggerChildren: 0.12 } } }}
            className="grid grid-cols-2 gap-4"
          >
            {stats.map((s) => (
              <motion.div
                key={s.label}
                variants={{ hidden: { opacity: 0, scale: 0.88 }, visible: { opacity: 1, scale: 1 } }}
                className="rounded-2xl border border-white/[0.07] bg-white/[0.02] p-6 hover:border-[#00d4ff]/20 transition-colors"
              >
                <div className="text-4xl font-black text-[#00d4ff] mb-1"
                  style={{ fontFamily: "'Space Grotesk', sans-serif", textShadow: '0 0 15px rgba(0,212,255,0.3)' }}>
                  <AnimatedCounter value={s.value} suffix={s.suffix} />
                </div>
                <div className="text-white/35 text-sm">{s.label}</div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </div>
    </section>
  );
}

function ProjectsSection() {
  return (
    <section id="projects" className="relative py-32 px-4">
      <div className="md:max-w-[58vw] md:ml-10">
        <motion.p
          initial={{ opacity: 0, x: -20 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="mb-5 text-[#00d4ff]/70 text-xs tracking-[0.3em] uppercase"
          style={{ fontFamily: "'JetBrains Mono', monospace" }}
        >
          02 — Projects
        </motion.p>
        <motion.h2
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="text-4xl md:text-5xl font-bold mb-4"
          style={{ fontFamily: "'Space Grotesk', sans-serif" }}
        >
          Hundreds built.
          <br />
          <span className="text-[#00d4ff]" style={{ textShadow: '0 0 20px rgba(0,212,255,0.3)' }}>3 I&apos;m proud of.</span>
        </motion.h2>
        <motion.p
          initial={{ opacity: 0, y: 15 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="text-white/35 text-sm mb-14 max-w-md"
          style={{ fontFamily: "'JetBrains Mono', monospace" }}
        >
          Full-stack systems. Real users. Real scale.
        </motion.p>
        <div className="grid sm:grid-cols-2 gap-5">
          {PROJECTS.map((project, i) => (
            <ProjectCard key={project.title} project={project} index={i} />
          ))}
        </div>
      </div>
    </section>
  );
}

function StackSection() {
  return (
    <section id="stack" className="relative py-32 overflow-hidden">
      <div className="md:max-w-[56vw] md:ml-10 px-4 mb-12">
        <motion.p
          initial={{ opacity: 0, x: -20 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="mb-5 text-[#00d4ff]/70 text-xs tracking-[0.3em] uppercase"
          style={{ fontFamily: "'JetBrains Mono', monospace" }}
        >
          03 — Stack
        </motion.p>
        <motion.h2
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="text-4xl md:text-5xl font-bold"
          style={{ fontFamily: "'Space Grotesk', sans-serif" }}
        >
          Technologies I work with
        </motion.h2>
      </div>
      <div className="space-y-3">
        <TechMarquee />
        <TechMarquee reverse />
      </div>
    </section>
  );
}

function ContactSection() {
  const socials = [
    { icon: <Mail size={19} />, label: 'Email', href: 'mailto:johnpatino@swiftdash.ph', handle: 'johnpatino@swiftdash.ph' },
  ];

  return (
    <section id="contact" className="relative py-32 px-4">
      <div className="md:max-w-[50vw] md:ml-10">
        <div className="absolute left-0 w-[400px] h-[350px] rounded-full bg-[#00d4ff]/[0.04] blur-[90px] pointer-events-none" />

        <motion.p
          initial={{ opacity: 0, x: -20 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="mb-6 text-[#00d4ff]/70 text-xs tracking-[0.3em] uppercase"
          style={{ fontFamily: "'JetBrains Mono', monospace" }}
        >
          04 — Contact
        </motion.p>

        <motion.h2
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
          className="text-4xl md:text-6xl font-black mb-5 relative leading-tight"
          style={{ fontFamily: "'Space Grotesk', sans-serif" }}
        >
          Let&apos;s build something{' '}
          <span className="text-[#00d4ff]" style={{ textShadow: '0 0 30px rgba(0,212,255,0.5)' }}>
            together
          </span>
        </motion.h2>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.15 }}
          className="text-white/35 text-base mb-12 leading-relaxed"
        >
          Whether you have a project in mind, a question, or just want to connect —
          my inbox is always open.
        </motion.p>

        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={{ hidden: {}, visible: { transition: { staggerChildren: 0.1 } } }}
          className="flex flex-col sm:flex-row gap-4"
        >
          {socials.map((s) => (
            <motion.div
              key={s.label}
              variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }}
            >
              <Link
                href={s.href}
                target={s.href.startsWith('http') ? '_blank' : undefined}
                rel="noopener noreferrer"
                className="flex items-center gap-4 px-7 py-4 rounded-2xl border border-white/[0.08] bg-white/[0.02] text-white/50 hover:border-[#00d4ff]/35 hover:text-[#00d4ff] hover:bg-[#00d4ff]/[0.04] transition-all group"
              >
                <span className="text-white/30 group-hover:text-[#00d4ff] transition-colors">{s.icon}</span>
                <div className="text-left">
                  <div className="text-[10px] text-white/25 tracking-widest uppercase mb-0.5"
                    style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                    {s.label}
                  </div>
                  <div className="text-sm font-medium">{s.handle}</div>
                </div>
              </Link>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}

function Divider() {
  return (
    <div className="max-w-5xl mx-auto px-4">
      <div className="h-px bg-gradient-to-r from-transparent via-white/[0.07] to-transparent" />
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────

export default function PortfolioPage() {
  const scrollRef   = useRef(0);
  const sectionRef  = useRef(0);
  const { scrollYProgress } = useScroll();

  useMotionValueEvent(scrollYProgress, 'change', (latest) => {
    scrollRef.current = latest;
  });

  // Track which section is active (drives shape morph + colour)
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const idx = SECTION_IDS.indexOf(entry.target.id);
            if (idx !== -1) sectionRef.current = idx;
          }
        });
      },
      { threshold: 0.3 }
    );
    SECTION_IDS.forEach((id) => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });
    return () => observer.disconnect();
  }, []);

  return (
    <div
      className="min-h-screen bg-black text-white cursor-none selection:bg-[#00d4ff]/25"
      style={{ fontFamily: "'Space Grotesk', sans-serif" }}
    >
      <NeonCursor />
      <ScrollProgressBar />
      <SphereScene scrollRef={scrollRef} sectionRef={sectionRef} />
      <PortfolioNavbar />

      <main className="relative" style={{ zIndex: 10 }}>
        <HeroSection />
        <Divider />
        <AboutSection />
        <Divider />
        <ProjectsSection />
        <Divider />
        <StackSection />
        <Divider />
        <ContactSection />
      </main>

      <footer className="relative border-t border-white/[0.05] py-8 px-4" style={{ zIndex: 10 }}>
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <span className="text-white/20 text-xs" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
            © 2026 John Patiño
          </span>
          <span className="text-white/15 text-xs" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
            built with Next.js + Three.js + framer-motion
          </span>
        </div>
      </footer>
    </div>
  );
}
