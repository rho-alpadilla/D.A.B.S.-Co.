// src/pages/marketing/AboutPage.jsx
// Design A — Artisan Canvas reskin. All animations + structure preserved.
import React from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { Paintbrush, Heart, PenTool, ArrowRight, Flower2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import Grainient from '@/components/effects/Grainient';
import Particles from '@/components/effects/Particles';
import CircularText from '@/components/effects/CircularText';
import ShinyText from '@/components/effects/ShinyText';

const AboutPage = () => {
  const values = [
    {
      icon: <Paintbrush className="text-artisan-primary" size={28} strokeWidth={2.2} />,
      title: 'Hand Painted',
      desc: 'Every canvas is meticulously painted by skilled artisans with decades of experience.',
    },
    {
      icon: <PenTool className="text-artisan-primary" size={28} strokeWidth={2.2} />,
      title: 'Custom Designs',
      desc: 'We bring your unique vision to life — from painted masters to PDF chart files.',
    },
    {
      icon: <Heart className="text-artisan-mauve-deep" size={28} strokeWidth={2.2} />,
      title: 'Made with Love',
      desc: 'Each piece carries the passion and care of artisans who love what they create.',
    },
  ];

  return (
    <>
      <Helmet>
        <title>About Us - D.A.B.S. Co.</title>
        <meta name="description" content="Learn about the story, creative process, and mission behind D.A.B.S. Co. artisan crafts." />
      </Helmet>

      <div className="relative min-h-screen overflow-hidden" style={{ background: 'var(--artisan-gradient-bg)' }}>
        {/* Background */}
        <div className="absolute inset-0 z-0 pointer-events-none" style={{ isolation: 'isolate' }}>
          <Grainient
            className="opacity-55"
            color1="#FAF8FF" color2="#E6D5F3" color3="#D1ADDF"
            timeSpeed={0.1} colorBalance={0.08} warpStrength={1.2}
            warpFrequency={3.2} warpSpeed={0.8} warpAmplitude={65}
            blendAngle={18} blendSoftness={0.75} rotationAmount={180}
            noiseScale={1.4} grainAmount={0.018} grainScale={2}
            grainAnimated={false} contrast={0.96} gamma={1.04}
            saturation={0.72} centerX={0} centerY={0} zoom={1.05}
          />
          <div className="absolute inset-0 pointer-events-none">
            <Particles
              particleCount={110} particleSpread={10} speed={0.1}
              particleColors={['#FFFFFF', '#E8D8F3', '#C9A0DC']}
              moveParticlesOnHover particleHoverFactor={1}
              alphaParticles={false} particleBaseSize={110}
              sizeRandomness={1.3} cameraDistance={53} disableRotation={false}
            />
          </div>
        </div>

        <div className="relative z-10 mx-auto max-w-7xl px-5 py-12 sm:px-6 md:py-16 lg:px-8">

          {/* ── Hero ── */}
          <motion.section
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45 }}
            className="relative mx-auto mb-16 grid max-w-6xl items-center gap-10 py-10 text-center lg:grid-cols-[1fr_auto] lg:gap-20 lg:py-16 lg:text-left"
          >
            <div>
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-artisan-primary/15 bg-white/80 px-4 py-2 text-sm font-medium text-artisan-primary shadow-sm backdrop-blur-sm">
              <Flower2 size={15} aria-hidden="true" />
              About D.A.B.S. Co.
            </div>

            <h1
              className="mb-6 font-artisan-display text-5xl font-bold leading-[0.9] tracking-tight text-artisan-text md:text-6xl lg:text-7xl"
            >
              Who We Are
            </h1>

            <p className="mx-auto max-w-3xl text-lg leading-relaxed text-artisan-text-mid lg:mx-0 md:text-2xl">
              "We support needlepoint designers in expanding their businesses through our
              outsourced canvas painting services. Whether you're a startup or an
              established brand, we are here to collaborate with you as your dedicated
              partner in growth."
            </p>
            <div className="mt-7 text-lg font-medium lg:text-xl">
              <ShinyText
                text="Crafted with intention, made for your vision."
                color="#5C2D91"
                shineColor="#C9A0DC"
                speed={5}
                spread={120}
                pauseOnHover
              />
            </div>
            </div>

            <motion.div
              initial={{ opacity: 0, scale: 0.86, rotate: -12 }}
              animate={{ opacity: 1, scale: 1, rotate: 0 }}
              transition={{ duration: 0.65, delay: 0.16 }}
              className="relative mx-auto hidden h-56 w-56 items-center justify-center rounded-full border border-artisan-primary/15 bg-white/55 shadow-[0_18px_46px_rgba(92,45,145,0.14)] backdrop-blur-sm lg:flex"
            >
              <CircularText
                text="D.A.B.S. CO. • ARTISAN STUDIO • "
                size={190}
                fontSize="0.72rem"
                spinDuration={24}
                onHover="speedUp"
                className="!text-artisan-primary"
              />
              <div className="absolute flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-artisan-primary to-artisan-primary-mid text-3xl text-white shadow-artisan-md">
                ✿
              </div>
            </motion.div>
          </motion.section>

          {/* ── Value Cards ── */}
          <motion.section
            initial={{ opacity: 0, y: 18 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-100px' }}
            transition={{ duration: 0.45 }}
            className="relative mb-12 overflow-hidden rounded-[2rem] border border-white/15 bg-[#2D0E5A] p-6 shadow-[0_24px_60px_rgba(45,14,90,0.24)] md:mb-16 md:p-10"
          >
            <div className="pointer-events-none absolute inset-0 opacity-35 [background-image:repeating-linear-gradient(45deg,rgba(255,255,255,0.05)_0,rgba(255,255,255,0.05)_1px,transparent_1px,transparent_50%),repeating-linear-gradient(-45deg,rgba(255,255,255,0.05)_0,rgba(255,255,255,0.05)_1px,transparent_1px,transparent_50%)] [background-size:18px_18px]" />
            <div className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-artisan-primary-light/25 blur-3xl" />
            <div className="relative z-10 mx-auto mb-8 max-w-2xl text-center md:mb-10">
              <p className="font-artisan-script text-xl text-artisan-primary-pale">What guides our work</p>
              <h2 className="mt-2 font-artisan-display text-3xl font-bold text-white md:text-4xl">Crafted for creative partners</h2>
            </div>
            <div className="relative z-10 mx-auto grid max-w-5xl grid-cols-1 gap-4 sm:grid-cols-3 md:gap-6">
              {values.map((value, index) => (
                <motion.div
                  key={value.title}
                  initial={{ opacity: 0, x: index === 0 ? -28 : index === 2 ? 28 : 0, y: index === 1 ? 20 : 0 }}
                  whileInView={{ opacity: 1, x: 0, y: 0 }}
                  viewport={{ once: false, amount: 0.35 }}
                  transition={{ duration: 0.35, delay: index * 0.08 }}
                  whileHover={{ y: -8, scale: 1.02 }}
                  className={`group flex flex-col rounded-3xl border border-white/15 bg-white/10 p-7 backdrop-blur-sm transition-colors hover:bg-white/16 ${
                    index === 0
                      ? 'items-start text-left sm:translate-y-8'
                      : index === 1
                        ? 'items-center text-center'
                        : 'items-end text-right sm:translate-y-8'
                  }`}
                >
                  <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-artisan-primary-pale to-artisan-mauve shadow-artisan-sm transition-transform duration-300 group-hover:rotate-6 group-hover:scale-110">
                    {value.icon}
                  </div>
                  <span className="mb-2 text-base font-bold text-white">
                    {value.title}
                  </span>
                  <p className="text-sm leading-relaxed text-white/70">
                    {value.desc}
                  </p>
                </motion.div>
              ))}
            </div>
          </motion.section>

          {/* ── CTA ── */}
          <motion.section
            initial={{ opacity: 0, y: 18 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: false, amount: 0.4 }}
            transition={{ duration: 0.45 }}
            className="relative overflow-hidden rounded-[2rem] border border-artisan-primary/12 bg-gradient-to-br from-[#F0E5F8] via-[#FCF7F1] to-[#E5D2F2] p-8 text-center shadow-[0_18px_45px_rgba(92,45,145,0.12)] md:p-12 md:text-left"
          >
            <div className="pointer-events-none absolute -left-16 -top-16 h-48 w-48 rounded-full bg-white/60 blur-3xl" />
            <div className="relative z-10">
            <h2
              className="mb-2 font-artisan-display text-3xl font-bold text-artisan-text md:text-4xl"
            >
              Ready to start your project?
            </h2>
            <p className="mb-6 text-sm text-artisan-text-mid">
              Let's build something beautiful together.
            </p>

            <div className="mx-auto mt-2 grid w-full max-w-[520px] grid-cols-1 gap-4 md:mx-0 sm:grid-cols-2">
              <Link to="/contact" className="w-full">
                <Button
                  className="h-14 w-full rounded-full text-base font-semibold text-white transition-all hover:scale-[1.02]"
                  style={{ background: 'linear-gradient(135deg, #5C2D91, #7B3FA0)', boxShadow: '0 8px 24px rgba(92,45,145,0.28)' }}
                >
                  Contact Us
                </Button>
              </Link>

              <Link to="/gallery" className="w-full">
                <Button
                  variant="outline"
                  className="group h-14 w-full rounded-full border-2 border-artisan-primary px-6 py-0 text-base font-semibold text-artisan-primary transition-colors hover:bg-white/70"
                >
                  View Gallery
                  <ArrowRight size={18} className="ml-2 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
            </div>
            </div>
          </motion.section>
        </div>
      </div>
    </>
  );
};

export default AboutPage;
