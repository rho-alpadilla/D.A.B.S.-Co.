// src/pages/HomePage.jsx ← FINAL VERSION THAT WORKS 100% WITH YOUR APP
import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowRight, ChevronLeft, ChevronRight } from 'lucide-react';
import { collection, onSnapshot, query, orderBy, limit } from 'firebase/firestore';
import { db } from '@/lib/firebase';

const HomePage = () => {
  const [products, setProducts] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);

  // Get latest 6 products — same as your Gallery logic
  useEffect(() => {
    const q = query(
      collection(db, "pricelists"),
      orderBy("createdAt", "desc"),
      limit(6)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setProducts(data);
    });

    return () => unsubscribe();
  }, []);

  const nextSlide = () => {
    setCurrentIndex((prev) => (prev + 1) % products.length);
  };

  const prevSlide = () => {
    setCurrentIndex((prev) => (prev - 1 + products.length) % products.length);
  };

  // Auto-play
  useEffect(() => {
    if (products.length <= 1) return;
    const interval = setInterval(nextSlide, 6000);
    return () => clearInterval(interval);
  }, [products.length]);

  if (products.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-500 text-xl">
        No products yet. Add some in Admin Panel!
      </div>
    );
  }

  const product = products[currentIndex];

  return (
    <>
      <Helmet>
        <title>D.A.B.S. Co. - Handcrafted Artisan Creations</title>
      </Helmet>

      {/* HERO */}
      <section className="bg-gradient-to-br from-[#118C8C] to-[#0d7070] text-white py-24 md:py-32">
        <div className="container mx-auto px-6 text-center">
          <h1 className="text-5xl md:text-7xl font-bold mb-6">D.A.B.S. Co.</h1>
          <p className="text-xl md:text-2xl mb-10 text-gray-100 max-w-3xl mx-auto">
            Where artistry meets craftsmanship. Every piece tells a story.
          </p>
          <div className="flex flex-col sm:flex-row gap-6 justify-center">
            <Link to="/gallery">
              <Button size="lg" className="bg-[#F2BB16] hover:bg-[#d9a614] text-gray-900 font-bold">
                Explore Gallery <ArrowRight className="ml-2" />
              </Button>
            </Link>
            <Link to="/pricelists">
              <Button size="lg" variant="outline" className="border-white text-white hover:bg-white/20">
                View Pricing
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* FEATURED CAROUSEL — NOW 100% WORKING */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-6">
          <h2 className="text-4xl md:text-5xl font-bold text-center text-[#118C8C] mb-16">
            Latest Works
          </h2>

          <div className="relative max-w-6xl mx-auto">
            {/* Carousel Container */}
            <div className="relative h-96 md:h-[560px] rounded-3xl overflow-hidden shadow-2xl bg-white">
              <div
                className="flex h-full transition-transform duration-700 ease-in-out"
                style={{ transform: `translateX(-${currentIndex * 100}%)` }}
              >
                {products.map((p) => (
                  <div key={p.id} className="w-full flex-shrink-0 h-full flex flex-col md:flex-row">
                    {/* Image */}
                    <div className="w-full md:w-1/2 h-full">
                      {p.imageUrl ? (
                        <img
                          src={p.imageUrl}
                          alt={p.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                          <span className="text-gray-500 text-2xl font-medium">No Image</span>
                        </div>
                      )}
                    </div>

                    {/* Details */}
                    <div className="w-full md:w-1/2 flex flex-col justify-center p-10 md:p-16 bg-[#FAF8F1]">
                      <span className="text-sm font-bold text-[#F2BB16] uppercase tracking-wider mb-3">
                        {p.category}
                      </span>
                      <h3 className="text-3xl md:text-5xl font-bold text-[#118C8C] mb-6 leading-tight">
                        {p.name}
                      </h3>
                      <p className="text-lg text-gray-700 mb-10 line-clamp-3">
                        {p.description || "Handcrafted with passion and precision."}
                      </p>

                      <div className="flex items-center justify-between">
                        <span className="text-4xl md:text-5xl font-bold text-[#F2BB16]">
                          ${p.price}
                        </span>

                        {/* THIS GOES TO THE EXACT PRODUCT PAGE */}
                        <Link to={`/product/${p.id}`}>
                          <Button size="lg" className="bg-[#118C8C] hover:bg-[#0d7070] text-white px-10 py-6 text-lg font-semibold">
                            View Details <ArrowRight className="ml-3" />
                          </Button>
                        </Link>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Arrows — only show if more than 1 */}
            {products.length > 1 && (
              <>
                <button
                  onClick={prevSlide}
                  className="absolute left-6 top-1/2 -translate-y-1/2 bg-white/90 backdrop-blur p-4 rounded-full shadow-2xl hover:scale-110 transition z-10"
                >
                  <ChevronLeft size={40} className="text-[#118C8C]" />
                </button>
                <button
                  onClick={nextSlide}
                  className="absolute right-6 top-1/2 -translate-y-1/2 bg-white/90 backdrop-blur p-4 rounded-full shadow-2xl hover:scale-110 transition z-10"
                >
                  <ChevronRight size={40} className="text-[#118C8C]" />
                </button>
              </>
            )}

            {/* Dots */}
            {products.length > 1 && (
              <div className="flex justify-center gap-3 mt-12">
                {products.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setCurrentIndex(i)}
                    className={`h-3 rounded-full transition-all duration-300 ${
                      i === currentIndex ? "bg-[#118C8C] w-16" : "bg-gray-300 w-3 hover:bg-gray-500"
                    }`}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-[#118C8C] text-white py-20 text-center">
        <div className="container mx-auto px-6">
          <h2 className="text-4xl md:text-5xl font-bold mb-6">Ready to Own a Masterpiece?</h2>
          <p className="text-xl mb-10 max-w-2xl mx-auto text-gray-100">
            Commission your custom piece today.
          </p>
          <Link to="/pricelists">
            <Button size="lg" className="bg-[#F2BB16] hover:bg-[#d9a614] text-gray-900 font-bold text-xl px-16 py-8">
              Start Your Order <ArrowRight className="ml-4" />
            </Button>
          </Link>
        </div>
      </section>
    </>
  );
};

export default HomePage;