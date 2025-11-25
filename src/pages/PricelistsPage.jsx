import React from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';

const PricelistsPage = () => {
  const needlepointPricing = [
    { size: 'Small (up to 5x7")', mesh13: '$45-65', mesh18: '$55-75', complexity: 'Simple designs' },
    { size: 'Medium (8x10")', mesh13: '$75-95', mesh18: '$95-115', complexity: 'Moderate detail' },
    { size: 'Large (11x14")', mesh13: '$120-150', mesh18: '$150-180', complexity: 'Complex patterns' },
    { size: 'Extra Large (16x20")', mesh13: '$180-220', mesh18: '$220-260', complexity: 'Highly detailed' }
  ];

  const crochetPricing = [
    { item: 'Mini Keychains', price: '$8-12', details: 'Various designs available' },
    { item: 'Standard Keychains', price: '$15-20', details: 'More intricate patterns' },
    { item: 'Winter Scarves', price: '$35-55', details: 'Length and pattern varies' },
    { item: 'Summer Shawls', price: '$45-65', details: 'Lightweight and elegant' },
    { item: 'Baby Clothes', price: '$40-70', details: 'Sizes newborn to 12 months' },
    { item: 'Adult Cardigans', price: '$120-180', details: 'Custom sizing available' }
  ];

  const portraiturePricing = [
    { subjects: '1 Person', paper: '$150-200', canvas: '$200-280', framed: '+$50-80' },
    { subjects: '2 People', paper: '$250-320', canvas: '$320-420', framed: '+$70-100' },
    { subjects: '3 People', paper: '$350-450', canvas: '$450-580', framed: '+$90-120' },
    { subjects: '4+ People', paper: '$500+', canvas: '$650+', framed: '+$120+' }
  ];

  const canvasPricing = [
    { size: 'Small (11x14")', price: '$180-250', details: 'Simple compositions' },
    { size: 'Medium (16x20")', price: '$300-420', details: 'Standard detail level' },
    { size: 'Large (24x36")', price: '$550-750', details: 'Complex compositions' },
    { size: 'Custom Sizes', price: 'Quote', details: 'Contact for pricing' }
  ];

  return (
    <>
      <Helmet>
        <title>Pricelists - D.A.B.S. Co.</title>
        <meta name="description" content="View pricing for hand-painted canvases, crochet products, portraiture, and canvas paintings at D.A.B.S. Co. Transparent and competitive rates." />
      </Helmet>

      <div className="container mx-auto px-4 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <h1 className="text-4xl md:text-5xl font-bold text-[#118C8C] mb-4">Our Pricelists</h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Transparent pricing for all our handcrafted artisan services. All prices are estimates and may vary based on complexity and custom requirements.
          </p>
        </motion.div>

        {/* Hand-Painted Canvases */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="mb-16"
        >
          <h2 className="text-3xl font-bold text-[#118C8C] mb-6">Hand-Painted Needlepoint Canvases</h2>
          <div className="bg-white rounded-lg shadow-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-[#118C8C] text-white">
                  <tr>
                    <th className="px-6 py-4 text-left">Canvas Size</th>
                    <th className="px-6 py-4 text-left">13-Mesh</th>
                    <th className="px-6 py-4 text-left">18-Mesh</th>
                    <th className="px-6 py-4 text-left">Complexity</th>
                  </tr>
                </thead>
                <tbody>
                  {needlepointPricing.map((item, index) => (
                    <tr key={index} className={index % 2 === 0 ? 'bg-gray-50' : 'bg-white'}>
                      <td className="px-6 py-4 font-medium text-gray-900">{item.size}</td>
                      <td className="px-6 py-4 text-gray-700">{item.mesh13}</td>
                      <td className="px-6 py-4 text-gray-700">{item.mesh18}</td>
                      <td className="px-6 py-4 text-gray-600">{item.complexity}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </motion.section>

        {/* Crocheted Products */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="mb-16"
        >
          <h2 className="text-3xl font-bold text-[#118C8C] mb-6">Crocheted Products</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {crochetPricing.map((item, index) => (
              <motion.div
                key={index}
                whileHover={{ scale: 1.03 }}
                className="bg-white rounded-lg shadow-lg p-6"
              >
                <h3 className="text-xl font-semibold text-[#118C8C] mb-2">{item.item}</h3>
                <p className="text-2xl font-bold text-[#F2BB16] mb-2">{item.price}</p>
                <p className="text-gray-600">{item.details}</p>
              </motion.div>
            ))}
          </div>
        </motion.section>

        {/* Portraiture */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="mb-16"
        >
          <h2 className="text-3xl font-bold text-[#118C8C] mb-6">Portraiture Pricing</h2>
          <div className="bg-white rounded-lg shadow-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-[#118C8C] text-white">
                  <tr>
                    <th className="px-6 py-4 text-left">Number of Subjects</th>
                    <th className="px-6 py-4 text-left">Paper</th>
                    <th className="px-6 py-4 text-left">Canvas</th>
                    <th className="px-6 py-4 text-left">Framed Option</th>
                  </tr>
                </thead>
                <tbody>
                  {portraiturePricing.map((item, index) => (
                    <tr key={index} className={index % 2 === 0 ? 'bg-gray-50' : 'bg-white'}>
                      <td className="px-6 py-4 font-medium text-gray-900">{item.subjects}</td>
                      <td className="px-6 py-4 text-gray-700">{item.paper}</td>
                      <td className="px-6 py-4 text-gray-700">{item.canvas}</td>
                      <td className="px-6 py-4 text-gray-600">{item.framed}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          <p className="text-sm text-gray-600 mt-4">* Sizes available: 8x10", 11x14", 16x20", and custom sizes upon request</p>
        </motion.section>

        {/* Canvas Paintings */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="mb-16"
        >
          <h2 className="text-3xl font-bold text-[#118C8C] mb-6">Painting on Canvas</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {canvasPricing.map((item, index) => (
              <motion.div
                key={index}
                whileHover={{ scale: 1.03 }}
                className="bg-white rounded-lg shadow-lg p-6"
              >
                <h3 className="text-xl font-semibold text-[#118C8C] mb-2">{item.size}</h3>
                <p className="text-2xl font-bold text-[#F2BB16] mb-2">{item.price}</p>
                <p className="text-gray-600">{item.details}</p>
              </motion.div>
            ))}
          </div>
        </motion.section>

        {/* Additional Information */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="bg-[#118C8C] text-white rounded-lg p-8 text-center"
        >
          <h2 className="text-2xl font-bold mb-4">Custom Orders Welcome</h2>
          <p className="text-lg mb-4">
            All prices are starting estimates. Final pricing depends on design complexity, materials, and custom requirements.
          </p>
          <p className="text-lg">
            Contact us for a personalized quote on your custom commission!
          </p>
        </motion.div>
      </div>
    </>
  );
};

export default PricelistsPage;