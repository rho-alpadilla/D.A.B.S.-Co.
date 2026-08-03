// src/pages/marketing/TermsPage.jsx
// Design A — Artisan Canvas reskin. All legal content unchanged.
import React from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { FileText } from 'lucide-react';

const TermsPage = () => {
  const sectionHeadingCls = 'mb-3 font-artisan-display text-2xl font-bold text-[#2A1739]';

  return (
    <>
      <Helmet>
        <title>Terms of Service - D.A.B.S. Co.</title>
        <meta
          name="description"
          content="Read D.A.B.S. Co.'s terms of service to understand the rules and guidelines for using our services."
        />
      </Helmet>

      <div className="artisan-grid-page relative min-h-screen overflow-hidden">

        <div className="relative z-10 container mx-auto px-5 py-14 md:px-8 md:py-20">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, ease: 'easeOut' }}
            className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[0.72fr_1.28fr] lg:items-start lg:gap-16"
          >
            <aside className="h-fit text-[#2D0E5A] lg:sticky lg:top-24">
              <div className="inline-flex items-center gap-2 rounded-full border border-artisan-primary/20 bg-white/75 px-4 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-artisan-primary backdrop-blur-sm">
                <FileText className="text-artisan-primary" size={14} />
                Legal Information
              </div>
              <div className="mt-6 flex items-center gap-3">
                <FileText className="text-artisan-primary" size={34} />
                <h1
                  className="font-artisan-display text-5xl font-bold leading-[0.95] text-artisan-primary md:text-6xl"
                >
                  Terms of Service
                </h1>
              </div>
              <p className="mt-6 border-y border-artisan-primary/20 py-5 text-sm text-artisan-text-mid">
                Last Updated: {new Date().toLocaleDateString()}
              </p>
            </aside>

            <article className="space-y-8 rounded-[2rem] border border-white/45 bg-[#FFFCFA]/95 p-6 shadow-2xl shadow-[#2D0E5A]/25 backdrop-blur-md sm:p-10">

              <section>
                <h2 className={sectionHeadingCls}>Acceptance of Terms</h2>
                <p className="leading-relaxed text-[#5B4C66]">
                  By accessing and using D.A.B.S. Co.'s website and services, you accept and agree
                  to be bound by the terms and provisions of this agreement.
                </p>
              </section>

              <section>
                <h2 className={sectionHeadingCls}>Services</h2>
                <p className="leading-relaxed text-[#5B4C66]">
                  D.A.B.S. Co. provides handcrafted artisan products and custom commission services
                  including needlepoint canvases, crochet items, portraiture, and canvas paintings.
                </p>
              </section>

              <section>
                <h2 className={sectionHeadingCls}>Orders and Commissions</h2>
                <ul className="ml-4 list-inside list-disc space-y-2 text-[#5B4C66]">
                  <li>All custom orders require a 50% deposit before work begins</li>
                  <li>Completion times vary based on project complexity and current workload</li>
                  <li>Final prices may vary from estimates based on actual complexity and materials used</li>
                  <li>We reserve the right to refuse any commission request</li>
                </ul>
              </section>

              <section>
                <h2 className={sectionHeadingCls}>Payment Terms</h2>
                <p className="mb-3 leading-relaxed text-[#5B4C66]">Payment terms are as follows:</p>
                <ul className="ml-4 list-inside list-disc space-y-2 text-[#5B4C66]">
                  <li>50% deposit required for custom commissions</li>
                  <li>Final payment due before shipping or pickup</li>
                  <li>We accept major credit cards and secure online payment methods</li>
                </ul>
              </section>

              <section>
                <h2 className={sectionHeadingCls}>Returns and Refunds</h2>
                <p className="leading-relaxed text-[#5B4C66]">
                  Due to the custom nature of our products, all sales are final. However, if there
                  is a defect in materials or workmanship, please contact us within 7 days of
                  receipt for resolution.
                </p>
              </section>

              <section>
                <h2 className={sectionHeadingCls}>Intellectual Property</h2>
                <p className="leading-relaxed text-[#5B4C66]">
                  All original designs, patterns, and artwork created by D.A.B.S. Co. remain our
                  intellectual property. Customers receive rights to the physical product only, not
                  reproduction rights.
                </p>
              </section>

              <section>
                <h2 className={sectionHeadingCls}>Contact Information</h2>
                <p className="leading-relaxed text-[#5B4C66]">
                  For questions about these Terms of Service, please contact us at{' '}
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

export default TermsPage;
