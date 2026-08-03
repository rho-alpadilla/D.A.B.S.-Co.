import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { getAuthenticationErrorMessage, signInWithSocialProvider } from '@/lib/authProviders';

const providers = [
  { id: 'google', label: 'Continue with Google', mark: 'G', markClass: 'text-[#4285F4]' },
  { id: 'facebook', label: 'Continue with Facebook', mark: 'f', markClass: 'text-[#1877F2]' },
];

const SocialSignInButtons = ({ onSuccess, onError, onStart, disabled = false }) => {
  const [activeProvider, setActiveProvider] = useState(null);

  const handleSignIn = async (provider) => {
    onStart?.(provider.id);
    setActiveProvider(provider.id);
    try {
      const result = await signInWithSocialProvider(provider.id);
      await onSuccess(result);
    } catch (error) {
      onError(error.message || getAuthenticationErrorMessage(error));
    } finally {
      setActiveProvider(null);
    }
  };

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      {providers.map((provider) => (
        <Button
          key={provider.id}
          type="button"
          variant="outline"
          disabled={disabled || activeProvider !== null}
          onClick={() => handleSignIn(provider)}
          className="h-12 rounded-xl border-[#D9C9E3] bg-white text-[#01243A] hover:bg-[#F7F0FA]"
        >
          <span className={`mr-2 text-lg font-bold ${provider.markClass}`} aria-hidden="true">{provider.mark}</span>
          {activeProvider === provider.id ? 'Connecting…' : provider.label}
        </Button>
      ))}
    </div>
  );
};

export default SocialSignInButtons;
