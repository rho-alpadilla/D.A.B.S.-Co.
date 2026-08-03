// src/components/layout/Footer.jsx
// Design A — Artisan Canvas reskin.
// ── ALL ORIGINAL FUNCTIONS PRESERVED ────────────────────────────────────
//   • useAuth loading skeleton (prevents layout shift during auth load)
//   • All Link routes: About, Gallery, Pricing, Contact, FAQs,
//     Privacy Policy, Terms of Service
//   • Dynamic copyright year: new Date().getFullYear()
// ── WHAT CHANGED (visual only) ──────────────────────────────────────────
//   • Background: teal #118C8C → deep purple artisan gradient
//   • Added: cross-stitch decorative pattern overlay (CSS, opacity 0.04)
//   • Added: "Handcrafted with love" editorial tagline
//   • Added: decorative artisan divider between columns and copyright
//   • Hover colors on links updated to lavender (from white underline)

import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/lib/firebase';

const Footer = () => {
  const { loading } = useAuth();

  // Loading state — preserves layout space while auth resolves
  if (loading) {
    return (
      <footer
        className="py-12 mt-auto"
        style={{ background: 'linear-gradient(135deg, #2D0E5A, #4A2580)' }}
      >
        <div className="container mx-auto px-4 text-center sm:px-6 lg:px-8">
          <div className="h-6 bg-white/20 rounded w-48 mx-auto animate-pulse" />
        </div>
      </footer>
    );
  }

  return (
    <footer
      className="mt-auto relative overflow-hidden"
      style={{ background: 'linear-gradient(135deg, #2D0E5A 0%, #4A2580 50%, #3A1A6E 100%)' }}
    >
      {/* ── Cross-stitch decorative pattern (artisan brand detail) ──────── */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: `
            repeating-linear-gradient(45deg,  rgba(255,255,255,0.04) 0, rgba(255,255,255,0.04) 1px, transparent 0, transparent 50%),
            repeating-linear-gradient(-45deg, rgba(255,255,255,0.04) 0, rgba(255,255,255,0.04) 1px, transparent 0, transparent 50%)
          `,
          backgroundSize: '14px 14px',
        }}
      />

      {/* ── Radial glow accents ──────────────────────────────────────────── */}
      <div className="absolute -top-20 -left-20 w-72 h-72 rounded-full bg-artisan-primary-light/10 blur-3xl pointer-events-none" />
      <div className="absolute -bottom-10 -right-10 w-60 h-60 rounded-full bg-artisan-mauve/10 blur-3xl pointer-events-none" />

      <div className="relative z-10 container mx-auto px-4 sm:px-6 lg:px-8 pt-14 pb-8">

        {/* ── Main grid ─────────────────────────────────────────────────── */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10 text-center md:text-left">

          {/* Brand column */}
          <div>
            <h3
              className="font-artisan-display text-2xl font-bold text-white mb-1"
            >
              D.A.B.S. Co.
            </h3>
            {/* Editorial brand tagline */}
            <p
              className="mb-4 font-artisan-display text-[1.1rem] text-artisan-primary-pale"
            >
              Handcrafted with love
            </p>
            <p className="text-artisan-footer-muted text-sm leading-relaxed max-w-xs mx-auto md:mx-0">
              Transforming needlepoint designs into stitch-ready canvases — your dedicated partner in craft.
            </p>
          </div>

          {/* Explore links */}
          <div>
            <h4
              className="font-semibold text-white mb-4 text-sm uppercase tracking-widest"
              style={{ letterSpacing: '0.12em' }}
            >
              Explore
            </h4>
            <ul className="space-y-3 text-sm">
              <li>
                <Link
                  to="/about"
                  className="text-artisan-footer-muted hover:text-artisan-primary-pale transition-colors duration-200"
                >
                  About Us
                </Link>
              </li>
              <li>
                <Link
                  to="/gallery"
                  className="text-artisan-footer-muted hover:text-artisan-primary-pale transition-colors duration-200"
                >
                  Gallery
                </Link>
              </li>
              <li>
                <Link
                  to="/pricelists"
                  className="text-artisan-footer-muted hover:text-artisan-primary-pale transition-colors duration-200"
                >
                  Pricing
                </Link>
              </li>
              <li>
                <Link
                  to="/contact"
                  className="text-artisan-footer-muted hover:text-artisan-primary-pale transition-colors duration-200"
                >
                  Contact
                </Link>
              </li>
            </ul>
          </div>

          {/* Support links */}
          <div>
            <h4
              className="font-semibold text-white mb-4 text-sm uppercase tracking-widest"
              style={{ letterSpacing: '0.12em' }}
            >
              Support
            </h4>
            <ul className="space-y-3 text-sm">
              <li>
                <Link
                  to="/faqs"
                  className="text-artisan-footer-muted hover:text-artisan-primary-pale transition-colors duration-200"
                >
                  FAQs
                </Link>
              </li>
              <li>
                <Link
                  to="/privacy-policy"
                  className="text-artisan-footer-muted hover:text-artisan-primary-pale transition-colors duration-200"
                >
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link
                  to="/terms"
                  className="text-artisan-footer-muted hover:text-artisan-primary-pale transition-colors duration-200"
                >
                  Terms of Service
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* ── Artisan divider ──────────────────────────────────────────── */}
        <div className="mt-10 mb-6">
          <div
            className="w-full h-px"
            style={{
              background: 'linear-gradient(90deg, transparent 0%, rgba(168,125,200,0.35) 30%, rgba(201,160,220,0.45) 60%, transparent 100%)',
            }}
          />
        </div>

        {/* ── Copyright ────────────────────────────────────────────────── */}
        <div className="text-center text-sm text-artisan-footer-muted">
          © {new Date().getFullYear()} D.A.B.S. Co. • All rights reserved.
        </div>
      </div>
    </footer>
  );
};

export default Footer;
