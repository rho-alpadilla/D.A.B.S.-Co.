// src/pages/marketing/HomePage.jsx
// Design A — Artisan Canvas reskin.
// ── ALL ORIGINAL FUNCTIONS PRESERVED ────────────────────────────────────
//   • Grainient background effect (recolored to purple palette)
//   • Particles effect (recolored to purple palette)
//   • ShinyText hero logo animation
//   • framer-motion scroll-in animations (motion.div, whileInView)
//   • 4-step Creative Process grid with numbered circles
//   • "Who We Are" two-column section with info cards
//   • All navigation links (Gallery, Pricing, About)
// ── WHAT CHANGED (visual only) ──────────────────────────────────────────
//   • Grainient: teal/yellow → artisan purple/lavender palette
//   • Particles: teal/cream/yellow → purple/lavender palette
//   • ShinyText: gold shine → lavender shine on cream text
//   • Hero headline: Agbalumo → Playfair Display + Cormorant Garamond feel
//   • Hero buttons: teal/outline → purple gradient / ghost purple
//   • "Who We Are" card: teal borders → artisan purple borders
//   • Info sub-cards: teal/amber → purple/mauve/lavender
//   • Step circles: teal → artisan primary purple
//   • Section backgrounds: teal wash → artisan lavender wash
//   • Hero eyebrow label: artsy cross-stitch dot + Dancing Script style

import React, { useEffect, useState } from 'react';
import { Helmet } from 'react-helmet';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowRight, Palette, Brush, Flower2, FilePenLine, ReceiptText, Paintbrush, PackageCheck } from 'lucide-react';
import { motion } from 'framer-motion';
import Grainient from '@/components/effects/Grainient';
import ShinyText from '@/components/effects/ShinyText';
import Particles from '@/components/effects/Particles';
import PageContainer from '@/components/layout/PageContainer';
import ArtisanCardStack from '@/components/marketing/ArtisanCardStack';
import { collection, limit, onSnapshot, orderBy, query } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useCurrency } from '@/context/CurrencyContext';

const HomePage = () => {
  const [recentWorks, setRecentWorks] = useState([]);
  const [recentWorksLoading, setRecentWorksLoading] = useState(true);
  const [recentWorksError, setRecentWorksError] = useState(false);
  const { formatPrice } = useCurrency();

  useEffect(() => {
    const recentWorksQuery = query(
      collection(db, 'pricelists'),
      orderBy('createdAt', 'desc'),
      limit(3),
    );

    const unsubscribe = onSnapshot(
      recentWorksQuery,
      (snapshot) => {
        setRecentWorks(snapshot.docs.map((document) => ({ id: document.id, ...document.data() })));
        setRecentWorksLoading(false);
        setRecentWorksError(false);
      },
      () => {
        setRecentWorks([]);
        setRecentWorksLoading(false);
        setRecentWorksError(true);
      },
    );

    return unsubscribe;
  }, []);

  const steps = [
    {
      number: '01',
      title: 'Design Submission',
      icon: FilePenLine,
      description:
        'All approved designers will submit needlepoint canvas designs through the Gallery tab. We can work off painted masters or PDF chart files.',
    },
    {
      number: '02',
      title: 'Design Quoted',
      icon: ReceiptText,
      description:
        'Receive your quote with price per piece within 1-3 business days via email. If satisfied, place your order through Contact.',
    },
    {
      number: '03',
      title: 'Master Painted',
      icon: Paintbrush,
      description:
        'A painted proof of your design will be sent via email for approval. This will be stored at the studio as a master for easy reordering.',
    },
    {
      number: '04',
      title: 'Order Painted',
      icon: PackageCheck,
      description:
        'Upon master approval, production begins. Once completed, we receive the canvases in Dallas and invoice you.',
    },
  ];

  return (
    <>
      <Helmet>
        <title>DABS Co.</title>
      </Helmet>

      <div className="relative min-h-screen overflow-hidden" style={{ background: 'var(--artisan-gradient-bg)' }}>

        {/* ── Background: Grainient + Particles ─────────────────────── */}
        <div className="absolute inset-0 z-0 pointer-events-none" style={{ isolation: 'isolate' }}>
          {/* Soft lavender-cream movement keeps the Artisan Canvas background light. */}
          <Grainient
            className="opacity-80"
            color1="#FAF8FF"
            color2="#E6D5F3"
            color3="#D1ADDF"
            timeSpeed={0.1}
            colorBalance={0.08}
            warpStrength={1.2}
            warpFrequency={3.2}
            warpSpeed={0.8}
            warpAmplitude={65}
            blendAngle={18}
            blendSoftness={0.75}
            rotationAmount={180}
            noiseScale={1.4}
            grainAmount={0.018}
            grainScale={2}
            grainAnimated={false}
            contrast={0.96}
            gamma={1.04}
            saturation={0.72}
            centerX={0}
            centerY={0}
            zoom={1.05}
          />

          {/* Particles recolored to artisan purple/lavender */}
          <div className="absolute inset-0 pointer-events-none">
            <Particles
              particleCount={120}
              particleSpread={10}
              speed={0.1}
              particleColors={['#FFFFFF', '#E8D8F3', '#C9A0DC']}
              moveParticlesOnHover
              particleHoverFactor={1}
              alphaParticles={false}
              particleBaseSize={110}
              sizeRandomness={1.3}
              cameraDistance={53}
              disableRotation={false}
            />
          </div>
        </div>

        {/* ── HERO ──────────────────────────────────────────────────── */}
        <section className="relative flex min-h-[92vh] items-center">
          <PageContainer size="wide" className="relative z-10 grid items-center gap-12 py-16 text-center lg:grid-cols-[1.05fr_0.95fr] lg:gap-16 lg:py-20 lg:text-left">
            <div>

            {/* Artsy eyebrow label */}
            <div className="mb-6 inline-flex items-center gap-3">
              <span
                className="h-px w-10 bg-gradient-to-r from-artisan-primary to-transparent"
              />
              <span
                className="font-artisan-script text-lg text-artisan-primary"
              >
                Artisan Needlepoint Studio
              </span>
            </div>

            {/* Main headline */}
            <h1
              className="relative inline-block whitespace-nowrap font-artisan-display text-5xl font-bold leading-none tracking-tight text-artisan-text sm:text-6xl md:text-7xl lg:text-8xl"
            >
              {/* Shadow layer */}
              <span
                className="absolute inset-0"
                style={{
                  color: '#2D0E5A',
                  textShadow: '0 8px 22px rgba(92,45,145,0.14)',
                }}
              >
                DABS Co.
              </span>

              {/* ShinyText layer — lavender shine on cream */}
              <span className="relative z-10">
                <ShinyText
                  text="DABS Co."
                  speed={5}
                  delay={0}
                  color="#2D0E5A"
                  shineColor="#A87DC8"
                  spread={120}
                  direction="left"
                  yoyo={false}
                  pauseOnHover={false}
                  disabled={false}
                />
              </span>
            </h1>

            {/* Tagline */}
            <p
              className="mt-6 max-w-xl text-base leading-relaxed text-artisan-text-mid md:text-lg"
              style={{ fontFamily: "'Cormorant Garamond', serif" }}
            >
              "Transforming Your Needlepoint Designs into Stitch Ready Canvases"
            </p>

            {/* CTA buttons */}
            <div className="flex flex-col justify-center gap-3 pt-8 sm:flex-row lg:justify-start">
              <Link to="/gallery" className="w-full max-w-[310px] self-center sm:w-[310px] lg:self-auto">
                <Button
                  size="lg"
                  className="h-14 w-full rounded-full px-6 py-0 text-base font-semibold text-white transition-all duration-300 hover:-translate-y-0.5 hover:brightness-110"
                  style={{
                    background: 'linear-gradient(135deg, #5C2D91, #7B3FA0)',
                    boxShadow: '0 8px 28px rgba(92,45,145,0.45)',
                  }}
                >
                  <Palette className="mr-2" size={20} />
                  Explore Gallery
                  <ArrowRight className="ml-2" size={18} />
                </Button>
              </Link>

              <Link to="/pricelists" className="w-full max-w-[310px] self-center sm:w-[310px] lg:self-auto">
                <Button
                  size="lg"
                  variant="outline"
                  className="h-14 w-full rounded-full border-artisan-primary/25 bg-white/70 px-6 py-0 text-base font-semibold text-artisan-primary backdrop-blur-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-artisan-primary/55 hover:bg-white"
                >
                  <Brush className="mr-2" size={20} />
                  View Pricing
                </Button>
              </Link>
            </div>

            </div>

            <div className="flex items-center justify-center lg:justify-end">
              <ArtisanCardStack
                recentWorks={recentWorks}
                isLoading={recentWorksLoading}
                error={recentWorksError}
                formatPrice={formatPrice}
              />
            </div>
          </PageContainer>
        </section>

        {/* ── WHO WE ARE ────────────────────────────────────────────── */}
        <section className="relative z-10 overflow-hidden bg-[#2D0E5A] py-16 md:py-24">
          <motion.div
            initial={{ opacity: 0, y: 34 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-100px' }}
            transition={{ duration: 0.45 }}
            className="relative mx-auto max-w-7xl px-6 md:px-10 lg:px-12"
          >
            {/* Decorative blobs */}
            <div className="absolute inset-0 pointer-events-none">
              <div className="absolute inset-0 opacity-35 [background-image:repeating-linear-gradient(45deg,rgba(255,255,255,0.055)_0,rgba(255,255,255,0.055)_1px,transparent_1px,transparent_50%),repeating-linear-gradient(-45deg,rgba(255,255,255,0.055)_0,rgba(255,255,255,0.055)_1px,transparent_1px,transparent_50%)] [background-size:18px_18px]" />
              <div className="absolute -top-24 -left-20 h-72 w-72 rounded-full bg-artisan-primary-light/25 blur-3xl" />
              <div className="absolute -bottom-28 right-0 h-80 w-80 rounded-full bg-artisan-mauve/20 blur-3xl" />
            </div>

            <div className="relative z-10 grid items-center gap-12 md:grid-cols-[0.9fr_1.1fr] lg:gap-20">
              {/* Left — text */}
              <div className="text-center md:text-left">
                <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 backdrop-blur-sm">
                  <Flower2 size={15} className="text-artisan-primary-pale" aria-hidden="true" />
                  <span
                    className="font-artisan-script text-lg text-artisan-primary-pale"
                    style={{ fontFamily: "'Dancing Script', cursive", fontSize: '0.9rem', letterSpacing: '0.12em' }}
                  >
                    Our Story
                  </span>
                </div>

                <h2
                  className="mb-5 font-artisan-display text-5xl font-bold leading-[0.95] text-white md:text-6xl lg:text-7xl"
                >
                  Who We Are
                </h2>

                <p className="max-w-xl text-base leading-relaxed text-white/80 md:text-xl">
                  We support needlepoint designers in expanding their businesses through our
                  outsourced canvas painting services. Whether you're a startup or an established
                  brand, we are here to collaborate with you as your dedicated partner in growth.
                </p>

                <div className="pt-7">
                  <Link to="/about">
                    <Button
                      size="lg"
                      className="rounded-full px-8 py-6 font-semibold text-white transition-all duration-300 hover:-translate-y-1 hover:brightness-110"
                      style={{
                        background: 'linear-gradient(135deg, #5C2D91, #7B3FA0)',
                        boxShadow: '0 10px 28px rgba(92,45,145,0.25)',
                      }}
                    >
                      Learn More About Us
                      <ArrowRight className="ml-2" size={18} />
                    </Button>
                  </Link>
                </div>
              </div>

              {/* Right — info cards */}
              <div className="relative grid gap-4">
                <div
                  className="relative p-0"
                >
                  <div className="absolute inset-x-6 top-0 h-px bg-gradient-to-r from-transparent via-artisan-primary/20 to-transparent" />

                  <div className="grid gap-4">
                    {/* Card 1 — purple */}
                    <div className="rounded-2xl border border-artisan-primary/12 bg-white/85 p-6 shadow-[0_12px_28px_rgba(92,45,145,0.08)] transition-all duration-300 hover:-translate-y-2 hover:border-artisan-primary/35 hover:shadow-[0_18px_34px_rgba(92,45,145,0.16)]">
                      <p className="mb-1 text-base font-semibold text-artisan-primary">
                        Dedicated Partnership
                      </p>
                      <p className="text-sm leading-relaxed text-artisan-text-mid">
                        We work with designers as a reliable extension of their creative business.
                      </p>
                    </div>

                    {/* Card 2 — mauve */}
                    <div className="rounded-2xl border border-artisan-primary/12 bg-[#EFE5F7] p-6 shadow-[0_12px_28px_rgba(92,45,145,0.08)] transition-all duration-300 hover:-translate-y-2 hover:border-artisan-primary/35 hover:shadow-[0_18px_34px_rgba(92,45,145,0.16)]">
                      <p className="mb-1 text-base font-semibold text-artisan-primary">
                        Scalable Support
                      </p>
                      <p className="text-sm leading-relaxed text-artisan-text-mid">
                        From growing startups to established brands, we help support production needs.
                      </p>
                    </div>

                    {/* Card 3 — white */}
                    <div className="rounded-2xl border border-artisan-primary/12 bg-[#E3D1F0] p-6 shadow-[0_12px_28px_rgba(92,45,145,0.08)] transition-all duration-300 hover:-translate-y-2 hover:border-artisan-primary/35 hover:shadow-[0_18px_34px_rgba(92,45,145,0.16)]">
                      <p className="mb-1 text-base font-semibold text-artisan-primary">
                        Craft + Collaboration
                      </p>
                      <p className="text-sm leading-relaxed text-artisan-text-mid">
                        Our goal is to turn great designs into beautifully prepared stitch-ready canvases.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </section>

        {/* ── CREATIVE PROCESS ──────────────────────────────────────── */}
        <section className="relative z-10 overflow-hidden bg-[#F8F4EF] py-16 md:py-24">
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-80px' }}
            transition={{ duration: 0.6 }}
            className="relative mx-auto max-w-7xl px-6 md:px-10 lg:px-12"
          >
            {/* Decorative corner wash */}
            <div className="pointer-events-none absolute inset-0 opacity-30 [background-image:repeating-linear-gradient(45deg,rgba(92,45,145,0.08)_0,rgba(92,45,145,0.08)_1px,transparent_1px,transparent_50%),repeating-linear-gradient(-45deg,rgba(92,45,145,0.08)_0,rgba(92,45,145,0.08)_1px,transparent_1px,transparent_50%)] [background-size:18px_18px]" />
            <div className="pointer-events-none absolute -right-24 -top-24 h-80 w-80 rounded-full bg-artisan-primary-pale/30 blur-3xl" />
            <div className="pointer-events-none absolute -bottom-32 left-1/3 h-72 w-72 rounded-full bg-artisan-mauve/20 blur-3xl" />

            <div className="relative z-10 mx-auto mb-10 max-w-3xl text-center md:mb-12">
              <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-artisan-primary/15 bg-white/80 px-4 py-2 text-sm font-medium text-artisan-primary shadow-sm">
                <Flower2 size={15} aria-hidden="true" />
                From idea to canvas
              </div>
              <h2 className="mb-4 font-artisan-display text-4xl font-bold text-artisan-text md:text-5xl lg:text-6xl">
                Our Creative Process
              </h2>
              <p className="text-base text-artisan-text-mid md:text-lg">
                From your design to a stitch-ready canvas — four simple steps.
              </p>
            </div>

            <div className="relative z-10 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:gap-5">
              {steps.map((step, index) => {
                const Icon = step.icon;
                return (
                <motion.article
                  key={step.number}
                  initial={{ opacity: 0, scale: 0.92, y: 24 }}
                  whileInView={{ opacity: 1, scale: 1, y: 0 }}
                  viewport={{ once: true }}
                  whileHover={{ y: -8, scale: 1.025 }}
                  transition={{ duration: 0.42, delay: index * 0.1 }}
                      className="group relative min-h-[220px] overflow-hidden rounded-3xl border border-white/70 bg-[#FCFAFF] p-6 text-left shadow-[0_16px_35px_rgba(0,0,0,0.16)] transition-colors hover:border-artisan-primary-pale hover:bg-white sm:min-h-[245px]"
                >
                      <span className="absolute -right-1 -top-8 font-artisan-display text-8xl font-bold text-artisan-primary/[0.08] transition-transform duration-500 group-hover:scale-110">
                    {step.number}
                  </span>
                  <div className="relative flex items-start justify-between gap-4">
                        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-artisan-primary to-artisan-primary-mid text-white shadow-artisan-sm transition-transform duration-300 group-hover:rotate-6 group-hover:scale-110">
                      <Icon size={23} aria-hidden="true" />
                    </div>
                        <span className="font-artisan-display text-xl font-bold text-artisan-primary">{step.number}</span>
                  </div>

                  <h3 className="relative mt-7 text-xl font-bold text-artisan-text transition-colors group-hover:text-artisan-primary">{step.title}</h3>

                  <p className="relative mt-3 text-sm leading-relaxed text-artisan-text-mid">
                    {step.description}
                  </p>
                  <span className="absolute bottom-0 left-0 h-1 w-0 bg-gradient-to-r from-artisan-primary-pale to-artisan-mauve transition-all duration-500 group-hover:w-full" />
                </motion.article>
                );
              })}
            </div>
          </motion.div>
        </section>
      </div>
    </>
  );
};

export default HomePage;
