import React from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { Paintbrush, Heart, PenTool, ArrowRight, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import Grainient from '@/components/ui-bits/Grainient';
import Particles from '@/components/ui-bits/Particles';

const AboutPage = () => {
  const values = [
    {
      icon: <Paintbrush className="text-[#118C8C]" size={28} strokeWidth={2.2} />,
      title: 'Hand Painted',
    },
    {
      icon: <PenTool className="text-[#118C8C]" size={28} strokeWidth={2.2} />,
      title: 'Custom Designs',
    },
    {
      icon: <Heart className="text-[#118C8C]" size={28} strokeWidth={2.2} />,
      title: 'Made with Love',
    },
  ];

  return (
    <>
      <Helmet>
        <title>About Us - D.A.B.S. Co.</title>
        <meta
          name="description"
          content="Learn about the story, creative process, and mission behind D.A.B.S. Co. artisan crafts."
        />
      </Helmet>

      <div className="relative min-h-screen bg-[#daf0ee] overflow-hidden">
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

        <div className="relative z-10 container mx-auto px-4 py-16 max-w-7xl">
          <motion.section
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45 }}
            className="text-center max-w-4xl mx-auto mb-16 md:mb-20"
          >
            <div className="inline-flex items-center gap-2 rounded-full border border-white/30 bg-white/20 backdrop-blur-sm px-4 py-1.5 text-sm font-medium text-[#FAF8F1] mb-5">
              <Sparkles size={15} />
              About D.A.B.S. Co.
            </div>

            <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-[#FAF8F1] mb-6 tracking-tight">
              Who We Are
            </h1>

            <p className="text-lg md:text-xl text-white/90 max-w-3xl mx-auto leading-relaxed italic">
              "We support needlepoint designers in expanding their businesses through our
              outsourced canvas painting services. Whether you're a startup or an
              established brand, we are here to collaborate with you as your dedicated
              partner in growth."
            </p>
          </motion.section>

          <motion.section
            initial={{ opacity: 0, y: 18 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-100px' }}
            transition={{ duration: 0.45 }}
            className="mb-16 md:mb-20"
          >
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 md:gap-8 max-w-5xl mx-auto">
              {values.map((value, index) => (
                <motion.div
                  key={value.title}
                  initial={{ opacity: 0, y: 16 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.35, delay: index * 0.08 }}
                  className="flex flex-col items-center p-8 bg-white/90 backdrop-blur-md rounded-2xl shadow-sm border border-white/30 hover:shadow-md transition-all duration-300"
                >
                  <div className="w-14 h-14 rounded-2xl bg-white flex items-center justify-center shadow-sm border border-[#e0f2f2] mb-4">
                    {value.icon}
                  </div>
                  <span className="text-base font-bold text-[#118C8C] text-center">
                    {value.title}
                  </span>
                </motion.div>
              ))}
            </div>
          </motion.section>

          <motion.section
            initial={{ opacity: 0, y: 18 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.45 }}
            className="text-center bg-white/90 backdrop-blur-md rounded-3xl p-8 md:p-10 border border-white/30 shadow-sm"
          >
            <h2 className="text-2xl md:text-3xl font-bold text-[#118C8C] mb-4">
              Ready to start your project?
            </h2>

            <div className="flex flex-col sm:flex-row justify-center gap-4 mt-6">
              <Link to="/contact">
                <Button className="w-full sm:w-auto bg-[#118C8C] hover:bg-[#0d7070] text-white px-8 py-6 rounded-2xl text-md font-semibold transition-colors shadow-sm">
                  Contact Us
                </Button>
              </Link>

              <Link to="/gallery">
                <Button
                  variant="outline"
                  className="w-full sm:w-auto border-2 border-[#118C8C] text-[#118C8C] hover:bg-[#e0f2f2] px-8 py-6 rounded-2xl text-md font-semibold transition-colors flex items-center gap-2 group"
                >
                  View Gallery
                  <ArrowRight
                    size={18}
                    className="group-hover:translate-x-1 transition-transform"
                  />
                </Button>
              </Link>
            </div>
          </motion.section>
        </div>
      </div>
    </>
  );
};

export default AboutPage;