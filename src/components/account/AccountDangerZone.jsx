import React, { useMemo, useState } from 'react';
import { AlertTriangle, Loader2, PauseCircle, Trash2 } from 'lucide-react';
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
    <section className="rounded-[1.5rem] border border-red-200 bg-red-50/70 p-5 sm:p-7 md:p-8">
      <div className="flex gap-4">
        <div className="mt-0.5 flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-red-100 text-red-700">
          <AlertTriangle size={21} />
        </div>
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-red-700">Account controls</p>
          <h2 className="mt-1 font-artisan-display text-3xl font-bold text-artisan-text">Deactivate or delete</h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-artisan-text-muted">
            Accounts with an approved purchase stay available so order records can be fulfilled and supported.
          </p>
        </div>
      </div>

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
          <h3 className="font-bold text-artisan-text">
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
    </section>
  );
};

export default AccountDangerZone;
