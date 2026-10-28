import { faqs as defaultFaqs } from '@/data/faqs';

const DEFAULT_LAST_UPDATED = '2026-10-28';

const defaultPrivacySections = [
  {
    id: 'privacy-introduction',
    title: 'Introduction',
    body: 'At D.A.B.S. Co., we are committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you visit our website or use our services.',
    items: [],
  },
  {
    id: 'privacy-information-collected',
    title: 'Information We Collect',
    body: 'We may collect the following types of information:',
    items: [
      'Personal identification information (name, email address, phone number)',
      'Order and commission details',
      'Payment information (processed securely through third-party providers)',
      'Communication preferences',
    ],
  },
  {
    id: 'privacy-information-use',
    title: 'How We Use Your Information',
    body: 'We use the information we collect to:',
    items: [
      'Process and fulfill your orders and commissions',
      'Communicate with you about your orders and our services',
      'Improve our website and customer service',
      'Send promotional materials (with your consent)',
    ],
  },
  {
    id: 'privacy-data-security',
    title: 'Data Security',
    body: 'We implement appropriate technical and organizational security measures to protect your personal information against unauthorized access, alteration, disclosure, or destruction.',
    items: [],
  },
  {
    id: 'privacy-rights',
    title: 'Your Rights',
    body: 'You have the right to:',
    items: [
      'Access your personal information',
      'Request correction of inaccurate data',
      'Request deletion of your data',
      'Opt-out of marketing communications',
    ],
  },
  {
    id: 'privacy-contact',
    title: 'Contact Us',
    body: 'If you have any questions about this Privacy Policy, please contact us at contact@dabsco.com.',
    items: [],
  },
];

const defaultTermsSections = [
  {
    id: 'terms-acceptance',
    title: 'Acceptance of Terms',
    body: "By accessing and using D.A.B.S. Co.'s website and services, you accept and agree to be bound by the terms and provisions of this agreement.",
    items: [],
  },
  {
    id: 'terms-services',
    title: 'Services',
    body: 'D.A.B.S. Co. provides handcrafted artisan products and custom commission services including needlepoint canvases, crochet items, portraiture, and canvas paintings.',
    items: [],
  },
  {
    id: 'terms-orders',
    title: 'Orders and Commissions',
    body: '',
    items: [
      'All custom orders require a 50% deposit before work begins',
      'Completion times vary based on project complexity and current workload',
      'Final prices may vary from estimates based on actual complexity and materials used',
      'We reserve the right to refuse any commission request',
    ],
  },
  {
    id: 'terms-payment',
    title: 'Payment Terms',
    body: 'Payment terms are as follows:',
    items: [
      '50% deposit required for custom commissions',
      'Final payment due before shipping or pickup',
      'We accept major credit cards and secure online payment methods',
    ],
  },
  {
    id: 'terms-refunds',
    title: 'Returns and Refunds',
    body: 'Due to the custom nature of our products, all sales are final. However, if there is a defect in materials or workmanship, please contact us within 7 days of receipt for resolution.',
    items: [],
  },
  {
    id: 'terms-intellectual-property',
    title: 'Intellectual Property',
    body: 'All original designs, patterns, and artwork created by D.A.B.S. Co. remain our intellectual property. Customers receive rights to the physical product only, not reproduction rights.',
    items: [],
  },
  {
    id: 'terms-contact',
    title: 'Contact Information',
    body: 'For questions about these Terms of Service, please contact us at contact@dabsco.com.',
    items: [],
  },
];

const normalizeText = (value) => String(value || '').trim();

const normalizeFaqs = (value) => {
  if (!Array.isArray(value) || value.length === 0) return structuredClone(defaultFaqs);

  return value.map((faq, index) => ({
    id: normalizeText(faq?.id) || `faq-${index + 1}`,
    question: normalizeText(faq?.question),
    answer: normalizeText(faq?.answer),
    keywords: Array.isArray(faq?.keywords)
      ? faq.keywords.map(normalizeText).filter(Boolean)
      : [],
  }));
};

const normalizeLegalContent = (value, fallbackSections) => {
  const sections = Array.isArray(value?.sections) && value.sections.length > 0
    ? value.sections
    : fallbackSections;

  return {
    lastUpdated: /^\d{4}-\d{2}-\d{2}$/.test(value?.lastUpdated || '')
      ? value.lastUpdated
      : DEFAULT_LAST_UPDATED,
    sections: sections.map((section, index) => ({
      id: normalizeText(section?.id) || `section-${index + 1}`,
      title: normalizeText(section?.title),
      body: normalizeText(section?.body),
      items: Array.isArray(section?.items)
        ? section.items.map(normalizeText).filter(Boolean)
        : [],
    })),
  };
};

export const DEFAULT_SITE_CONTENT = {
  faqs: normalizeFaqs(defaultFaqs),
  privacy: normalizeLegalContent(null, defaultPrivacySections),
  terms: normalizeLegalContent(null, defaultTermsSections),
};

export const normalizeSiteContent = (value = {}) => ({
  faqs: normalizeFaqs(value.faqs),
  privacy: normalizeLegalContent(value.privacy, defaultPrivacySections),
  terms: normalizeLegalContent(value.terms, defaultTermsSections),
});

export const normalizeSiteContentSection = (section, value) => {
  if (section === 'faqs') return normalizeFaqs(value);
  if (section === 'privacy') return normalizeLegalContent(value, defaultPrivacySections);
  if (section === 'terms') return normalizeLegalContent(value, defaultTermsSections);
  return null;
};

let contentItemSequence = 0;

export const createContentItemId = (prefix) => {
  contentItemSequence += 1;
  return `${prefix}-${Date.now()}-${contentItemSequence}`;
};
