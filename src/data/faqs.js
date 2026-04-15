export const faqs = [
  {
    id: 'custom-order-timeline',
    question: 'How long does it take to complete a custom order?',
    answer:
      'Custom order timelines vary depending on the complexity of the piece and our current workload. Hand-painted needlepoint canvases typically take 2-4 weeks, crochet items range from 1-6 weeks, and portraiture can take 3-6 weeks. We will provide a specific timeline when you place your order.',
    keywords: [
      'how long',
      'timeline',
      'turnaround',
      'turn around',
      'custom order',
      'complete order',
      'processing time',
      'how many weeks',
      'how many days',
      'finish order',
    ],
  },
  {
    id: 'international-shipping',
    question: 'Do you ship internationally?',
    answer:
      'Currently, we ship within the United States. For international shipping inquiries, please contact us directly at contact@dabsco.com to discuss options and pricing.',
    keywords: [
      'international shipping',
      'ship internationally',
      'outside us',
      'outside united states',
      'worldwide shipping',
      'international',
      'other country',
      'abroad',
    ],
  },
  {
    id: 'custom-design-request',
    question: 'Can I request a specific design or pattern?',
    answer:
      'Absolutely! We love working on custom designs. Share your vision with us, and we will work with you to create a unique piece that meets your specifications. Custom design consultations are available at no additional charge.',
    keywords: [
      'specific design',
      'specific pattern',
      'custom design',
      'custom pattern',
      'request design',
      'request pattern',
      'my own design',
      'personalized design',
      'custom request',
    ],
  },
  {
    id: 'refund-policy',
    question: 'What is your refund policy?',
    answer:
      'Due to the custom, handmade nature of our products, all sales are final. However, if there is a defect in materials or workmanship, please contact us within 7 days of receipt, and we will work to resolve the issue.',
    keywords: [
      'refund',
      'refund policy',
      'return',
      'returns',
      'money back',
      'can i refund',
      'can i return',
      'return policy',
    ],
  },
  {
    id: 'payment-methods',
    question: 'What payment methods do you accept?',
    answer:
      'We accept all major credit cards, debit cards, and secure online payment methods. For custom commissions, a 50% deposit is required before we begin work, with the balance due before shipping or pickup.',
    keywords: [
      'payment',
      'payment methods',
      'how can i pay',
      'how to pay',
      'pay',
      'credit card',
      'debit card',
      'deposit',
      'mode of payment',
    ],
  },
  {
    id: 'needlepoint-care',
    question: 'How do I care for my hand-painted needlepoint canvas?',
    answer:
      'Store your canvas flat or rolled (painted side out) in a cool, dry place. Avoid folding or creasing. If the canvas needs cleaning, gently spot clean with a damp cloth. Never machine wash or use harsh chemicals.',
    keywords: [
      'care',
      'take care',
      'how to care',
      'clean canvas',
      'needlepoint care',
      'hand-painted canvas care',
      'store canvas',
      'cleaning',
    ],
  },
  {
    id: 'portrait-from-photo',
    question: 'Can I commission a portrait from a photograph?',
    answer:
      'Yes! We create beautiful portraits from high-quality photographs. For best results, please provide clear, well-lit photos with good resolution. We can work with multiple reference photos if needed.',
    keywords: [
      'portrait from photo',
      'portrait from photograph',
      'photo portrait',
      'use a photo',
      'reference photo',
      'commission portrait',
      'portrait commission',
    ],
  },
  {
    id: 'rush-orders',
    question: 'Do you offer rush orders?',
    answer:
      'Rush orders may be available depending on our current schedule. Please contact us to discuss your timeline, and we will do our best to accommodate your needs. Rush fees may apply.',
    keywords: [
      'rush order',
      'rush orders',
      'urgent order',
      'expedite',
      'faster',
      'priority order',
      'need it fast',
      'rush fee',
    ],
  },
  {
    id: 'mesh-difference',
    question: 'What is the difference between 13-mesh and 18-mesh needlepoint canvas?',
    answer:
      '13-mesh has 13 threads per inch, making it easier to stitch and better for beginners or simpler designs. 18-mesh has 18 threads per inch, allowing for more detailed and intricate designs but requiring more stitching time.',
    keywords: [
      '13 mesh',
      '18 mesh',
      'difference between 13 mesh and 18 mesh',
      'mesh difference',
      'needlepoint mesh',
      'what is 13 mesh',
      'what is 18 mesh',
    ],
  },
  {
    id: 'studio-visit',
    question: 'Can I visit your studio?',
    answer:
      'We currently operate by appointment only. If you would like to visit our studio to discuss a custom project or view our work in person, please contact us to schedule an appointment.',
    keywords: [
      'visit studio',
      'studio visit',
      'appointment',
      'see your studio',
      'go to your studio',
      'meet in person',
      'visit in person',
    ],
  },
];

export const faqFallbackSuggestions = [
  'How long does it take to complete a custom order?',
  'Do you ship internationally?',
  'What payment methods do you accept?',
  'Do you offer rush orders?',
];

export const findBestFaqMatch = (input) => {
  const normalizedInput = input.toLowerCase().trim();

  if (!normalizedInput) return null;

  let bestMatch = null;
  let bestScore = 0;

  for (const faq of faqs) {
    let score = 0;

    if (normalizedInput.includes(faq.question.toLowerCase())) {
      score += 10;
    }

    for (const keyword of faq.keywords || []) {
      const normalizedKeyword = keyword.toLowerCase();
      if (normalizedInput.includes(normalizedKeyword)) {
        score += normalizedKeyword.split(' ').length > 1 ? 3 : 1;
      }
    }

    const questionWords = faq.question
      .toLowerCase()
      .replace(/[^\w\s]/g, '')
      .split(/\s+/)
      .filter((word) => word.length > 3);

    for (const word of questionWords) {
      if (normalizedInput.includes(word)) {
        score += 1;
      }
    }

    if (score > bestScore) {
      bestScore = score;
      bestMatch = faq;
    }
  }

  return bestScore >= 2 ? bestMatch : null;
};