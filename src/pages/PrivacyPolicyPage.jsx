import React from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';

const PrivacyPolicyPage = () => {
  return (
    <>
      <Helmet>
        <title>Privacy Policy - D.A.B.S. Co.</title>
        <meta name="description" content="Read D.A.B.S. Co.'s privacy policy to understand how we collect, use, and protect your personal information." />
      </Helmet>

      <div className="container mx-auto px-4 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="max-w-4xl mx-auto"
        >
          <h1 className="text-4xl md:text-5xl font-bold text-[#118C8C] mb-8">Privacy Policy</h1>

          <div className="bg-white rounded-lg shadow-lg p-8 space-y-6">
            <p className="text-gray-600 text-sm">Last Updated: {new Date().toLocaleDateString()}</p>

            <section>
              <h2 className="text-2xl font-semibold text-[#118C8C] mb-3">Introduction</h2>
              <p className="text-gray-700 leading-relaxed">
                At D.A.B.S. Co., we are committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you visit our website or use our services.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-[#118C8C] mb-3">Information We Collect</h2>
              <p className="text-gray-700 leading-relaxed mb-3">We may collect the following types of information:</p>
              <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4">
                <li>Personal identification information (name, email address, phone number)</li>
                <li>Order and commission details</li>
                <li>Payment information (processed securely through third-party providers)</li>
                <li>Communication preferences</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-[#118C8C] mb-3">How We Use Your Information</h2>
              <p className="text-gray-700 leading-relaxed mb-3">We use the information we collect to:</p>
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
                We implement appropriate technical and organizational security measures to protect your personal information against unauthorized access, alteration, disclosure, or destruction.
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
                If you have any questions about this Privacy Policy, please contact us at contact@dabsco.com.
              </p>
            </section>
          </div>
        </motion.div>
      </div>
    </>
  );
};

export default PrivacyPolicyPage;