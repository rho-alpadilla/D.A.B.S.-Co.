import React from 'react';
import { Helmet } from 'react-helmet';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowRight, Palette, Brush } from 'lucide-react';
import { motion } from 'framer-motion';
import Grainient from '@/components/effects/Grainient';
import ShinyText from '@/components/effects/ShinyText';
import Particles from '@/components/effects/Particles';
import PageContainer from '@/components/layout/PageContainer';

const HomePage = () => {
  const steps = [
    {
      number: '01',
      title: 'Design Submission',
      description:
        'All approved designers will submit needlepoint canvas designs through the Gallery tab. We can work off painted masters or PDF chart files.',
    },
    {
      number: '02',
      title: 'Design Quoted',
      description:
        'Receive your quote with price per piece within 1-3 business days via email. If satisfied, place your order through Contact.',
    },
    {
      number: '03',
      title: 'Master Painted',
      description:
        'A painted proof of your design will be sent via email for approval. This will be stored at the studio as a master for easy reordering.',
    },
    {
      number: '04',
      title: 'Order Painted',
      description:
        'Upon master approval, production begins. Once completed, we receive the canvases in Dallas and invoice you.',
    },
  ];

  return (
    <>
      <Helmet>
        <title>DABS Co.</title>
      </Helmet>

      <div className="relative bg-[#daf0ee] min-h-screen overflow-hidden">
        {/* Background */}
        <div className="absolute inset-0 z-0 pointer-events-none" style={{ isolation: 'isolate' }}>
          <Grainient
            color1="#118c8c"
            color2="#118c8c"
            color3="#fbfe9f"
            timeSpeed={0.25}
            colorBalance={-0.06}
            warpStrength={1.5}
            warpFrequency={3.8}
            warpSpeed={2}
            warpAmplitude={50}
            blendAngle={0}
            blendSoftness={1}
            rotationAmount={500}
            noiseScale={2}
            grainAmount={0.1}
            grainScale={2}
            grainAnimated={false}
            contrast={1.5}
            gamma={1}
            saturation={1}
            centerX={0}
            centerY={0}
            zoom={0.9}
          />

          <div className="absolute inset-0 pointer-events-none">
            <Particles
              particleCount={400}
              particleSpread={10}
              speed={0.1}
              particleColors={['#faf8f1', '#118c8c', '#f1bb19']}
              moveParticlesOnHover
              particleHoverFactor={1}
              alphaParticles={false}
              particleBaseSize={150}
              sizeRandomness={1.7}
              cameraDistance={53}
              disableRotation={false}
            />
          </div>
        </div>

        {/* ── HERO ──────────────────────────────────────────────────────────
            Problem #4 fix: this wrapper was `max-w-6xl px-6` with no
            `container` class — px-6 didn't match Header/Footer's px-4, so
            the hero text sat slightly inset from every other section on
            the site. Now uses the shared PageContainer (size="wide" =
            max-w-6xl, same as before) for consistent edges. */}
        <section className="relative min-h-[92vh] flex items-center justify-center">
          <PageContainer size="wide" className="relative z-10 text-center py-20">
            <h1
              className="text-7xl md:text-9xl tracking-tight leading-none relative inline-block"
              style={{ fontFamily: "'Agbalumo', cursive" }}
            >
              <span
                className="absolute inset-0"
                style={{
                  color: '#faf8f1',
                  textShadow: `
                    0 -2px 0 rgba(255,255,255,0.9),
                    0 -1px 0 rgba(255,255,255,0.7),
                    0 1px 0 rgba(0,0,0,0.4),
                    0 3px 4px rgba(0,0,0,0.45),
                    0 6px 10px rgba(0,0,0,0.4),
                    0 14px 28px rgba(0,0,0,0.45),
                    0 20px 40px rgba(0,0,0,0.3),
                    inset 0 1px 0 rgba(255,255,255,0.5)
                  `,
                }}
              >
                DABS Co.
              </span>

              <span className="relative z-10">
                <ShinyText
                  text="DABS Co."
                  speed={5}
                  delay={0}
                  color="#faf8f1"
                  shineColor="#f2bb16"
                  spread={120}
                  direction="left"
                  yoyo={false}
                  pauseOnHover={false}
                  disabled={false}
                />
              </span>
            </h1>

            <p
              className="mt-4 text-lg md:text-2xl italic text-[#FAF8F1]"
              style={{ fontFamily: "'Playfair Display', serif" }}
            >
              “Transforming Your Needlepoint Designs into Stitch Ready Canvases”
            </p>

            <div className="flex flex-col sm:flex-row gap-3 justify-center pt-8">
              <Link to="/gallery" className="w-full max-w-[310px] self-center sm:w-[310px]">
                <Button
                  size="lg"
                  className="h-14 w-full rounded-2xl bg-[#0d7070] px-6 py-0 text-base font-semibold text-white shadow-xl shadow-[#0d7070]/40 transition-all duration-300 hover:scale-[1.03] hover:bg-[#f2bb16] hover:shadow-[#f2bb16]/50"
                >
                  <Palette className="mr-2" size={20} />
                  Explore Gallery
                  <ArrowRight className="ml-2" size={18} />
                </Button>
              </Link>

              <Link to="/pricelists" className="w-full max-w-[310px] self-center sm:w-[310px]">
                <Button
                  size="lg"
                  variant="outline"
                  className="h-14 w-full rounded-2xl border-2 border-white/40 bg-white/15 px-6 py-0 text-base font-semibold text-white backdrop-blur-sm transition-all duration-300 hover:scale-[1.03] hover:border-[#f2bb16] hover:bg-[#f2bb16] hover:text-white"
                >
                  <Brush className="mr-2" size={20} />
                  View Pricing
                </Button>
              </Link>
            </div>

            <div className="pt-10">
              <p className="text-xs md:text-sm tracking-[0.25em] uppercase text-white/80"></p>
            </div>
          </PageContainer>
        </section>

        {/* ── WHO WE ARE ────────────────────────────────────────────────────
            Already used px-4 (matches the site-wide standard) so it aligns
            correctly with Header/Footer/Hero — left as-is, just labeled. */}
        <section className="relative z-10 px-4 pb-8 md:pb-10">
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-100px' }}
            transition={{ duration: 0.45 }}
            className="max-w-6xl mx-auto relative overflow-hidden rounded-[2rem] border border-white/40 bg-gradient-to-br from-white/85 via-white/70 to-[#f7fffe]/75 backdrop-blur-md shadow-[0_20px_60px_rgba(17,140,140,0.12)]"
          >
            {/* Soft decorative background */}
            <div className="absolute inset-0 pointer-events-none">
              <div className="absolute -top-16 -left-16 h-52 w-52 rounded-full bg-[#118C8C]/12 blur-3xl" />
              <div className="absolute -bottom-20 -right-10 h-60 w-60 rounded-full bg-[#F2BB16]/16 blur-3xl" />
              <div className="absolute top-0 left-1/2 h-full w-px bg-gradient-to-b from-transparent via-[#118C8C]/10 to-transparent hidden md:block" />
            </div>

            <div className="relative z-10 grid md:grid-cols-[1.05fr_0.95fr] items-center gap-10 p-8 md:p-12 lg:p-14">
              {/* Left content */}
              <div className="text-center md:text-left">
                <div className="inline-flex items-center gap-2 rounded-full border border-[#118C8C]/15 bg-[#118C8C]/8 px-4 py-1.5 mb-5">
                  <span className="h-2 w-2 rounded-full bg-[#F2BB16]" />
                  <span className="text-xs md:text-sm font-semibold tracking-[0.18em] uppercase text-[#118C8C]">
                    Our Story
                  </span>
                </div>

                <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-[#118C8C] leading-tight mb-5">
                  Who We Are
                </h2>

                <p className="text-gray-700 text-base md:text-lg leading-relaxed max-w-2xl">
                  We support needlepoint designers in expanding their businesses through our
                  outsourced canvas painting services. Whether you're a startup or an established
                  brand, we are here to collaborate with you as your dedicated partner in growth.
                </p>

                <div className="pt-7">
                  <Link to="/about">
                    <Button
                      size="lg"
                      className="bg-[#118C8C] hover:bg-[#0d7070] text-white font-semibold px-8 py-6 rounded-2xl shadow-lg shadow-[#118C8C]/25 transition-all duration-300 hover:scale-[1.03]"
                    >
                      Learn More About Us
                      <ArrowRight className="ml-2" size={18} />
                    </Button>
                  </Link>
                </div>
              </div>

              {/* Right visual card */}
              <div className="relative">
                <div className="relative rounded-[1.75rem] border border-white/50 bg-white/80 backdrop-blur-sm p-6 md:p-7 shadow-[0_14px_40px_rgba(0,0,0,0.08)]">
                  <div className="absolute inset-x-6 top-0 h-px bg-gradient-to-r from-transparent via-[#118C8C]/30 to-transparent" />

                  <div className="grid gap-4">
                    <div className="rounded-2xl bg-[#118C8C]/8 border border-[#118C8C]/10 p-4">
                      <p className="text-sm font-semibold text-[#118C8C] mb-1">Dedicated Partnership</p>
                      <p className="text-sm text-gray-600 leading-relaxed">
                        We work with designers as a reliable extension of their creative business.
                      </p>
                    </div>

                    <div className="rounded-2xl bg-[#F2BB16]/10 border border-[#F2BB16]/20 p-4">
                      <p className="text-sm font-semibold text-[#9a7400] mb-1">Scalable Support</p>
                      <p className="text-sm text-gray-600 leading-relaxed">
                        From growing startups to established brands, we help support production needs.
                      </p>
                    </div>

                    <div className="rounded-2xl bg-white border border-gray-100 p-4 shadow-sm">
                      <p className="text-sm font-semibold text-gray-800 mb-1">Craft + Collaboration</p>
                      <p className="text-sm text-gray-600 leading-relaxed">
                        Our goal is to turn great designs into beautifully prepared stitch-ready canvases.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </section>

        {/* ── CREATIVE PROCESS ──────────────────────────────────────────────
            Already used px-4 — matches the site-wide standard, left as-is. */}
        <section className="relative z-10 px-4 pb-14 md:pb-20">
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-100px' }}
            transition={{ duration: 0.45 }}
            className="max-w-7xl mx-auto bg-white/75 backdrop-blur-md rounded-[2rem] p-8 md:p-12 shadow-sm border border-white/30 relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-64 h-64 bg-white opacity-30 rounded-bl-full pointer-events-none" />

            <div className="text-center max-w-2xl mx-auto mb-10 md:mb-12">
              <h2 className="text-3xl md:text-4xl font-bold text-[#118C8C] mb-4">
                Our Creative Process
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-6 relative">
              {steps.map((step, index) => (
                <motion.div
                  key={step.number}
                  initial={{ opacity: 0, y: 18 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.35, delay: index * 0.08 }}
                  className="text-center relative z-10 bg-white/80 backdrop-blur-sm rounded-2xl border border-[#eef7f7] p-6 hover:shadow-md transition-all duration-300"
                >
                  <div className="w-16 h-16 bg-[#e0f2f2] rounded-full flex items-center justify-center mx-auto mb-6 text-[#118C8C] font-bold text-xl shadow-sm border border-[#cbebeb]">
                    {step.number}
                  </div>

                  <h3 className="text-lg font-bold text-gray-900 mb-3">{step.title}</h3>

                  <p className="text-gray-600 text-sm leading-relaxed">
                    {step.description}
                  </p>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </section>
      </div>
    </>
  );
};

export default HomePage;
