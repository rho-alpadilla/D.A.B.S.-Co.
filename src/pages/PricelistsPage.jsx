// src/pages/PricelistsPage.jsx
import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { useAuth } from '@/lib/firebase';
import { db } from '@/lib/firebase';
import { doc, onSnapshot, updateDoc, setDoc } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Plus, Save, Pencil, X } from 'lucide-react';
import { useCurrency } from '@/context/CurrencyContext';
import { useNavigate } from 'react-router-dom';

const PricelistsPage = () => {
  const { user } = useAuth();
  const isAdmin = user?.email?.includes('admin');
  const { formatPrice } = useCurrency();
  const navigate = useNavigate();

  const defaultPricing = {
    needlepoint: [
      { size: 'Small (up to 5x7")', mesh13: 2610, mesh18: 3190, complexity: 'Simple designs' },
      { size: 'Medium (8x10")', mesh13: 4350, mesh18: 5510, complexity: 'Moderate detail' },
      { size: 'Large (11x14")', mesh13: 6960, mesh18: 8700, complexity: 'Complex patterns' },
      { size: 'Extra Large (16x20")', mesh13: 10440, mesh18: 12760, complexity: 'Highly detailed' }
    ],
    crochet: [
      { item: 'Mini Keychains', price: 464, details: 'Various designs available' },
      { item: 'Standard Keychains', price: 870, details: 'More intricate patterns' },
      { item: 'Winter Scarves', price: 2030, details: 'Length and pattern varies' },
      { item: 'Summer Shawls', price: 2610, details: 'Lightweight and elegant' },
      { item: 'Baby Clothes', price: 2320, details: 'Sizes newborn to 12 months' },
      { item: 'Adult Cardigans', price: 6960, details: 'Custom sizing available' }
    ],
    portraiture: [
      { subjects: '1 Person', paper: 8700, canvas: 11600, framed: 2900 },
      { subjects: '2 People', paper: 14500, canvas: 18560, framed: 4060 },
      { subjects: '3 People', paper: 20300, canvas: 26100, framed: 5220 },
      { subjects: '4+ People', paper: 29000, canvas: 37700, framed: 6960 }
    ],
    canvas: [
      { size: 'Small (11x14")', price: 10440, details: 'Simple compositions' },
      { size: 'Medium (16x20")', price: 17400, details: 'Standard detail level' },
      { size: 'Large (24x36")', price: 31900, details: 'Complex compositions' },
      { size: 'Custom Sizes', price: 0, details: 'Contact for pricing' }
    ]
  };

  const [pricing, setPricing] = useState(defaultPricing);
  const [editing, setEditing] = useState({ section: null, index: null, field: null });
  const [tempValue, setTempValue] = useState('');

  useEffect(() => {
    const unsub = onSnapshot(doc(db, 'settings', 'pricelists'), (snap) => {
      if (snap.exists()) {
        setPricing(snap.data().data || defaultPricing);
      } else {
        setPricing(defaultPricing);
      }
    });

    return () => unsub();
  }, []);

  const startEdit = (section, index, field, value) => {
    setEditing({ section, index, field });
    setTempValue(String(value ?? ''));
  };

  const confirmEdit = () => {
    if (editing.section === null) return;

    const parsedValue = Number(tempValue);
    if (Number.isNaN(parsedValue)) {
      alert('Please enter a valid number.');
      return;
    }

    const newPricing = structuredClone(pricing);
    newPricing[editing.section][editing.index][editing.field] = parsedValue;

    setPricing(newPricing);
    setEditing({ section: null, index: null, field: null });
    setTempValue('');
  };

  const cancelEdit = () => {
    setEditing({ section: null, index: null, field: null });
    setTempValue('');
  };

  const savePricing = async () => {
    try {
      await setDoc(doc(db, 'settings', 'pricelists'), { data: pricing }, { merge: true });
      setEditing({ section: null, index: null, field: null });
      alert('Prices updated!');
    } catch (err) {
      alert('Save failed: ' + err.message);
    }
  };

  const isEditingField = (section, index, field) =>
    editing.section === section && editing.index === index && editing.field === field;

  const EditablePrice = ({ section, index, field, value, prefix = '' }) => {
    const active = isEditingField(section, index, field);

    if (isAdmin && active) {
      return (
        <div className="flex items-center gap-2 flex-wrap">
          <input
            type="number"
            min="0"
            step="1"
            value={tempValue}
            onChange={(e) => setTempValue(e.target.value)}
            className="w-32 px-2 py-1 border rounded text-sm"
            onKeyDown={(e) => {
              if (e.key === 'Enter') confirmEdit();
              if (e.key === 'Escape') cancelEdit();
            }}
            autoFocus
          />
          <Button size="sm" onClick={confirmEdit} className="px-2">
            <Save size={14} />
          </Button>
          <Button size="sm" variant="ghost" onClick={cancelEdit} className="px-2">
            <X size={14} />
          </Button>
        </div>
      );
    }

    return (
      <div className="flex items-center gap-2">
        <span className="font-medium">
          {prefix}{formatPrice(value)}
        </span>

        {isAdmin && (
          <button
            type="button"
            onClick={() => startEdit(section, index, field, value)}
            className="inline-flex items-center justify-center rounded-md border border-gray-300 p-1 text-gray-500 hover:bg-gray-100 hover:text-[#118C8C] transition"
            title="Edit price"
          >
            <Pencil size={14} />
          </button>
        )}
      </div>
    );
  };

  return (
    <>
      <Helmet>
        <title>Pricelists - D.A.B.S. Co.</title>
      </Helmet>

      <div className="container mx-auto px-4 py-12">
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-[#118C8C] mb-4">Our Pricelists</h1>
          <p className="text-lg text-gray-600">
            {isAdmin ? 'Use the pencil icon to edit prices.' : 'Browse our current pricing.'}
          </p>
        </div>

        {isAdmin && (
          <div className="text-center mb-12">
            <Button
              onClick={savePricing}
              className="bg-green-600 hover:bg-green-700 text-white text-lg px-8 py-4"
            >
              <Save className="mr-2" /> Save All Price Changes
            </Button>
          </div>
        )}

        {/* HAND-PAINTED NEEDLEPOINT CANVASES */}
        <motion.section className="mb-16">
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
                  {pricing.needlepoint.map((item, i) => (
                    <tr key={i} className={i % 2 === 0 ? 'bg-gray-50' : 'bg-white'}>
                      <td className="px-6 py-4 font-medium text-gray-900">{item.size}</td>
                      <td className="px-6 py-4 text-gray-700">
                        <EditablePrice
                          section="needlepoint"
                          index={i}
                          field="mesh13"
                          value={item.mesh13}
                        />
                      </td>
                      <td className="px-6 py-4 text-gray-700">
                        <EditablePrice
                          section="needlepoint"
                          index={i}
                          field="mesh18"
                          value={item.mesh18}
                        />
                      </td>
                      <td className="px-6 py-4 text-gray-600">{item.complexity}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </motion.section>

        {/* CROCHETED PRODUCTS */}
        <motion.section className="mb-16">
          <h2 className="text-3xl font-bold text-[#118C8C] mb-6">Crocheted Products</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {pricing.crochet.map((item, i) => (
              <motion.div key={i} whileHover={{ scale: 1.03 }} className="bg-white rounded-lg shadow-lg p-6">
                <h3 className="text-xl font-semibold text-[#118C8C] mb-2">{item.item}</h3>
                <div className="text-2xl font-bold text-[#F2BB16] mb-2">
                  <EditablePrice
                    section="crochet"
                    index={i}
                    field="price"
                    value={item.price}
                  />
                </div>
                <p className="text-gray-600">{item.details}</p>
              </motion.div>
            ))}
          </div>
        </motion.section>

        {/* PORTRAITURE */}
        <motion.section className="mb-16">
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
                  {pricing.portraiture.map((item, i) => (
                    <tr key={i} className={i % 2 === 0 ? 'bg-gray-50' : 'bg-white'}>
                      <td className="px-6 py-4 font-medium text-gray-900">{item.subjects}</td>
                      <td className="px-6 py-4 text-gray-700">
                        <EditablePrice
                          section="portraiture"
                          index={i}
                          field="paper"
                          value={item.paper}
                        />
                      </td>
                      <td className="px-6 py-4 text-gray-700">
                        <EditablePrice
                          section="portraiture"
                          index={i}
                          field="canvas"
                          value={item.canvas}
                        />
                      </td>
                      <td className="px-6 py-4 text-gray-700">
                        <EditablePrice
                          section="portraiture"
                          index={i}
                          field="framed"
                          value={item.framed}
                          prefix="+"
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </motion.section>

        {/* CANVAS PAINTINGS */}
        <motion.section className="mb-16">
          <h2 className="text-3xl font-bold text-[#118C8C] mb-6">Painting on Canvas</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {pricing.canvas.map((item, i) => (
              <motion.div key={i} whileHover={{ scale: 1.03 }} className="bg-white rounded-lg shadow-lg p-6">
                <h3 className="text-xl font-semibold text-[#118C8C] mb-2">{item.size}</h3>
                <div className="text-2xl font-bold text-[#F2BB16] mb-2">
                  <EditablePrice
                    section="canvas"
                    index={i}
                    field="price"
                    value={item.price}
                  />
                </div>
                <p className="text-gray-600">{item.details}</p>
              </motion.div>
            ))}
          </div>
        </motion.section>

        {/* ADD NEW PRODUCT BUTTON */}
        {isAdmin && (
          <div className="text-center my-20">
            <Button
              size="lg"
              onClick={() => navigate('/add-product')}
              className="bg-[#118C8C] hover:bg-[#0d7070] text-white font-bold text-xl px-12 py-6"
            >
              <Plus className="mr-3" size={28} />
              Add New Product
            </Button>
          </div>
        )}

        {/* CTA */}
        <motion.div className="bg-[#118C8C] text-white rounded-lg p-8 text-center">
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