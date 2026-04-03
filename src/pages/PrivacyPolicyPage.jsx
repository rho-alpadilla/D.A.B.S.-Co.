import React from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { Sparkles, ShieldCheck } from 'lucide-react';
import Grainient from '@/components/ui-bits/Grainient';
import Particles from '@/components/ui-bits/Particles';

const PrivacyPolicyPage = () => {
  return (
    <>
      <Helmet>
        <title>Privacy Policy - D.A.B.S. Co.</title>
        <meta
          name="description"
          content="Read D.A.B.S. Co.'s privacy policy to understand how we collect, use, and protect your personal information."
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

        <div className="relative z-10 container mx-auto px-4 py-12 md:py-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45 }}
            className="max-w-4xl mx-auto"
          >
            <div className="mb-8 rounded-3xl bg-white/90 backdrop-blur-md border border-white/30 shadow-lg p-6 md:p-8">
              <div className="inline-flex items-center gap-2 rounded-full border border-[#118C8C]/15 bg-[#118C8C]/8 px-4 py-2 text-xs font-semibold uppercase tracking-wider text-[#118C8C] mb-4">
                <Sparkles size={14} />
                Legal Information
              </div>

              <div className="flex items-center gap-3 mb-3">
                <ShieldCheck className="text-[#118C8C]" size={34} />
                <h1 className="text-4xl md:text-5xl font-bold text-[#118C8C]">
                  Privacy Policy
                </h1>
              </div>

              <p className="text-gray-600 text-sm">
                Last Updated: {new Date().toLocaleDateString()}
              </p>
            </div>

            <div className="bg-white/90 backdrop-blur-md rounded-3xl shadow-lg border border-white/30 p-8 md:p-10 space-y-8">
              <section>
                <h2 className="text-2xl font-semibold text-[#118C8C] mb-3">Introduction</h2>
                <p className="text-gray-700 leading-relaxed">
                  At D.A.B.S. Co., we are committed to protecting your privacy. This Privacy Policy
                  explains how we collect, use, disclose, and safeguard your information when you
                  visit our website or use our services.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-[#118C8C] mb-3">Information We Collect</h2>
                <p className="text-gray-700 leading-relaxed mb-3">
                  We may collect the following types of information:
                </p>
                <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4">
                  <li>Personal identification information (name, email address, phone number)</li>
                  <li>Order and commission details</li>
                  <li>Payment information (processed securely through third-party providers)</li>
                  <li>Communication preferences</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-[#118C8C] mb-3">
                  How We Use Your Information
                </h2>
                <p className="text-gray-700 leading-relaxed mb-3">
                  We use the information we collect to:
                </p>
                <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4">
                  <li>Process and fulfill your orders and commissions</li>
                  <li>Communicate with you about your orders and our services</li>
                  <li>Improve our website and customer service</li>
                  <li>Send promotional materials (with your consent)</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-[#118C8C] mb-3">Data Security</h2>
                <p className="text-gray-700 leading-relaxed">
                  We implement appropriate technical and organizational security measures to protect
                  your personal information against unauthorized access, alteration, disclosure, or
                  destruction.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-[#118C8C] mb-3">Your Rights</h2>
                <p className="text-gray-700 leading-relaxed mb-3">You have the right to:</p>
                <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4">
                  <li>Access your personal information</li>
                  <li>Request correction of inaccurate data</li>
                  <li>Request deletion of your data</li>
                  <li>Opt-out of marketing communications</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-[#118C8C] mb-3">Contact Us</h2>
                <p className="text-gray-700 leading-relaxed">
                  If you have any questions about this Privacy Policy, please contact us at
                  contact@dabsco.com.
                </p>
              </section>
            </div>
          </motion.div>
        </div>
      </div>
    </>
  );
};

export default PrivacyPolicyPage;