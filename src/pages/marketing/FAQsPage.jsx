import React from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import Grainient from '@/components/effects/Grainient';
import Particles from '@/components/effects/Particles';
import { faqs } from '@/data/faqs';

const FAQsPage = () => {
  return (
    <>
      <Helmet>
        <title>FAQs - D.A.B.S. Co.</title>
        <meta
          name="description"
          content="Find answers to frequently asked questions about D.A.B.S. Co.'s handcrafted products, custom orders, shipping, and more."
        />
      </Helmet>

      <div className="relative min-h-screen bg-[#daf0ee] overflow-hidden">
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

        {/* FAQ content */}
        <div className="relative z-10 container mx-auto px-4 py-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="max-w-4xl mx-auto"
          >
            <h1 className="text-4xl md:text-5xl font-bold text-[#118C8C] mb-4 text-center">
              Frequently Asked Questions
            </h1>

            <p className="text-lg text-gray-600 mb-12 text-center">
              Find answers to common questions about our products and services
            </p>

            <div className="space-y-6">
              {faqs.map((faq, index) => (
                <motion.div
                  key={faq.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: index * 0.05 }}
                  className="bg-white rounded-lg shadow-lg p-6"
                >
                  <h2 className="text-xl font-semibold text-[#118C8C] mb-3">
                    {faq.question}
                  </h2>
                  <p className="text-gray-700 leading-relaxed">{faq.answer}</p>
                </motion.div>
              ))}
            </div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="bg-[#118C8C] text-white rounded-lg p-8 mt-12 text-center"
            >
              <h2 className="text-2xl font-bold mb-4">Still Have Questions?</h2>
              <p className="text-lg mb-4">
                We&apos;re here to help! Feel free to reach out to us directly.
              </p>
              <p className="text-lg">
                Email us at{' '}
                <a
                  href="mailto:contact@dabsco.com"
                  className="underline font-semibold"
                >
                  contact@dabsco.com
                </a>
              </p>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </>
  );
};

export default FAQsPage;