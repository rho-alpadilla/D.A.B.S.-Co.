import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowRight, ChevronLeft, ChevronRight } from 'lucide-react';

const HomePage = () => {
  const categories = [
    {
      title: 'Hand-Painted Needlepoint Canvases',
      description: 'Custom-designed needlepoint canvases created with precision and artistic flair.',
      image: 'https://images.unsplash.com/photo-1611024847487-e26177381a30'
    },
    {
      title: 'Crochet Creations',
      description: 'Handmade crochet items ranging from cozy scarves to unique keychains.',
      image: 'https://images.unsplash.com/photo-1519095613053-5911833237ae'
    },
    {
      title: 'Portraiture',
      description: 'Stunning portrait artwork capturing the essence and personality of subjects.',
      image: 'https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5'
    }
  ];

  const [currentSlide, setCurrentSlide] = useState(0);

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % categories.length);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + categories.length) % categories.length);
  };

  useEffect(() => {
    const timer = setInterval(nextSlide, 5000);
    return () => clearInterval(timer);
  }, []);

  return (
    <>
      <Helmet>
        <title>D.A.B.S. Co. - Artisan Handcrafted Creations</title>
        <meta name="description" content="Discover unique hand-painted needlepoint canvases, crochet creations, and stunning portraiture at D.A.B.S. Co. Custom artisan crafts made with passion." />
      </Helmet>

      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-[#118C8C] to-[#0d7070] text-white py-24 md:py-32">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="max-w-3xl mx-auto text-center"
          >
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold mb-6">
              D.A.B.S. Co.
            </h1>
            <p className="text-xl md:text-2xl mb-8 text-gray-100">
              Where artistry meets craftsmanship. Discover handcrafted creations made with passion and precision.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/gallery">
                <Button size="lg" className="bg-[#F2BB16] hover:bg-[#d9a614] text-gray-900 font-semibold">
                  Explore Gallery
                  <ArrowRight className="ml-2" size={20} />
                </Button>
              </Link>
              <Link to="/pricelists">
                <Button size="lg" variant="outline" className="bg-white hover:bg-gray-100 text-[#118C8C] border-white font-semibold">
                  View Pricing
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Featured Works Carousel Section */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-12"
          >
            <h2 className="text-4xl md:text-5xl font-bold text-[#118C8C] mb-4">Featured Works</h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Explore our diverse collection of handcrafted artisan pieces, cycled below for your inspiration.
            </p>
          </motion.div>

          <div className="relative max-w-4xl mx-auto">
            <div className="relative overflow-hidden rounded-xl shadow-2xl bg-gray-50 aspect-video md:aspect-[16/9]">
              <AnimatePresence mode='wait'>
                <motion.div
                  key={currentSlide}
                  initial={{ opacity: 0, x: 50 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -50 }}
                  transition={{ duration: 0.5 }}
                  className="absolute inset-0 flex flex-col md:flex-row"
                >
                  <div className="w-full md:w-1/2 h-64 md:h-full relative">
                    <img
                      src={categories[currentSlide].image}
                      alt={categories[currentSlide].title}
                      className="absolute inset-0 w-full h-full object-cover"
                    />
                  </div>
                  <div className="w-full md:w-1/2 p-8 md:p-12 flex flex-col justify-center bg-[#FAF8F1]">
                    <h3 className="text-2xl md:text-3xl font-bold text-[#118C8C] mb-4">
                      {categories[currentSlide].title}
                    </h3>
                    <p className="text-lg text-gray-600 mb-8 leading-relaxed">
                      {categories[currentSlide].description}
                    </p>
                    <div>
                      <Link to="/gallery">
                        <Button className="bg-[#118C8C] hover:bg-[#0d7070] text-white">
                          View Collection
                        </Button>
                      </Link>
                    </div>
                  </div>
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Carousel Controls */}
            <button
              onClick={prevSlide}
              className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 md:-translate-x-12 bg-white p-3 rounded-full shadow-lg text-[#118C8C] hover:bg-gray-50 hover:scale-110 transition-all z-10"
              aria-label="Previous slide"
            >
              <ChevronLeft size={28} />
            </button>
            <button
              onClick={nextSlide}
              className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 md:translate-x-12 bg-white p-3 rounded-full shadow-lg text-[#118C8C] hover:bg-gray-50 hover:scale-110 transition-all z-10"
              aria-label="Next slide"
            >
              <ChevronRight size={28} />
            </button>

            {/* Indicators */}
            <div className="flex justify-center mt-8 gap-3">
              {categories.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentSlide(index)}
                  className={`w-3 h-3 rounded-full transition-all duration-300 ${
                    currentSlide === index ? 'bg-[#118C8C] w-8' : 'bg-gray-300 hover:bg-gray-400'
                  }`}
                  aria-label={`Go to slide ${index + 1}`}
                />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Call to Action Section */}
      <section className="bg-[#118C8C] text-white py-16">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="max-w-3xl mx-auto text-center"
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Ready to Commission Your Custom Piece?</h2>
            <p className="text-lg mb-8 text-gray-100">
              Let's bring your vision to life with our handcrafted artisan expertise.
            </p>
            <Link to="/pricelists">
              <Button size="lg" className="bg-[#F2BB16] hover:bg-[#d9a614] text-gray-900 font-semibold">
                Get Started
                <ArrowRight className="ml-2" size={20} />
              </Button>
            </Link>
          </motion.div>
        </div>
      </section>
    </>
  );
};

export default HomePage;