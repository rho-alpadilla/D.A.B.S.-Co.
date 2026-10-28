import React, { useMemo, useState } from 'react';
import { AlertTriangle, ChevronDown, Loader2, PauseCircle, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { getReauthenticationMethod } from '@/lib/accountLifecycle';

const AccountDangerZone = ({
  user,
  isEligible,
  isCheckingEligibility,
  eligibilityError,
  onDeactivate,
  onDelete,
  isSubmitting,
}) => {
  const [mode, setMode] = useState(null);
  const [password, setPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [localError, setLocalError] = useState('');
  const authMethod = useMemo(() => getReauthenticationMethod(user), [user]);

  const reset = () => {
    setMode(null);
    setPassword('');
    setConfirmation('');
    setLocalError('');
  };

  const submit = async () => {
    setLocalError('');
    if (!isEligible) return;
    if (mode === 'delete' && confirmation !== 'DELETE') {
      setLocalError('Type DELETE exactly to confirm permanent deletion.');
      return;
    }

    try {
      if (mode === 'deactivate') {
        await onDeactivate();
      } else {
        await onDelete(password);
      }
    } catch (error) {
      setLocalError(error?.message || 'We could not complete that action.');
    }
  };

  const disabled = isCheckingEligibility || !isEligible || isSubmitting;

  return (
    <section className="overflow-hidden rounded-[1.5rem] border border-red-100 bg-red-50/45">
      <details className="group">
        <summary className="flex cursor-pointer list-none items-center gap-3 px-5 py-4 transition-colors hover:bg-red-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-red-300 [&::-webkit-details-marker]:hidden sm:px-6">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-red-100 text-red-700">
            <AlertTriangle size={18} aria-hidden="true" />
          </div>
          <h2 className="flex-1 font-nunito text-lg font-bold text-artisan-text">Account controls</h2>
          <ChevronDown size={18} className="text-artisan-text-muted transition-transform duration-200 group-open:rotate-180" aria-hidden="true" />
        </summary>

        <div className="border-t border-red-100 px-5 pb-5 sm:px-6 sm:pb-6">

      <div className="mt-5 rounded-xl border border-red-100 bg-white/80 px-4 py-3 text-sm text-artisan-text-muted" aria-live="polite">
        {isCheckingEligibility && 'Checking your approved purchase history…'}
        {!isCheckingEligibility && isEligible && 'No approved purchases were found. You may deactivate or permanently delete this account.'}
        {!isCheckingEligibility && !isEligible && !eligibilityError && 'This account cannot be deactivated or deleted because it has an approved purchase history.'}
        {!isCheckingEligibility && eligibilityError && eligibilityError}
      </div>

      {!mode ? (
        <div className="mt-5 flex flex-col gap-3 sm:flex-row">
          <Button type="button" variant="outline" disabled={disabled} onClick={() => setMode('deactivate')} className="border-amber-300 bg-white text-amber-800 hover:bg-amber-50">
            <PauseCircle className="mr-2" size={18} /> Deactivate account
          </Button>
          <Button type="button" variant="outline" disabled={disabled} onClick={() => setMode('delete')} className="border-red-300 bg-white text-red-700 hover:bg-red-100">
            <Trash2 className="mr-2" size={18} /> Delete account
          </Button>
        </div>
      ) : (
        <div className="mt-5 rounded-2xl border border-red-200 bg-white p-5">
          <h3 className="font-nunito font-bold text-artisan-text">
            {mode === 'deactivate' ? 'Deactivate this account?' : 'Permanently delete this account?'}
          </h3>
          <p className="mt-2 text-sm leading-6 text-artisan-text-muted">
            {mode === 'deactivate'
              ? 'You will be signed out and cannot sign in again unless an administrator reactivates your account.'
              : 'This removes your profile, cart, notifications, and sign-in account. Order and support records are retained where required.'}
          </p>

          {mode === 'delete' && authMethod === 'password' && (
            <label className="mt-4 block text-sm font-semibold text-artisan-text">
              Confirm with your password
              <input type="password" value={password} onChange={(event) => setPassword(event.target.value)} className="mt-2 w-full rounded-xl border border-artisan-border px-4 py-3 text-artisan-text outline-none focus:border-red-500 focus:ring-2 focus:ring-red-100" autoComplete="current-password" />
            </label>
          )}
          {mode === 'delete' && authMethod !== 'password' && (
            <p className="mt-4 text-sm text-artisan-text-muted">You will verify through your {authMethod || 'original'} sign-in provider before deletion.</p>
          )}
          {mode === 'delete' && (
            <label className="mt-4 block text-sm font-semibold text-artisan-text">
              Type <span className="font-bold">DELETE</span> to confirm
              <input value={confirmation} onChange={(event) => setConfirmation(event.target.value)} className="mt-2 w-full rounded-xl border border-artisan-border px-4 py-3 text-artisan-text outline-none focus:border-red-500 focus:ring-2 focus:ring-red-100" autoComplete="off" />
            </label>
          )}
          {localError && <p className="mt-3 text-sm font-semibold text-red-700" role="alert">{localError}</p>}
          <div className="mt-5 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <Button type="button" variant="outline" disabled={isSubmitting} onClick={reset}>Cancel</Button>
            <Button type="button" disabled={isSubmitting} onClick={submit} className={mode === 'delete' ? 'bg-red-700 hover:bg-red-800' : 'bg-amber-700 hover:bg-amber-800'}>
              {isSubmitting && <Loader2 className="mr-2 animate-spin" size={18} />}
              {mode === 'delete' ? 'Verify and delete' : 'Deactivate account'}
            </Button>
          </div>
        </div>
      )}
        </div>
      </details>
    </section>
  );
};

export default AccountDangerZone;
