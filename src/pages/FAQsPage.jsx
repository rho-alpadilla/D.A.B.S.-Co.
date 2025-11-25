import React from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';

const FAQsPage = () => {
  const faqs = [
    {
      question: 'How long does it take to complete a custom order?',
      answer: 'Custom order timelines vary depending on the complexity of the piece and our current workload. Hand-painted needlepoint canvases typically take 2-4 weeks, crochet items range from 1-6 weeks, and portraiture can take 3-6 weeks. We will provide a specific timeline when you place your order.'
    },
    {
      question: 'Do you ship internationally?',
      answer: 'Currently, we ship within the United States. For international shipping inquiries, please contact us directly at contact@dabsco.com to discuss options and pricing.'
    },
    {
      question: 'Can I request a specific design or pattern?',
      answer: 'Absolutely! We love working on custom designs. Share your vision with us, and we will work with you to create a unique piece that meets your specifications. Custom design consultations are available at no additional charge.'
    },
    {
      question: 'What is your refund policy?',
      answer: 'Due to the custom, handmade nature of our products, all sales are final. However, if there is a defect in materials or workmanship, please contact us within 7 days of receipt, and we will work to resolve the issue.'
    },
    {
      question: 'What payment methods do you accept?',
      answer: 'We accept all major credit cards, debit cards, and secure online payment methods. For custom commissions, a 50% deposit is required before we begin work, with the balance due before shipping or pickup.'
    },
    {
      question: 'How do I care for my hand-painted needlepoint canvas?',
      answer: 'Store your canvas flat or rolled (painted side out) in a cool, dry place. Avoid folding or creasing. If the canvas needs cleaning, gently spot clean with a damp cloth. Never machine wash or use harsh chemicals.'
    },
    {
      question: 'Can I commission a portrait from a photograph?',
      answer: 'Yes! We create beautiful portraits from high-quality photographs. For best results, please provide clear, well-lit photos with good resolution. We can work with multiple reference photos if needed.'
    },
    {
      question: 'Do you offer rush orders?',
      answer: 'Rush orders may be available depending on our current schedule. Please contact us to discuss your timeline, and we will do our best to accommodate your needs. Rush fees may apply.'
    },
    {
      question: 'What is the difference between 13-mesh and 18-mesh needlepoint canvas?',
      answer: '13-mesh has 13 threads per inch, making it easier to stitch and better for beginners or simpler designs. 18-mesh has 18 threads per inch, allowing for more detailed and intricate designs but requiring more stitching time.'
    },
    {
      question: 'Can I visit your studio?',
      answer: 'We currently operate by appointment only. If you would like to visit our studio to discuss a custom project or view our work in person, please contact us to schedule an appointment.'
    }
  ];

  return (
    <>
      <Helmet>
        <title>FAQs - D.A.B.S. Co.</title>
        <meta name="description" content="Find answers to frequently asked questions about D.A.B.S. Co.'s handcrafted products, custom orders, shipping, and more." />
      </Helmet>

      <div className="container mx-auto px-4 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="max-w-4xl mx-auto"
        >
          <h1 className="text-4xl md:text-5xl font-bold text-[#118C8C] mb-4 text-center">Frequently Asked Questions</h1>
          <p className="text-lg text-gray-600 mb-12 text-center">
            Find answers to common questions about our products and services
          </p>

          <div className="space-y-6">
            {faqs.map((faq, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: index * 0.05 }}
                className="bg-white rounded-lg shadow-lg p-6"
              >
                <h2 className="text-xl font-semibold text-[#118C8C] mb-3">{faq.question}</h2>
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
              We're here to help! Feel free to reach out to us directly.
            </p>
            <p className="text-lg">
              Email us at <a href="mailto:contact@dabsco.com" className="underline font-semibold">contact@dabsco.com</a>
            </p>
          </motion.div>
        </motion.div>
      </div>
    </>
  );
};

export default FAQsPage;