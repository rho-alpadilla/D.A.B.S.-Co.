import React from 'react';
import { FileText } from 'lucide-react';
import LegalContentPage from '@/components/marketing/LegalContentPage';
import { useSiteContent } from '@/hooks/useSiteContent';
import TermsPage from '@/pages/marketing/TermsPage';

const ManagedTermsPage = () => {
  const { content, error, loading } = useSiteContent();

  if (loading) return <TermsPage />;

  return (
    <LegalContentPage
      title="Terms of Service"
      description="Read D.A.B.S. Co.'s terms of service to understand the rules and guidelines for using our services."
      content={content.terms}
      error={error}
      icon={FileText}
    />
  );
};

export default ManagedTermsPage;
