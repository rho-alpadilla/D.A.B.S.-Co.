import React from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { Paintbrush, Heart, Coffee, PenTool } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';

const AboutPage = () => {
  return (
    <>
      <Helmet>
        <title>About Us - D.A.B.S. Co.</title>
        <meta name="description" content="Learn about the story, creative process, and mission behind D.A.B.S. Co. artisan crafts." />
      </Helmet>

      <div className="container mx-auto px-4 py-12">
        {/* Hero Section */}
        <motion.section 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h1 className="text-4xl md:text-5xl font-bold text-[#118C8C] mb-6">Our Story</h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
            D.A.B.S. Co. began as a small passion project and has grown into a dedicated artisan studio. 
            We believe in the power of handmade goods to bring joy, warmth, and personality to your life.
          </p>
        </motion.section>

        {/* The Artist Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center mb-20">
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="rounded-xl overflow-hidden shadow-xl"
          >
            <img alt="Artist working on a needlepoint canvas" className="w-full h-full object-cover" src="https://images.unsplash.com/photo-1591279962961-674f49356352" />
          </motion.div>
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl font-bold text-[#118C8C] mb-4">Meet the Artist</h2>
            <p className="text-gray-700 mb-4 leading-relaxed">
              With over a decade of experience in textile arts and painting, our lead artist brings a unique blend of traditional technique and modern aesthetic to every piece.
            </p>
            <p className="text-gray-700 mb-6 leading-relaxed">
              "My mission is to create pieces that aren't just decorations, but heirlooms. Whether it's a custom needlepoint canvas waiting for your stitches or a finished crochet piece ready to be worn, everything I make comes from the heart."
            </p>
            <div className="flex gap-4">
              <div className="flex flex-col items-center p-4 bg-white rounded-lg shadow-sm border border-gray-100">
                <Paintbrush className="text-[#F2BB16] mb-2" size={24} />
                <span className="text-sm font-semibold">Hand Painted</span>
              </div>
              <div className="flex flex-col items-center p-4 bg-white rounded-lg shadow-sm border border-gray-100">
                <PenTool className="text-[#F2BB16] mb-2" size={24} />
                <span className="text-sm font-semibold">Custom Designs</span>
              </div>
              <div className="flex flex-col items-center p-4 bg-white rounded-lg shadow-sm border border-gray-100">
                <Heart className="text-[#F2BB16] mb-2" size={24} />
                <span className="text-sm font-semibold">Made with Love</span>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Process Section */}
        <motion.section 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="bg-white rounded-2xl p-8 md:p-12 shadow-sm border border-gray-100 mb-20"
        >
          <h2 className="text-3xl font-bold text-[#118C8C] text-center mb-12">Our Creative Process</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-[#e0f2f2] rounded-full flex items-center justify-center mx-auto mb-4 text-[#118C8C] font-bold text-2xl">1</div>
              <h3 className="text-xl font-semibold mb-2">Inspiration & Sketching</h3>
              <p className="text-gray-600">Every design starts with an idea, often drawn from nature, geometry, or client stories.</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-[#e0f2f2] rounded-full flex items-center justify-center mx-auto mb-4 text-[#118C8C] font-bold text-2xl">2</div>
              <h3 className="text-xl font-semibold mb-2">Crafting</h3>
              <p className="text-gray-600">Whether painting canvas mesh or crocheting yarn, we use high-quality materials and steady hands.</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-[#e0f2f2] rounded-full flex items-center justify-center mx-auto mb-4 text-[#118C8C] font-bold text-2xl">3</div>
              <h3 className="text-xl font-semibold mb-2">Finishing Touches</h3>
              <p className="text-gray-600">Quality checks, packaging, and a personal note accompany every order before it ships to you.</p>
            </div>
          </div>
        </motion.section>

        {/* CTA */}
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Ready to start your project?</h2>
          <div className="flex justify-center gap-4">
            <Link to="/contact">
              <Button className="bg-[#118C8C] hover:bg-[#0d7070] text-white">Contact Us</Button>
            </Link>
            <Link to="/gallery">
              <Button variant="outline" className="border-[#118C8C] text-[#118C8C] hover:bg-[#e0f2f2]">View Gallery</Button>
            </Link>
          </div>
        </div>
      </div>
    </>
  );
};

export default AboutPage;