import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { useAuth } from '@/lib/firebase';
import { db } from '@/lib/firebase';
import { doc, onSnapshot, setDoc } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import {
  Plus,
  Save,
  Pencil,
  X,
  ArrowRight,
  Sparkles,
  MessageCircle,
  Palette,
  Scissors,
  Frame,
  Brush,
  Info,
  ChevronRight,
} from 'lucide-react';
import { useCurrency } from '@/context/CurrencyContext';
import { useNavigate } from 'react-router-dom';
import Grainient from '@/components/ui-bits/Grainient';
import Particles from '@/components/ui-bits/Particles';

const PricelistsPage = () => {
  const { user } = useAuth();
  const isAdmin = user?.email?.includes('admin');
  const { formatPrice } = useCurrency();
  const navigate = useNavigate();

  const sectionRefs = useRef({});
  const [activeSection, setActiveSection] = useState('');

  const registerRef = (id) => (el) => {
    if (el) sectionRefs.current[id] = el;
  };

  const scrollToSection = useCallback((sectionId) => {
    const el = sectionRefs.current[sectionId];
    if (!el) return;

    const NAV_OFFSET = 156;
    const top = el.getBoundingClientRect().top + window.scrollY - NAV_OFFSET;

    window.scrollTo({ top, behavior: 'smooth' });
    setActiveSection(sectionId);
  }, []);

  useEffect(() => {
    const NAV_OFFSET = 170;

    const handleScroll = () => {
      const ids = ['needlepoint', 'crochet', 'portraiture', 'canvas', 'custom-orders'];
      let current = '';

      for (const id of ids) {
        const el = sectionRefs.current[id];
        if (!el) continue;
        const top = el.getBoundingClientRect().top;
        if (top <= NAV_OFFSET + 10) {
          current = id;
        }
      }

      setActiveSection(current);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const defaultPricing = {
    needlepoint: [
      { size: 'Small (up to 5x7")', mesh13: 2610, mesh18: 3190, complexity: 'Simple designs' },
      { size: 'Medium (8x10")', mesh13: 4350, mesh18: 5510, complexity: 'Moderate detail' },
      { size: 'Large (11x14")', mesh13: 6960, mesh18: 8700, complexity: 'Complex patterns' },
      { size: 'Extra Large (16x20")', mesh13: 10440, mesh18: 12760, complexity: 'Highly detailed' },
    ],
    crochet: [
      { item: 'Mini Keychains', price: 464, details: 'Various designs available' },
      { item: 'Standard Keychains', price: 870, details: 'More intricate patterns' },
      { item: 'Winter Scarves', price: 2030, details: 'Length and pattern varies' },
      { item: 'Summer Shawls', price: 2610, details: 'Lightweight and elegant' },
      { item: 'Baby Clothes', price: 2320, details: 'Sizes newborn to 12 months' },
      { item: 'Adult Cardigans', price: 6960, details: 'Custom sizing available' },
    ],
    portraiture: [
      { subjects: '1 Person', paper: 8700, canvas: 11600, framed: 2900 },
      { subjects: '2 People', paper: 14500, canvas: 18560, framed: 4060 },
      { subjects: '3 People', paper: 20300, canvas: 26100, framed: 5220 },
      { subjects: '4+ People', paper: 29000, canvas: 37700, framed: 6960 },
    ],
    canvas: [
      { size: 'Small (11x14")', price: 10440, details: 'Simple compositions' },
      { size: 'Medium (16x20")', price: 17400, details: 'Standard detail level' },
      { size: 'Large (24x36")', price: 31900, details: 'Complex compositions' },
      { size: 'Custom Sizes', price: 0, details: 'Contact for pricing' },
    ],
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

  const EditablePrice = ({ section, index, field, value, prefix = '', isCustom = false }) => {
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
            className="w-32 px-3 py-2 border rounded-lg text-sm"
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

    if (isCustom || value === 0) {
      return (
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center rounded-full bg-[#F2BB16]/15 text-[#8e6c00] px-3 py-1 text-sm font-semibold">
            Custom Quote
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
    }

    return (
      <div className="flex items-center gap-2">
        <span className="font-semibold">
          {prefix}
          {formatPrice(value)}
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

  const SectionHeader = ({ icon: Icon, title, subtitle }) => (
    <div className="flex items-start gap-4 mb-6">
      <div className="w-12 h-12 rounded-2xl bg-[#118C8C]/10 text-[#118C8C] flex items-center justify-center shrink-0">
        <Icon size={22} />
      </div>
      <div>
        <h2 className="text-3xl font-bold text-[#FAF8F1]">{title}</h2>
        <p className="text-white/85 mt-1">{subtitle}</p>
      </div>
    </div>
  );

  const quickNavItems = [
    { label: 'Needlepoint', id: 'needlepoint' },
    { label: 'Crochet', id: 'crochet' },
    { label: 'Portraiture', id: 'portraiture' },
    { label: 'Canvas', id: 'canvas' },
    { label: 'Custom Orders', id: 'custom-orders' },
  ];

  const fadeUp = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { duration: 0.4 } },
  };

  return (
    <>
      <Helmet>
        <title>Pricelists - D.A.B.S. Co.</title>
      </Helmet>

      <div className="relative min-h-screen bg-[#daf0ee] overflow-hidden">
        <div className="absolute inset-0 z-0 pointer-events-none" style={{ isolation: 'isolate' }}>
          <Grainient
            color1="#118c8c"
            color2="#118c8c"
            color3="#fbfe9f"
            timeSpeed={0.25}
            colorBalance={-0.06}
            warpStrength={1.5}
            warpFrequency={3.8}
            warpSpeed={2}
            warpAmplitude={50}
            blendAngle={0}
            blendSoftness={1}
            rotationAmount={500}
            noiseScale={2}
            grainAmount={0.1}
            grainScale={2}
            grainAnimated={false}
            contrast={1.5}
            gamma={1}
            saturation={1}
            centerX={0}
            centerY={0}
            zoom={0.9}
          />

          <div className="absolute inset-0 pointer-events-none">
            <Particles
              particleCount={400}
              particleSpread={10}
              speed={0.1}
              particleColors={['#faf8f1', '#118c8c', '#f1bb19']}
              moveParticlesOnHover
              particleHoverFactor={1}
              alphaParticles={false}
              particleBaseSize={150}
              sizeRandomness={1.7}
              cameraDistance={53}
              disableRotation={false}
            />
          </div>
        </div>

        <div className="relative z-10">
          <div className="fixed top-20 left-0 right-0 z-40 px-4">
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25 }}
              className="mx-auto max-w-5xl"
            >
              <div className="bg-white/90 backdrop-blur-md border border-white/30 shadow-lg rounded-2xl px-3 py-2">
                <div className="flex gap-2 overflow-x-auto whitespace-nowrap no-scrollbar justify-start md:justify-center">
                  {quickNavItems.map((item) => {
                    const isActive = activeSection === item.id;
                    return (
                      <motion.button
                        key={item.id}
                        type="button"
                        whileHover={{ y: -1 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => scrollToSection(item.id)}
                        className={`shrink-0 px-4 py-2 rounded-full transition text-sm font-medium ${
                          isActive
                            ? 'bg-[#118C8C] text-white shadow'
                            : 'bg-white/85 text-gray-700 hover:bg-[#118C8C]/10 hover:text-[#118C8C]'
                        }`}
                      >
                        {item.label}
                      </motion.button>
                    );
                  })}
                </div>
              </div>
            </motion.div>
          </div>

          <div className="container mx-auto px-4 pt-40 pb-5 md:pt-44 md:pb-10">
            <motion.section
              variants={fadeUp}
              initial="hidden"
              animate="visible"
              className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#118C8C] via-[#0f7a7a] to-[#0b5f5f] text-white px-6 py-8 md:px-8 md:py-10 shadow-2xl mb-8"
            >
              <div className="absolute inset-0 opacity-15">
                <div className="absolute -top-10 right-0 w-48 h-48 bg-white rounded-full blur-3xl" />
                <div className="absolute -bottom-16 -left-6 w-64 h-64 bg-[#F2BB16] rounded-full blur-3xl" />
              </div>
              <div className="relative z-10 max-w-3xl">
                <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-xs font-semibold mb-4">
                  <Sparkles size={16} />
                  Handmade Pricing Guide
                </div>
                <h1 className="text-3xl md:text-5xl font-bold leading-tight mb-3">Our Pricelists</h1>
                <p className="text-sm md:text-base text-white/90 max-w-2xl leading-relaxed">
                  Explore current pricing for custom needlepoint, crochet, portraiture, and canvas work.
                </p>
              </div>
            </motion.section>

            <motion.section
              variants={fadeUp}
              initial="hidden"
              animate="visible"
              className="mb-12 rounded-3xl border border-white/30 bg-white/90 backdrop-blur-md shadow-lg p-6 md:p-8"
            >
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-2xl bg-[#118C8C]/10 text-[#118C8C] flex items-center justify-center shrink-0">
                  <Info size={22} />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">How pricing works</h2>
                  <div className="grid md:grid-cols-3 gap-4 text-sm text-gray-600">
                    <div className="rounded-2xl bg-gray-50 p-4">
                      <p className="font-semibold text-gray-800 mb-1">Starting estimates</p>
                      <p>Prices listed here are starting points for standard requests and common sizes.</p>
                    </div>
                    <div className="rounded-2xl bg-gray-50 p-4">
                      <p className="font-semibold text-gray-800 mb-1">Custom adjustments</p>
                      <p>Final cost may change depending on detail level, materials, framing, and requested revisions.</p>
                    </div>
                    <div className="rounded-2xl bg-gray-50 p-4">
                      <p className="font-semibold text-gray-800 mb-1">Need something unique?</p>
                      <p>Use the Contact page for a personalized quote and tell us exactly what you have in mind.</p>
                    </div>
                  </div>
                </div>
              </div>
            </motion.section>

            {isAdmin && (
              <div className="text-center mb-12">
                <Button
                  onClick={savePricing}
                  className="bg-green-600 hover:bg-green-700 text-white text-lg px-8 py-4 rounded-2xl"
                >
                  <Save className="mr-2" /> Save All Price Changes
                </Button>
              </div>
            )}

            <motion.section
              ref={registerRef('needlepoint')}
              id="needlepoint"
              variants={fadeUp}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: '-80px' }}
              className="mb-16 scroll-mt-40"
            >
              <SectionHeader
                icon={Palette}
                title="Hand-Painted Needlepoint Canvases"
                subtitle="Choose by size, mesh count, and design detail."
              />

              <div className="hidden md:block bg-white/90 backdrop-blur-md rounded-2xl shadow-lg overflow-hidden border border-white/30">
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
                        <tr key={i} className={i % 2 === 0 ? 'bg-gray-50/90' : 'bg-white/90'}>
                          <td className="px-6 py-4 font-medium text-gray-900">{item.size}</td>
                          <td className="px-6 py-4 text-gray-700">
                            <EditablePrice section="needlepoint" index={i} field="mesh13" value={item.mesh13} />
                          </td>
                          <td className="px-6 py-4 text-gray-700">
                            <EditablePrice section="needlepoint" index={i} field="mesh18" value={item.mesh18} />
                          </td>
                          <td className="px-6 py-4 text-gray-600">{item.complexity}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="grid md:hidden gap-4">
                {pricing.needlepoint.map((item, i) => (
                  <div key={i} className="bg-white/90 backdrop-blur-md rounded-2xl shadow-lg border border-white/30 p-5">
                    <h3 className="text-lg font-semibold text-[#118C8C] mb-3">{item.size}</h3>
                    <div className="space-y-3 text-sm">
                      <div className="flex items-center justify-between gap-3">
                        <span className="text-gray-600">13-Mesh</span>
                        <EditablePrice section="needlepoint" index={i} field="mesh13" value={item.mesh13} />
                      </div>
                      <div className="flex items-center justify-between gap-3">
                        <span className="text-gray-600">18-Mesh</span>
                        <EditablePrice section="needlepoint" index={i} field="mesh18" value={item.mesh18} />
                      </div>
                      <div className="pt-2 border-t text-gray-600">
                        <span className="font-medium text-gray-800">Complexity:</span> {item.complexity}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </motion.section>

            <motion.section
              ref={registerRef('crochet')}
              id="crochet"
              variants={fadeUp}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: '-80px' }}
              className="mb-16 scroll-mt-40"
            >
              <SectionHeader
                icon={Scissors}
                title="Crocheted Products"
                subtitle="Handmade crochet pieces for gifts, wearables, and custom requests."
              />

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {pricing.crochet.map((item, i) => (
                  <motion.div
                    key={i}
                    whileHover={{ y: -5, scale: 1.01 }}
                    className="bg-white/90 backdrop-blur-md rounded-2xl shadow-lg border border-white/30 p-6"
                  >
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <h3 className="text-xl font-semibold text-[#118C8C]">{item.item}</h3>
                      <div className="text-[#F2BB16] shrink-0">
                        <Sparkles size={18} />
                      </div>
                    </div>
                    <div className="text-2xl font-bold text-[#F2BB16] mb-3">
                      <EditablePrice section="crochet" index={i} field="price" value={item.price} />
                    </div>
                    <p className="text-gray-600 leading-relaxed">{item.details}</p>
                  </motion.div>
                ))}
              </div>
            </motion.section>

            <motion.section
              ref={registerRef('portraiture')}
              id="portraiture"
              variants={fadeUp}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: '-80px' }}
              className="mb-16 scroll-mt-40"
            >
              <SectionHeader
                icon={Frame}
                title="Portraiture Pricing"
                subtitle="Portrait options for paper, canvas, and framed commissions."
              />

              <div className="hidden md:block bg-white/90 backdrop-blur-md rounded-2xl shadow-lg overflow-hidden border border-white/30">
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
                        <tr key={i} className={i % 2 === 0 ? 'bg-gray-50/90' : 'bg-white/90'}>
                          <td className="px-6 py-4 font-medium text-gray-900">{item.subjects}</td>
                          <td className="px-6 py-4 text-gray-700">
                            <EditablePrice section="portraiture" index={i} field="paper" value={item.paper} />
                          </td>
                          <td className="px-6 py-4 text-gray-700">
                            <EditablePrice section="portraiture" index={i} field="canvas" value={item.canvas} />
                          </td>
                          <td className="px-6 py-4 text-gray-700">
                            <EditablePrice section="portraiture" index={i} field="framed" value={item.framed} prefix="+" />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="grid md:hidden gap-4">
                {pricing.portraiture.map((item, i) => (
                  <div key={i} className="bg-white/90 backdrop-blur-md rounded-2xl shadow-lg border border-white/30 p-5">
                    <h3 className="text-lg font-semibold text-[#118C8C] mb-3">{item.subjects}</h3>
                    <div className="space-y-3 text-sm">
                      <div className="flex items-center justify-between gap-3">
                        <span className="text-gray-600">Paper</span>
                        <EditablePrice section="portraiture" index={i} field="paper" value={item.paper} />
                      </div>
                      <div className="flex items-center justify-between gap-3">
                        <span className="text-gray-600">Canvas</span>
                        <EditablePrice section="portraiture" index={i} field="canvas" value={item.canvas} />
                      </div>
                      <div className="flex items-center justify-between gap-3">
                        <span className="text-gray-600">Framed Option</span>
                        <EditablePrice section="portraiture" index={i} field="framed" value={item.framed} prefix="+" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </motion.section>

            <motion.section
              ref={registerRef('canvas')}
              id="canvas"
              variants={fadeUp}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: '-80px' }}
              className="mb-16 scroll-mt-40"
            >
              <SectionHeader
                icon={Brush}
                title="Painting on Canvas"
                subtitle="Canvas-based work for decorative, custom, and expressive pieces."
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {pricing.canvas.map((item, i) => (
                  <motion.div
                    key={i}
                    whileHover={{ y: -5, scale: 1.01 }}
                    className="bg-white/90 backdrop-blur-md rounded-2xl shadow-lg border border-white/30 p-6"
                  >
                    <h3 className="text-xl font-semibold text-[#118C8C] mb-2">{item.size}</h3>
                    <div className="text-2xl font-bold text-[#F2BB16] mb-3">
                      <EditablePrice
                        section="canvas"
                        index={i}
                        field="price"
                        value={item.price}
                        isCustom={item.size === 'Custom Sizes'}
                      />
                    </div>
                    <p className="text-gray-600 leading-relaxed">{item.details}</p>
                  </motion.div>
                ))}
              </div>
            </motion.section>

            <motion.section
              variants={fadeUp}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: '-80px' }}
              className="mb-16 rounded-3xl border border-white/30 bg-white/90 backdrop-blur-md shadow-xl p-6 md:p-8"
            >
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
                <div className="max-w-2xl">
                  <div className="inline-flex items-center gap-2 rounded-full bg-[#118C8C]/10 text-[#118C8C] px-4 py-2 text-sm font-semibold mb-4">
                    <Sparkles size={16} />
                    Need inspiration first?
                  </div>
                  <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-3">
                    See finished works before you request a quote
                  </h2>
                  <p className="text-gray-600 leading-relaxed">
                    Browse our gallery to get a better feel for styles, detail levels, and the kind
                    of handmade work we create. It's the best place to explore ideas before ordering.
                  </p>
                </div>

                <div className="grid grid-cols-3 gap-3 lg:w-[320px]">
                  <div className="h-24 rounded-2xl bg-gradient-to-br from-[#118C8C]/25 to-[#118C8C]/5 border border-[#118C8C]/10" />
                  <div className="h-24 rounded-2xl bg-gradient-to-br from-[#F2BB16]/25 to-[#F2BB16]/5 border border-[#F2BB16]/10" />
                  <div className="h-24 rounded-2xl bg-gradient-to-br from-pink-200/40 to-white border border-pink-100" />
                  <div className="h-24 rounded-2xl bg-gradient-to-br from-purple-200/40 to-white border border-purple-100" />
                  <div className="h-24 rounded-2xl bg-gradient-to-br from-emerald-200/40 to-white border border-emerald-100" />
                  <div className="h-24 rounded-2xl bg-gradient-to-br from-sky-200/40 to-white border border-sky-100" />
                </div>
              </div>

              <div className="mt-6">
                <Button
                  onClick={() => navigate('/gallery')}
                  className="bg-[#118C8C] hover:bg-[#0d7070] text-white rounded-2xl px-8 py-6"
                >
                  Browse Gallery
                  <ChevronRight className="ml-2" size={18} />
                </Button>
              </div>
            </motion.section>

            {isAdmin && (
              <div className="text-center my-20">
                <Button
                  size="lg"
                  onClick={() => navigate('/add-product')}
                  className="bg-[#118C8C] hover:bg-[#0d7070] text-white font-bold text-xl px-12 py-6 rounded-2xl"
                >
                  <Plus className="mr-3" size={28} />
                  Add New Product
                </Button>
              </div>
            )}

            <motion.section
              ref={registerRef('custom-orders')}
              id="custom-orders"
              variants={fadeUp}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: '-80px' }}
              className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#118C8C] via-[#0f7a7a] to-[#0b5f5f] text-white p-8 md:p-12 shadow-2xl scroll-mt-40"
            >
              <div className="absolute inset-0 opacity-10">
                <div className="absolute -top-10 -right-10 w-44 h-44 bg-white rounded-full blur-3xl" />
                <div className="absolute -bottom-12 -left-10 w-56 h-56 bg-[#F2BB16] rounded-full blur-3xl" />
              </div>

              <div className="relative z-10 max-w-3xl mx-auto text-center">
                <div className="inline-flex items-center gap-2 rounded-full bg-white/15 border border-white/20 px-4 py-2 text-sm font-semibold mb-5">
                  <Sparkles size={16} />
                  Custom Commissions Available
                </div>

                <h2 className="text-3xl md:text-4xl font-bold mb-4">
                  Need something made just for you?
                </h2>

                <p className="text-base md:text-lg text-white/90 leading-relaxed max-w-2xl mx-auto mb-8">
                  All prices are starting estimates. Final pricing depends on design complexity,
                  materials, sizing, and special requests. Reach out to us for a personalized quote
                  for your custom order.
                </p>

                <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                  <Button
                    onClick={() => navigate('/contact')}
                    className="bg-[#F2BB16] hover:bg-[#d9a614] text-gray-900 font-bold px-8 py-6 rounded-2xl text-base shadow-lg"
                  >
                    <MessageCircle className="mr-2" size={18} />
                    Contact Us
                  </Button>

                  <Button
                    variant="outline"
                    onClick={() => navigate('/gallery')}
                    className="border-white/30 bg-white/10 text-white hover:bg-white/20 hover:text-white px-8 py-6 rounded-2xl text-base"
                  >
                    Browse Gallery
                    <ArrowRight className="ml-2" size={18} />
                  </Button>
                </div>
              </div>
            </motion.section>
          </div>
        </div>
      </div>
    </>
  );
};

export default PricelistsPage;