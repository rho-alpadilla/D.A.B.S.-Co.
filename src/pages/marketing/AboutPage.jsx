// src/pages/marketing/AboutPage.jsx
// Design A — Artisan Canvas reskin. All animations + structure preserved.
import React from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { Paintbrush, Heart, PenTool, ArrowRight, Flower2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import CircularText from '@/components/effects/CircularText';

const AboutPage = () => {
  const values = [
    {
      icon: <Paintbrush className="text-[#E7DED3]" size={28} strokeWidth={2.2} />,
      title: 'Hand Painted',
      desc: 'Every canvas is meticulously painted by skilled artisans with decades of experience.',
    },
    {
      icon: <PenTool className="text-[#E7DED3]" size={28} strokeWidth={2.2} />,
      title: 'Custom Designs',
      desc: 'We bring your unique vision to life — from painted masters to PDF chart files.',
    },
    {
      icon: <Heart className="text-[#E7DED3]" size={28} strokeWidth={2.2} />,
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

      <div className="artisan-grid-page relative min-h-screen overflow-hidden">

        <div className="relative z-10 mx-auto max-w-7xl px-5 py-12 sm:px-6 md:py-16 lg:px-8">

          {/* ── Hero ── */}
          <motion.section
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45 }}
            className="relative mx-auto mb-16 grid max-w-6xl items-center gap-10 py-10 text-center lg:grid-cols-[1fr_auto] lg:gap-20 lg:py-16 lg:text-left"
          >
            <div>
            <h1
              className="mb-6 font-artisan-display text-5xl font-bold leading-[0.9] tracking-[-0.045em] text-artisan-text md:text-6xl lg:text-7xl"
            >
              Who We Are
            </h1>

            <p className="mx-auto max-w-3xl text-lg leading-relaxed text-artisan-text-mid lg:mx-0 md:text-2xl">
              We support needlepoint designers with outsourced canvas painting services,
              from first order to growing production.
            </p>
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
              <div className="absolute flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-artisan-primary to-artisan-primary-mid text-white shadow-artisan-md">
                <Flower2 size={31} strokeWidth={1.8} aria-hidden="true" />
              </div>
            </motion.div>
          </motion.section>

          {/* ── Value Cards ── */}
          <motion.section
            initial={{ opacity: 0, y: 18 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-100px' }}
            transition={{ duration: 0.45 }}
            className="relative -mx-5 mb-12 overflow-hidden bg-[#2D0E5A] px-5 py-12 md:mb-16 md:py-16 lg:-mx-8 lg:px-8"
          >
            <div className="pointer-events-none absolute inset-0 opacity-35 [background-image:repeating-linear-gradient(45deg,rgba(255,255,255,0.05)_0,rgba(255,255,255,0.05)_1px,transparent_1px,transparent_50%),repeating-linear-gradient(-45deg,rgba(255,255,255,0.05)_0,rgba(255,255,255,0.05)_1px,transparent_1px,transparent_50%)] [background-size:18px_18px]" />
            <div className="relative z-10 mx-auto mb-10 max-w-5xl md:mb-12">
              <h2 className="font-artisan-display text-4xl font-bold tracking-[-0.035em] text-white md:text-5xl">What guides our work</h2>
            </div>
            <div className="relative z-10 mx-auto grid max-w-5xl divide-y divide-white/20 border-y border-white/20 sm:grid-cols-3 sm:divide-x sm:divide-y-0">
              {values.map((value, index) => (
                <motion.div
                  key={value.title}
                  initial={{ opacity: 0, y: 18 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: false, amount: 0.35 }}
                  transition={{ duration: 0.35, delay: index * 0.08 }}
                  whileHover={{ x: 4 }}
                  className="group px-0 py-7 transition-colors sm:px-7 sm:py-1 first:sm:pl-0 last:sm:pr-0"
                >
                  <div className="mb-5 transition-transform duration-300 group-hover:rotate-6">
                    {value.icon}
                  </div>
                  <span className="mb-2 font-nunito text-base font-bold text-white">
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
            className="border-t border-artisan-primary/20 py-10 text-center md:py-12 md:text-left"
          >
            <div className="grid items-end gap-7 md:grid-cols-[minmax(0,1fr)_auto] md:gap-10">
              <div>
                <h2 className="mb-2 font-artisan-display text-4xl font-bold tracking-[-0.035em] text-artisan-text md:text-5xl">
                  Start a project
                </h2>
                <p className="text-artisan-text-mid">
                  Tell us about your design.
                </p>
              </div>
              <div className="grid w-full gap-3 sm:grid-cols-2 md:w-[31rem]">
                <Link to="/contact" className="w-full">
                  <Button className="h-14 w-full bg-artisan-primary text-base font-semibold text-white shadow-[0_8px_24px_rgba(92,45,145,0.2)] transition-transform hover:scale-[1.02] hover:bg-[#4A247B]">
                    Contact Us
                  </Button>
                </Link>

                <Link to="/gallery" className="w-full">
                  <Button variant="outline" className="group h-14 w-full border-2 border-artisan-primary px-6 py-0 text-base font-semibold text-artisan-primary transition-colors hover:bg-white/70">
                    View Gallery
                    <ArrowRight size={18} className="ml-2 transition-transform group-hover:translate-x-1" />
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
