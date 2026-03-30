import React from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { Paintbrush, Heart, PenTool, ArrowRight, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';

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
        <title>About Us - D.A.B.S. Co.</title>
        <meta
          name="description"
          content="Learn about the story, creative process, and mission behind D.A.B.S. Co. artisan crafts."
        />
      </Helmet>

      {/* RETAINED ORIGINAL BACKGROUND FEEL */}
      <div className="container mx-auto px-4 py-16 max-w-7xl">
        {/* Hero Section */}
        <motion.section
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45 }}
          className="text-center max-w-4xl mx-auto mb-16 md:mb-20"
        >
          <div className="inline-flex items-center gap-2 rounded-full border border-[#118C8C]/15 bg-[#118C8C]/5 px-4 py-1.5 text-sm font-medium text-[#118C8C] mb-5">
            <Sparkles size={15} />
            About D.A.B.S. Co.
          </div>

          <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-[#118C8C] mb-6 tracking-tight">
            Who We Are
          </h1>

          <p className="text-lg md:text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed italic">
            "We support needlepoint designers in expanding their businesses through our
            outsourced canvas painting services. Whether you're a startup or an
            established brand, we are here to collaborate with you as your dedicated
            partner in growth."
          </p>
        </motion.section>

        {/* Value Prop Section */}
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
                className="flex flex-col items-center p-8 bg-[#f8fdfd] rounded-2xl shadow-sm border border-[#e0f2f2] hover:shadow-md transition-all duration-300"
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

        {/* Process Section */}
        <motion.section
          initial={{ opacity: 0, y: 18 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 0.45 }}
          className="bg-white rounded-3xl p-8 md:p-12 shadow-sm border border-gray-100 mb-16 md:mb-20 relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-64 h-64 bg-[#118C8C] opacity-[0.03] rounded-bl-full pointer-events-none" />

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
                className="text-center relative z-10 bg-[#fcfefe] rounded-2xl border border-[#eef7f7] p-6 hover:shadow-md transition-all duration-300"
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
        </motion.section>

        {/* CTA */}
        <motion.section
          initial={{ opacity: 0, y: 18 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.45 }}
          className="text-center bg-gray-50 rounded-3xl p-8 md:p-10 border border-gray-100"
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
    </>
  );
};

export default AboutPage;