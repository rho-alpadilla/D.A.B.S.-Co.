import React from 'react';
import { ShieldCheck } from 'lucide-react';
import LegalContentPage from '@/components/marketing/LegalContentPage';
import { useSiteContent } from '@/hooks/useSiteContent';
import PrivacyPolicyPage from '@/pages/marketing/PrivacyPolicyPage';

const ManagedPrivacyPolicyPage = () => {
  const { content, error, loading } = useSiteContent();

  if (loading) return <PrivacyPolicyPage />;

  return (
    <LegalContentPage
      title="Privacy Policy"
      description="Read D.A.B.S. Co.'s privacy policy to understand how we collect, use, and protect your personal information."
      content={content.privacy}
      error={error}
      icon={ShieldCheck}
    />
  );
};

export default ManagedPrivacyPolicyPage;
