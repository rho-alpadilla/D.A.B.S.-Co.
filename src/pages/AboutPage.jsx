import React from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { Paintbrush, Heart, PenTool, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';

const AboutPage = () => {
  return (
    <>
      <Helmet>
        <title>About Us - D.A.B.S. Co.</title>
        <meta name="description" content="Learn about the story, creative process, and mission behind D.A.B.S. Co. artisan crafts." />
      </Helmet>

      <div className="container mx-auto px-4 py-16 max-w-7xl">
        
        {/* Hero Section */}
        <motion.section 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-20"
        >
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-[#118C8C] mb-6 tracking-tight">
            Who We Are
          </h1>
          <p className="text-lg md:text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed italic">
            "We support needlepoint designers in expanding their businesses through our outsourced canvas painting services. Whether you're a startup or an established brand, we are here to collaborate with you as your dedicated partner in growth."
          </p>
        </motion.section>

{/* Value Prop Section */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          className="max-w-4xl mx-auto mb-24"
        >
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 md:gap-8">
            <div className="flex flex-col items-center p-8 bg-[#f8fdfd] rounded-xl shadow-sm border border-[#e0f2f2] hover:shadow-md transition-shadow">
              <Paintbrush className="text-[#F2BB16] mb-4" size={32} strokeWidth={2.5} />
              <span className="text-base font-bold text-[#118C8C] text-center">Hand Painted</span>
            </div>
            <div className="flex flex-col items-center p-8 bg-[#f8fdfd] rounded-xl shadow-sm border border-[#e0f2f2] hover:shadow-md transition-shadow">
              <PenTool className="text-[#F2BB16] mb-4" size={32} strokeWidth={2.5} />
              <span className="text-base font-bold text-[#118C8C] text-center">Custom Designs</span>
            </div>
            <div className="flex flex-col items-center p-8 bg-[#f8fdfd] rounded-xl shadow-sm border border-[#e0f2f2] hover:shadow-md transition-shadow">
              <Heart className="text-[#F2BB16] mb-4" size={32} strokeWidth={2.5} />
              <span className="text-base font-bold text-[#118C8C] text-center">Made with Love</span>
            </div>
          </div>
        </motion.div>

        {/* Process Section */}
        <motion.section 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          className="bg-white rounded-3xl p-8 md:p-12 shadow-sm border border-gray-100 mb-20 relative overflow-hidden"
        >
          {/* Decorative background element */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-[#118C8C] opacity-[0.03] rounded-bl-full pointer-events-none" />

          <h2 className="text-3xl font-bold text-[#118C8C] text-center mb-12">Our Creative Process</h2>
          
          {/* Changed to a 4-column grid for larger screens to fit all 4 steps perfectly */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-6 relative">
            
            {/* Step 1 */}
            <div className="text-center relative z-10">
              <div className="w-16 h-16 bg-[#e0f2f2] rounded-full flex items-center justify-center mx-auto mb-6 text-[#118C8C] font-bold text-2xl shadow-sm border border-[#cbebeb]">1</div>
              <h3 className="text-lg font-bold text-gray-900 mb-3">Design Submission</h3>
              <p className="text-gray-600 text-sm leading-relaxed">All approved designers will submit needlepoint canvas designs through the Gallery tab. We can work off painted masters or PDF chart files.</p>
            </div>
            
            {/* Step 2 */}
            <div className="text-center relative z-10">
              <div className="w-16 h-16 bg-[#e0f2f2] rounded-full flex items-center justify-center mx-auto mb-6 text-[#118C8C] font-bold text-2xl shadow-sm border border-[#cbebeb]">2</div>
              <h3 className="text-lg font-bold text-gray-900 mb-3">Design Quoted</h3>
              <p className="text-gray-600 text-sm leading-relaxed">Receive your quote with price per piece within 1-3 business days via email. If satisfied, place your order through Contact.</p>
            </div>
            
            {/* Step 3 */}
            <div className="text-center relative z-10">
              <div className="w-16 h-16 bg-[#e0f2f2] rounded-full flex items-center justify-center mx-auto mb-6 text-[#118C8C] font-bold text-2xl shadow-sm border border-[#cbebeb]">3</div>
              <h3 className="text-lg font-bold text-gray-900 mb-3">Master Painted</h3>
              <p className="text-gray-600 text-sm leading-relaxed">A painted proof of your design will be sent via email for approval. This will be stored at the studio as a master for easy reordering.</p>
            </div> 
            
            {/* Step 4 */}
            <div className="text-center relative z-10">
              <div className="w-16 h-16 bg-[#e0f2f2] rounded-full flex items-center justify-center mx-auto mb-6 text-[#118C8C] font-bold text-2xl shadow-sm border border-[#cbebeb]">4</div>
              <h3 className="text-lg font-bold text-gray-900 mb-3">Order Painted</h3>
              <p className="text-gray-600 text-sm leading-relaxed">Upon master approval, production begins. Once completed, we receive the canvases in Dallas and invoice you.</p>
            </div>
          </div>
        </motion.section>

        {/* CTA */}
        <motion.div 
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="text-center bg-gray-50 rounded-2xl p-10 border border-gray-100"
        >
          <h2 className="text-2xl font-bold text-[#118C8C] mb-6">Ready to start your project?</h2>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Link to="/contact">
              <Button className="w-full sm:w-auto bg-[#118C8C] hover:bg-[#0d7070] text-white px-8 py-6 rounded-lg text-md font-semibold transition-colors">
                Contact Us
              </Button>
            </Link>
            <Link to="/gallery">
              <Button variant="outline" className="w-full sm:w-auto border-2 border-[#118C8C] text-[#118C8C] hover:bg-[#e0f2f2] px-8 py-6 rounded-lg text-md font-semibold transition-colors flex items-center gap-2 group">
                View Gallery 
                <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
          </div>
        </motion.div>

      </div>
    </>
  );
};

export default AboutPage;