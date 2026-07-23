// src/pages/marketing/PrivacyPolicyPage.jsx
// Design A — Artisan Canvas reskin. All legal content unchanged.
import React from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { Sparkles, ShieldCheck } from 'lucide-react';
import Grainient from '@/components/effects/Grainient';
import Particles from '@/components/effects/Particles';

const PrivacyPolicyPage = () => {
  const sectionHeadingCls =
    'mb-3 font-artisan-display text-2xl font-bold text-[#2A1739]';

  return (
    <>
      <Helmet>
        <title>Privacy Policy - D.A.B.S. Co.</title>
        <meta
          name="description"
          content="Read D.A.B.S. Co.'s privacy policy to understand how we collect, use, and protect your personal information."
        />
      </Helmet>

      <div className="relative min-h-screen overflow-hidden" style={{ background: 'var(--artisan-gradient-bg)' }}>
        {/* Background */}
        <div className="absolute inset-0 z-0 pointer-events-none" style={{ isolation: 'isolate' }}>
          <Grainient
            color1="#5C2D91" color2="#7B3FA0" color3="#C9A0DC"
            timeSpeed={0.25} colorBalance={-0.06} warpStrength={1.5}
            warpFrequency={3.8} warpSpeed={2} warpAmplitude={50}
            blendAngle={0} blendSoftness={1} rotationAmount={500}
            noiseScale={2} grainAmount={0.1} grainScale={2}
            grainAnimated={false} contrast={1.5} gamma={1}
            saturation={1} centerX={0} centerY={0} zoom={0.9}
          />
          <div className="absolute inset-0 pointer-events-none">
            <Particles
              particleCount={400} particleSpread={10} speed={0.1}
              particleColors={['#FAF8FF', '#A87DC8', '#C9A0DC']}
              moveParticlesOnHover particleHoverFactor={1}
              alphaParticles={false} particleBaseSize={150}
              sizeRandomness={1.7} cameraDistance={53} disableRotation={false}
            />
          </div>
        </div>

        <div className="relative z-10 container mx-auto px-5 py-14 md:px-8 md:py-20">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, ease: 'easeOut' }}
            className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[0.72fr_1.28fr] lg:items-start lg:gap-16"
          >
            <aside className="h-fit text-white lg:sticky lg:top-24">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-white backdrop-blur-sm">
                <Sparkles size={14} />
                Legal Information
              </div>
              <div className="mt-6 flex items-center gap-3">
                <ShieldCheck className="text-artisan-primary-pale" size={34} />
                <h1
                  className="font-artisan-display text-5xl font-bold leading-[0.95] text-white md:text-6xl"
                  style={{ fontFamily: "'Playfair Display', serif" }}
                >
                  Privacy Policy
                </h1>
              </div>
              <p className="mt-6 border-y border-white/25 py-5 text-sm text-white/85">
                Last Updated: {new Date().toLocaleDateString()}
              </p>
            </aside>

            <article className="space-y-8 rounded-[2rem] border border-white/45 bg-[#FFFCFA]/95 p-6 shadow-2xl shadow-[#2D0E5A]/25 backdrop-blur-md sm:p-10">
              <section>
                <h2 className={sectionHeadingCls}>Introduction</h2>
                <p className="leading-relaxed text-[#5B4C66]">
                  At D.A.B.S. Co., we are committed to protecting your privacy. This Privacy Policy
                  explains how we collect, use, disclose, and safeguard your information when you
                  visit our website or use our services.
                </p>
              </section>

              <section>
                <h2 className={sectionHeadingCls}>Information We Collect</h2>
                <p className="mb-3 leading-relaxed text-[#5B4C66]">
                  We may collect the following types of information:
                </p>
                <ul className="ml-4 list-inside list-disc space-y-2 text-[#5B4C66]">
                  <li>Personal identification information (name, email address, phone number)</li>
                  <li>Order and commission details</li>
                  <li>Payment information (processed securely through third-party providers)</li>
                  <li>Communication preferences</li>
                </ul>
              </section>

              <section>
                <h2 className={sectionHeadingCls}>How We Use Your Information</h2>
                <p className="mb-3 leading-relaxed text-[#5B4C66]">
                  We use the information we collect to:
                </p>
                <ul className="ml-4 list-inside list-disc space-y-2 text-[#5B4C66]">
                  <li>Process and fulfill your orders and commissions</li>
                  <li>Communicate with you about your orders and our services</li>
                  <li>Improve our website and customer service</li>
                  <li>Send promotional materials (with your consent)</li>
                </ul>
              </section>

              <section>
                <h2 className={sectionHeadingCls}>Data Security</h2>
                <p className="leading-relaxed text-[#5B4C66]">
                  We implement appropriate technical and organizational security measures to protect
                  your personal information against unauthorized access, alteration, disclosure, or
                  destruction.
                </p>
              </section>

              <section>
                <h2 className={sectionHeadingCls}>Your Rights</h2>
                <p className="mb-3 leading-relaxed text-[#5B4C66]">You have the right to:</p>
                <ul className="ml-4 list-inside list-disc space-y-2 text-[#5B4C66]">
                  <li>Access your personal information</li>
                  <li>Request correction of inaccurate data</li>
                  <li>Request deletion of your data</li>
                  <li>Opt-out of marketing communications</li>
                </ul>
              </section>

              <section>
                <h2 className={sectionHeadingCls}>Contact Us</h2>
                <p className="leading-relaxed text-[#5B4C66]">
                  If you have any questions about this Privacy Policy, please contact us at{' '}
                  <a href="mailto:contact@dabsco.com" className="text-artisan-primary font-semibold hover:underline">
                    contact@dabsco.com
                  </a>.
                </p>
              </section>
            </article>
          </motion.div>
        </div>
      </div>
    </>
  );
};

export default PrivacyPolicyPage;
