// src/pages/marketing/HomePage.jsx
// Design A — Artisan Canvas reskin.
// ── ALL ORIGINAL FUNCTIONS PRESERVED ────────────────────────────────────
//   • Hero artwork with a transparent ShapeGrid overlay
//   • framer-motion scroll-in animations (motion.div, whileInView)
//   • 4-step Creative Process grid with numbered circles
//   • "Who We Are" two-column section with info cards
//   • All navigation links (Gallery, Pricing, About)
// ── WHAT CHANGED (visual only) ──────────────────────────────────────────
//   • Hero: supplied botanical artwork with the approved Playfair/Nunito hierarchy
//   • Hero buttons: teal/outline → violet and ivory action pair
//   • "Who We Are" card: teal borders → artisan purple borders
//   • Info sub-cards: teal/amber → purple/mauve/lavender
//   • Step circles: teal → artisan primary purple
//   • Section backgrounds: teal wash → artisan lavender wash
//   • Hero eyebrow label: artsy cross-stitch dot + Playfair Display style

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Helmet } from 'react-helmet';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowRight, Palette, Brush, Flower2, FilePenLine, ReceiptText, Paintbrush, PackageCheck } from 'lucide-react';
import { motion, useReducedMotion } from 'framer-motion';
import ShinyText from '@/components/effects/ShinyText';
import ShapeGrid from '@/components/effects/ShapeGrid';
import CircularGallery from '@/components/effects/CircularGallery';
import PageContainer from '@/components/layout/PageContainer';
import { collection, limit, onSnapshot, orderBy, query } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import homeHeroBackground from '@/assets/home/home-hero-background.png';

const getProductImage = (product) => product.imageUrls?.[0] || product.imageUrl || null;
const serviceMarqueeText = 'Needlepoint Canvas  •  Crochet  •  Portraiture  •  Canvas Paintings';

const HomePage = () => {
  const [recentWorks, setRecentWorks] = useState([]);
  const [recentWorksLoading, setRecentWorksLoading] = useState(true);
  const [recentWorksError, setRecentWorksError] = useState(false);
  const [isWordmarkReady, setIsWordmarkReady] = useState(false);
  const navigate = useNavigate();
  const shouldReduceMotion = useReducedMotion();

  useEffect(() => {
    let isMounted = true;

    const revealWordmark = () => {
      if (isMounted) setIsWordmarkReady(true);
    };

    // Keep the wordmark hidden until Playfair Display is available. Rendering the
    // fallback first changes its width when the web font arrives, which causes
    // the visible "shrink" during a refresh.
    if (!document.fonts?.load) {
      revealWordmark();
      return undefined;
    }

    document.fonts.load('1em "Playfair Display"').then(revealWordmark, revealWordmark);

    return () => {
      isMounted = false;
    };
  }, []);

  const recentWorkItems = useMemo(
    () => recentWorks
      .map((work) => {
        const image = getProductImage(work);

        return image
          ? {
              id: work.id,
              image,
              text: work.name || 'Recent work',
            }
          : null;
      })
      .filter(Boolean),
    [recentWorks],
  );

  const handleRecentWorkSelect = useCallback((work) => {
    if (work?.id) {
      navigate(`/product/${work.id}`);
    }
  }, [navigate]);

  useEffect(() => {
    const recentWorksQuery = query(
      collection(db, 'pricelists'),
      orderBy('createdAt', 'desc'),
      limit(8),
    );

    const unsubscribe = onSnapshot(
      recentWorksQuery,
      (snapshot) => {
        setRecentWorks(snapshot.docs.map((document) => ({ id: document.id, ...document.data() })));
        setRecentWorksLoading(false);
        setRecentWorksError(false);
      },
      () => {
        setRecentWorks([]);
        setRecentWorksLoading(false);
        setRecentWorksError(true);
      },
    );

    return unsubscribe;
  }, []);

  const steps = [
    {
      number: '01',
      title: 'Design Submission',
      icon: FilePenLine,
      description:
        'All approved designers will submit needlepoint canvas designs through the Gallery tab. We can work off painted masters or PDF chart files.',
    },
    {
      number: '02',
      title: 'Design Quoted',
      icon: ReceiptText,
      description:
        'Receive your quote with price per piece within 1-3 business days via email. If satisfied, place your order through Contact.',
    },
    {
      number: '03',
      title: 'Master Painted',
      icon: Paintbrush,
      description:
        'A painted proof of your design will be sent via email for approval. This will be stored at the studio as a master for easy reordering.',
    },
    {
      number: '04',
      title: 'Order Painted',
      icon: PackageCheck,
      description:
        'Upon master approval, production begins. Once completed, we receive the canvases in Dallas and invoice you.',
    },
  ];

  return (
    <>
      <Helmet>
        <title>DABS Co.</title>
      </Helmet>

      <div className="relative min-h-screen overflow-hidden" style={{ background: 'var(--artisan-white)' }}>

        <div className="absolute inset-x-0 top-0 z-0 h-[calc(100svh-4.5rem)] min-h-[42rem] overflow-hidden bg-[#FAF8F1]" aria-hidden="true">
          <img
            src={homeHeroBackground}
            alt=""
            className="absolute inset-0 h-full w-full object-cover object-center opacity-55"
          />
          <div className="absolute inset-0 z-10">
            <ShapeGrid
              speed={0.3}
              squareSize={54}
              direction="up"
              borderColor="rgba(92, 45, 145, 0.20)"
              hoverFillColor="rgba(92, 45, 145, 0.10)"
              backgroundColor="transparent"
              shape="square"
              hoverTrailAmount={2}
            />
          </div>
        </div>

        {/* ── HERO ──────────────────────────────────────────────────── */}
        <section className="relative flex min-h-[calc(100svh-4.5rem)] items-center">
          <PageContainer size="full" className="relative z-10 flex min-h-[calc(100svh-4.5rem)] items-center justify-center py-16 text-center sm:py-20 lg:py-24">
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, ease: [0.23, 1, 0.32, 1] }}
              className="flex w-full max-w-6xl flex-col items-center"
            >
              <h1
                className="home-wordmark-glow whitespace-nowrap font-artisan-display text-[clamp(3.25rem,10.6vw,9.5rem)] font-bold leading-[0.86] tracking-[-0.065em] text-artisan-primary"
                style={{ opacity: isWordmarkReady ? 1 : 0 }}
              >
                <ShinyText
                  text="DABS Co."
                  speed={6}
                  delay={5}
                  color="#5C2D91"
                  shineColor="#FAF8F1"
                  spread={110}
                  direction="left"
                  disabled={shouldReduceMotion}
                />
              </h1>

          <p className="mt-5 max-w-none font-nunito text-[clamp(0.8rem,1.45vw,1.4rem)] italic leading-snug text-[#5C2D91] sm:mt-7 sm:whitespace-nowrap">
                &ldquo;Transforming Your Needlepoint Designs into Stitch Ready Canvases&rdquo;
              </p>

              <div className="mt-8 flex w-full max-w-xl flex-col justify-center gap-3 sm:mt-10 sm:flex-row">
                <Link to="/gallery" className="w-full sm:w-1/2">
                  <Button
                    size="lg"
                    className="home-hero-cta home-hero-cta--primary h-14 w-full rounded-lg bg-artisan-primary px-5 py-0 text-base font-semibold text-white"
                  >
                    <Palette className="mr-2" size={19} />
                    Explore Gallery
                    <ArrowRight className="ml-2" size={18} />
                  </Button>
                </Link>

                <Link to="/pricelists" className="w-full sm:w-1/2">
                  <Button
                    size="lg"
                    variant="outline"
                    className="home-hero-cta home-hero-cta--secondary h-14 w-full rounded-lg border-[#B998B3]/70 bg-[#FAF8F1]/75 px-5 py-0 text-base font-semibold text-artisan-primary backdrop-blur-[2px]"
                  >
                    <Brush className="mr-2" size={19} />
                    View Pricing
                  </Button>
                </Link>
              </div>
            </motion.div>

          </PageContainer>
        </section>

        <section
          className="home-service-marquee relative z-10 overflow-hidden bg-artisan-primary py-2 text-[#FAF8F1] sm:py-2.5"
          aria-label="Services: Needlepoint Canvas, Crochet, Portraiture, and Canvas Paintings"
        >
          <div className="home-service-marquee__track" aria-hidden="true">
            {[0, 1].map((groupIndex) => (
              <div className="home-service-marquee__group" key={groupIndex}>
                {[0, 1, 2].map((itemIndex) => (
                  <p
                className="home-service-marquee__item font-artisan-display text-[clamp(1.15rem,2.25vw,2.25rem)] font-normal leading-none tracking-[-0.025em]"
                    key={itemIndex}
                  >
                    {serviceMarqueeText}
                  </p>
                ))}
              </div>
            ))}
          </div>
        </section>

        {/* Firebase-backed recent works. The gallery is deliberately full-bleed
            so the curved row remains the focus, while each work stays clickable. */}
        <section className="relative z-10 overflow-hidden bg-[#FAF8F1] py-12 sm:py-16 lg:py-20">
          <div className="absolute inset-0 z-0" aria-hidden="true">
            <ShapeGrid
              speed={0.35}
              squareSize={54}
              direction="up"
              borderColor="rgba(92, 45, 145, 0.12)"
              hoverFillColor="rgba(92, 45, 145, 0.12)"
              backgroundColor="#FAF8F1"
              shape="square"
              hoverTrailAmount={2}
            />
          </div>

          <PageContainer size="wide" className="relative z-10 flex flex-col items-center">
            <h2 className="mb-8 font-artisan-display text-3xl font-bold tracking-[-0.04em] text-artisan-primary sm:mb-10 sm:text-4xl">
              Our Recent Works
            </h2>
          </PageContainer>

          {recentWorksLoading ? (
            <div
              aria-label="Loading recent works"
              className="home-recent-works-gallery relative z-10 flex h-[300px] items-center gap-4 overflow-hidden px-5 sm:h-[390px] sm:gap-7 sm:px-10 lg:h-[480px]"
            >
              {[0, 1, 2, 3].map((skeletonIndex) => (
                <div
                  key={skeletonIndex}
                  className="h-[72%] w-[min(52vw,18rem)] shrink-0 animate-pulse rounded-[1.1rem] bg-artisan-primary/10 sm:w-[min(30vw,23rem)] sm:rounded-[1.5rem]"
                  style={{
                    transform: `rotate(${(skeletonIndex - 1.5) * 2.5}deg)`,
                  }}
                />
              ))}
            </div>
          ) : recentWorksError || recentWorkItems.length === 0 ? (
            <div className="relative z-10 mx-auto flex h-[300px] w-[min(100%-2rem,72rem)] items-center justify-center rounded-2xl border border-artisan-primary/15 bg-white/65 p-8 text-center text-artisan-text-muted shadow-artisan-card sm:h-[390px] lg:h-[480px]">
              Recent works are currently unavailable.
            </div>
          ) : (
            <div className="home-recent-works-gallery relative z-10 h-[300px] w-full sm:h-[390px] lg:h-[480px]">
              <CircularGallery
                items={recentWorkItems}
                bend={1}
                textColor="#01243A"
                borderRadius={0.07}
                showTitles={false}
                itemScale={1.1}
                itemGap={0.8}
                scrollEase={0.05}
                scrollSpeed={3.5}
                onItemSelect={handleRecentWorkSelect}
              />
            </div>
          )}

          <p className="relative z-10 mt-4 px-6 text-center font-artisan-display text-sm italic text-[#5C2D91] sm:mt-6 sm:text-base">
            &ldquo;Transforming Your Needlepoint Designs into Stitch Ready Canvases&rdquo;
          </p>
        </section>

        {/* ── WHO WE ARE ────────────────────────────────────────────── */}
        <section className="relative z-10 overflow-hidden bg-[#2D0E5A] py-16 md:py-24">
          <motion.div
            initial={{ opacity: 0, y: 34 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-100px' }}
            transition={{ duration: 0.45 }}
            className="relative mx-auto max-w-7xl px-6 md:px-10 lg:px-12"
          >
            {/* Decorative blobs */}
            <div className="absolute inset-0 pointer-events-none">
              <div className="absolute inset-0 opacity-35 [background-image:repeating-linear-gradient(45deg,rgba(255,255,255,0.055)_0,rgba(255,255,255,0.055)_1px,transparent_1px,transparent_50%),repeating-linear-gradient(-45deg,rgba(255,255,255,0.055)_0,rgba(255,255,255,0.055)_1px,transparent_1px,transparent_50%)] [background-size:18px_18px]" />
              <div className="absolute -top-24 -left-20 h-72 w-72 rounded-full bg-artisan-primary-light/25 blur-3xl" />
              <div className="absolute -bottom-28 right-0 h-80 w-80 rounded-full bg-artisan-mauve/20 blur-3xl" />
            </div>

            <div className="relative z-10 grid items-center gap-12 md:grid-cols-[0.9fr_1.1fr] lg:gap-20">
              {/* Left — text */}
              <div className="text-center md:text-left">
                <div className="mb-5 inline-flex items-center gap-2 text-white/75">
                  <Flower2 size={15} aria-hidden="true" />
                  <span className="font-nunito text-xs font-semibold uppercase tracking-[0.18em]">
                    Our story
                  </span>
                </div>

                <h2
                  className="mb-5 text-balance font-artisan-display text-5xl font-bold leading-[0.95] tracking-[-0.04em] text-[#FAF8F1] md:text-6xl lg:text-7xl"
                >
                  Who We Are
                </h2>

                <p className="max-w-xl font-nunito text-base leading-relaxed text-white/80 md:text-xl">
                  We support needlepoint designers in expanding their businesses through our
                  outsourced canvas painting services. Whether you're a startup or an established
                  brand, we are here to collaborate with you as your dedicated partner in growth.
                </p>

                <div className="pt-7">
                  <Link to="/about">
                    <Button
                      size="lg"
                      className="rounded-lg !bg-[#FAF8F1] px-8 py-6 font-nunito font-semibold !text-artisan-primary shadow-[0_12px_28px_rgba(17,5,37,0.2)] transition-transform duration-300 hover:-translate-y-1 hover:!bg-white focus-visible:ring-2 focus-visible:ring-[#FAF8F1] focus-visible:ring-offset-2 focus-visible:ring-offset-[#2D0E5A]"
                    >
                      Learn More About Us
                      <ArrowRight className="ml-2" size={18} />
                    </Button>
                  </Link>
                </div>
              </div>

              {/* Right — info cards */}
              <div className="grid gap-3 sm:gap-4">
                <div
                  className="contents"
                >
                  <div className="grid gap-4">
                    {/* Card 1 — purple */}
                    <div className="border-l-2 border-[#B78B4A] bg-white/[0.1] px-6 py-5 backdrop-blur-[2px] transition-transform duration-300 hover:-translate-x-1 hover:bg-white/[0.14] sm:px-7">
                      <p className="font-nunito text-base font-bold text-[#FAF8F1]">
                        Dedicated Partnership
                      </p>
                      <p className="mt-1.5 font-nunito text-sm leading-relaxed text-white/75">
                        We work with designers as a reliable extension of their creative business.
                      </p>
                    </div>

                    {/* Card 2 — mauve */}
                    <div className="border-l-2 border-[#B78B4A] bg-white/[0.1] px-6 py-5 backdrop-blur-[2px] transition-transform duration-300 hover:-translate-x-1 hover:bg-white/[0.14] sm:px-7">
                      <p className="font-nunito text-base font-bold text-[#FAF8F1]">
                        Scalable Support
                      </p>
                      <p className="mt-1.5 font-nunito text-sm leading-relaxed text-white/75">
                        From growing startups to established brands, we help support production needs.
                      </p>
                    </div>

                    {/* Card 3 — white */}
                    <div className="border-l-2 border-[#B78B4A] bg-white/[0.1] px-6 py-5 backdrop-blur-[2px] transition-transform duration-300 hover:-translate-x-1 hover:bg-white/[0.14] sm:px-7">
                      <p className="font-nunito text-base font-bold text-[#FAF8F1]">
                        Craft + Collaboration
                      </p>
                      <p className="mt-1.5 font-nunito text-sm leading-relaxed text-white/75">
                        Our goal is to turn great designs into beautifully prepared stitch-ready canvases.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </section>

        {/* ── CREATIVE PROCESS ──────────────────────────────────────── */}
        <section className="relative z-10 overflow-hidden bg-[#FAF8F1] py-16 md:py-24">
          <div className="absolute inset-0 z-0" aria-hidden="true">
            <ShapeGrid
              speed={0.35}
              squareSize={54}
              direction="up"
              borderColor="rgba(92, 45, 145, 0.12)"
              hoverFillColor="rgba(92, 45, 145, 0.12)"
              backgroundColor="#FAF8F1"
              shape="square"
              hoverTrailAmount={2}
            />
          </div>
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-80px' }}
            transition={{ duration: 0.6 }}
            className="relative z-10 mx-auto max-w-7xl px-6 md:px-10 lg:px-12"
          >
            <div className="relative z-10 mx-auto mb-10 max-w-3xl text-center md:mb-12">
              <h2 className="mb-4 font-artisan-display text-4xl font-bold text-artisan-text md:text-5xl lg:text-6xl">
                Our Creative Process
              </h2>
              <p className="text-base text-artisan-text-mid md:text-lg">
                From your design to a stitch-ready canvas — four simple steps.
              </p>
            </div>

            <div className="relative z-10 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:gap-5">
              {steps.map((step, index) => {
                const Icon = step.icon;
                return (
                <motion.article
                  key={step.number}
                  initial={{ opacity: 0, scale: 0.92, y: 24 }}
                  whileInView={{ opacity: 1, scale: 1, y: 0 }}
                  viewport={{ once: true }}
                  whileHover={{ y: -8, scale: 1.025 }}
                  transition={{ duration: 0.42, delay: index * 0.1 }}
                      className="group relative min-h-[220px] overflow-hidden rounded-3xl border border-white/70 bg-[#FCFAFF] p-6 text-left shadow-[0_16px_35px_rgba(0,0,0,0.16)] transition-colors hover:border-artisan-primary-pale hover:bg-white sm:min-h-[245px]"
                >
                      <span className="absolute -right-1 -top-8 font-artisan-display text-8xl font-bold text-artisan-primary/[0.08] transition-transform duration-500 group-hover:scale-110">
                    {step.number}
                  </span>
                  <div className="relative flex items-start justify-between gap-4">
                        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-artisan-primary to-artisan-primary-mid text-white shadow-artisan-sm transition-transform duration-300 group-hover:rotate-6 group-hover:scale-110">
                      <Icon size={23} aria-hidden="true" />
                    </div>
                        <span className="font-artisan-display text-xl font-bold text-artisan-primary">{step.number}</span>
                  </div>

                  <h3 className="relative mt-7 font-artisan-display text-xl font-bold text-artisan-text transition-colors group-hover:text-artisan-primary">{step.title}</h3>

                  <p className="relative mt-3 text-sm leading-relaxed text-artisan-text-mid">
                    {step.description}
                  </p>
                  <span className="absolute bottom-0 left-0 h-1 w-0 bg-gradient-to-r from-artisan-primary-pale to-artisan-mauve transition-all duration-500 group-hover:w-full" />
                </motion.article>
                );
              })}
            </div>
          </motion.div>
        </section>
      </div>
    </>
  );
};

export default HomePage;
