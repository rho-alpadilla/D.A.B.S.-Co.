import React from 'react';
import { Helmet } from 'react-helmet';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowRight, Palette, Brush } from 'lucide-react';
import { motion } from 'framer-motion';
import Grainient from '@/components/ui-bits/Grainient';
import ShinyText from '@/components/ui-bits/ShinyText';
import Particles from '@/components/ui-bits/Particles';

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

        {/* Hero */}
        <section className="relative min-h-[92vh] flex items-center justify-center">
          <div className="mx-auto w-full max-w-6xl px-6 relative z-10 text-center py-20">
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
              <Link to="/gallery">
                <Button
                  size="lg"
                  className="bg-[#0d7070] hover:bg-[#f2bb16] text-white font-semibold text-base px-9 py-6 rounded-2xl shadow-xl shadow-[#0d7070]/40 hover:shadow-[#f2bb16]/50 transition-all duration-300 hover:scale-[1.03]"
                >
                  <Palette className="mr-2" size={20} />
                  Explore Gallery
                  <ArrowRight className="ml-2" size={18} />
                </Button>
              </Link>

              <Link to="/pricelists">
                <Button
                  size="lg"
                  variant="outline"
                  className="border-2 border-white/40 text-white bg-white/15 hover:bg-[#f2bb16] hover:border-[#f2bb16] hover:text-white font-semibold text-base px-9 py-6 rounded-2xl backdrop-blur-sm transition-all duration-300 hover:scale-[1.03]"
                >
                  <Brush className="mr-2" size={20} />
                  View Pricing
                </Button>
              </Link>
            </div>

            <div className="pt-10">
              <p className="text-xs md:text-sm tracking-[0.25em] uppercase text-white/80">
              
              </p>
            </div>
          </div>
        </section>

        {/* Creative Process */}
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