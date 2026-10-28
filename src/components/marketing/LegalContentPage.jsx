import React from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';

const formatLastUpdated = (value) => {
  const date = new Date(`${value}T00:00:00`);
  if (!Number.isFinite(date.getTime())) return 'Not specified';

  return new Intl.DateTimeFormat('en-PH', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  }).format(date);
};

const renderBody = (body) => {
  const email = 'contact@dabsco.com';
  if (!body.includes(email)) return body;

  const [beforeEmail, afterEmail] = body.split(email);
  return (
    <>
      {beforeEmail}
      <a href={`mailto:${email}`} className="font-semibold text-artisan-primary hover:underline">{email}</a>
      {afterEmail}
    </>
  );
};

const LegalContentPage = ({
  badgeLabel = 'Legal Information',
  content,
  description,
  error,
  icon: Icon,
  title,
}) => (
  <>
    <Helmet>
      <title>{title} - D.A.B.S. Co.</title>
      <meta name="description" content={description} />
    </Helmet>

    <div className="artisan-grid-page relative min-h-screen overflow-hidden">
      <div className="relative z-10 container mx-auto px-5 py-14 md:px-8 md:py-20">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, ease: 'easeOut' }}
          className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[0.72fr_1.28fr] lg:items-start lg:gap-16"
        >
          <aside className="h-fit text-[#2D0E5A] lg:sticky lg:top-24">
            <div className="inline-flex items-center gap-2 rounded-full border border-artisan-primary/20 bg-white/75 px-4 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-artisan-primary backdrop-blur-sm">
              <Icon className="text-artisan-primary" size={14} aria-hidden="true" />
              {badgeLabel}
            </div>
            <div className="mt-6 flex items-start gap-3">
              <Icon className="mt-1 shrink-0 text-artisan-primary" size={34} aria-hidden="true" />
              <h1 className="font-artisan-display text-5xl font-bold leading-[0.95] text-artisan-primary md:text-6xl">
                {title}
              </h1>
            </div>
            <p className="mt-6 border-y border-artisan-primary/20 py-5 text-sm text-artisan-text-mid">
              Last updated: {formatLastUpdated(content.lastUpdated)}
            </p>
            {error && (
              <p role="status" className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs leading-5 text-amber-900">
                {error}
              </p>
            )}
          </aside>

          <article className="space-y-8 rounded-[2rem] border border-white/45 bg-[#FFFCFA]/95 p-6 shadow-2xl shadow-[#2D0E5A]/25 backdrop-blur-md sm:p-10">
            {content.sections.map((section) => (
              <section key={section.id}>
                <h2 className="mb-3 font-artisan-display text-2xl font-bold text-[#2A1739]">{section.title}</h2>
                {section.body && (
                  <p className="leading-relaxed text-[#5B4C66]">{renderBody(section.body)}</p>
                )}
                {section.items.length > 0 && (
                  <ul className={`${section.body ? 'mt-3' : ''} ml-4 list-inside list-disc space-y-2 text-[#5B4C66]`}>
                    {section.items.map((item, index) => <li key={`${section.id}-item-${index}`}>{item}</li>)}
                  </ul>
                )}
              </section>
            ))}
          </article>
        </motion.div>
      </div>
    </div>
  </>
);

export default LegalContentPage;
