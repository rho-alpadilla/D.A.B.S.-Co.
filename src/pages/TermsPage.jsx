import React from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';

const TermsPage = () => {
  return (
    <>
      <Helmet>
        <title>Terms of Service - D.A.B.S. Co.</title>
        <meta name="description" content="Read D.A.B.S. Co.'s terms of service to understand the rules and guidelines for using our services." />
      </Helmet>

      <div className="container mx-auto px-4 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="max-w-4xl mx-auto"
        >
          <h1 className="text-4xl md:text-5xl font-bold text-[#118C8C] mb-8">Terms of Service</h1>

          <div className="bg-white rounded-lg shadow-lg p-8 space-y-6">
            <p className="text-gray-600 text-sm">Last Updated: {new Date().toLocaleDateString()}</p>

            <section>
              <h2 className="text-2xl font-semibold text-[#118C8C] mb-3">Acceptance of Terms</h2>
              <p className="text-gray-700 leading-relaxed">
                By accessing and using D.A.B.S. Co.'s website and services, you accept and agree to be bound by the terms and provisions of this agreement.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-[#118C8C] mb-3">Services</h2>
              <p className="text-gray-700 leading-relaxed">
                D.A.B.S. Co. provides handcrafted artisan products and custom commission services including needlepoint canvases, crochet items, portraiture, and canvas paintings.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-[#118C8C] mb-3">Orders and Commissions</h2>
              <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4">
                <li>All custom orders require a 50% deposit before work begins</li>
                <li>Completion times vary based on project complexity and current workload</li>
                <li>Final prices may vary from estimates based on actual complexity and materials used</li>
                <li>We reserve the right to refuse any commission request</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-[#118C8C] mb-3">Payment Terms</h2>
              <p className="text-gray-700 leading-relaxed mb-3">
                Payment terms are as follows:
              </p>
              <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4">
                <li>50% deposit required for custom commissions</li>
                <li>Final payment due before shipping or pickup</li>
                <li>We accept major credit cards and secure online payment methods</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-[#118C8C] mb-3">Returns and Refunds</h2>
              <p className="text-gray-700 leading-relaxed">
                Due to the custom nature of our products, all sales are final. However, if there is a defect in materials or workmanship, please contact us within 7 days of receipt for resolution.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-[#118C8C] mb-3">Intellectual Property</h2>
              <p className="text-gray-700 leading-relaxed">
                All original designs, patterns, and artwork created by D.A.B.S. Co. remain our intellectual property. Customers receive rights to the physical product only, not reproduction rights.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-[#118C8C] mb-3">Contact Information</h2>
              <p className="text-gray-700 leading-relaxed">
                For questions about these Terms of Service, please contact us at contact@dabsco.com.
              </p>
            </section>
          </div>
        </motion.div>
      </div>
    </>
  );
};

export default TermsPage;