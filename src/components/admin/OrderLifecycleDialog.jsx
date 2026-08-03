import { useEffect, useRef, useState } from 'react';
import { AlertTriangle, Archive, RotateCcw, Trash2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { getDeletionConfirmationPhrase, validateLifecycleReason } from '@/lib/orders/orderLifecycle';

const DIALOG_COPY = {
  archive: { title: 'Archive order', description: 'This removes the order from the default operational list. Historical analytics and exports will keep it.', actionLabel: 'Archive order', icon: Archive },
  restore: { title: 'Restore order', description: 'This returns the order to the default operational list without changing its original status.', actionLabel: 'Restore order', icon: RotateCcw },
  delete: { title: 'Permanently delete invalid record', description: 'This removes an already-reviewed incomplete record forever. Valid, paid, shipped, processing, completed, and refunded orders cannot use this action.', actionLabel: 'Permanently delete', icon: Trash2 },
};

export default function OrderLifecycleDialog({ action, order, isSubmitting, onClose, onConfirm }) {
  const [reason, setReason] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const dialogRef = useRef(null);
  const copy = DIALOG_COPY[action];
  const Icon = copy?.icon || AlertTriangle;
  const isDelete = action === 'delete';
  const validation = validateLifecycleReason(reason);
  const confirmationPhrase = getDeletionConfirmationPhrase(order);
  const canSubmit = validation.isValid && (!isDelete || confirmation.trim() === confirmationPhrase) && !isSubmitting;

  useEffect(() => { dialogRef.current?.focus(); }, []);
  if (!copy || !order) return null;

  const submit = async (event) => {
    event.preventDefault();
    if (canSubmit) await onConfirm({ reason, confirmation });
  };

  return (
    <div className="fixed inset-0 z-[75] flex items-center justify-center p-4" onKeyDown={(event) => event.key === 'Escape' && !isSubmitting && onClose()}>
      <button type="button" aria-label="Close confirmation dialog" className="absolute inset-0 bg-[#24101F]/55" onClick={!isSubmitting ? onClose : undefined} />
      <section ref={dialogRef} role="dialog" aria-modal="true" aria-labelledby="order-lifecycle-title" tabIndex={-1} className="relative z-10 w-full max-w-lg rounded-2xl border border-artisan-primary/15 bg-[#FAF8F1] p-5 text-artisan-text shadow-2xl sm:p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${isDelete ? 'bg-red-100 text-red-700' : 'bg-artisan-primary-wash text-artisan-primary'}`}><Icon size={20} /></span>
            <div><h2 id="order-lifecycle-title" className="font-nunito text-xl font-bold">{copy.title}</h2><p className="mt-1 text-sm leading-6 text-artisan-text-muted">{copy.description}</p></div>
          </div>
          <button type="button" aria-label="Close confirmation dialog" onClick={onClose} disabled={isSubmitting} className="rounded-lg p-2 text-artisan-text-muted transition hover:bg-artisan-primary-wash hover:text-artisan-primary disabled:opacity-50"><X size={18} /></button>
        </div>
        <div className="mt-5 rounded-xl border border-artisan-primary/10 bg-white px-4 py-3"><p className="text-xs font-bold uppercase tracking-[0.14em] text-artisan-text-muted">Order</p><p className="mt-1 font-semibold text-artisan-text">#{order.id.slice(0, 8)} · {order.status || 'Unknown status'}</p></div>
        <form className="mt-5 space-y-4" onSubmit={submit}>
          <label className="block text-sm font-semibold text-artisan-text">Reason <span className="text-red-700">(required)</span><textarea value={reason} onChange={(event) => setReason(event.target.value)} maxLength={500} rows={4} autoFocus placeholder="State why this lifecycle action is required." className="mt-2 w-full resize-y rounded-xl border border-artisan-border bg-white px-3 py-2.5 text-sm font-normal text-artisan-text outline-none transition placeholder:text-artisan-text-faint focus:border-artisan-primary focus:ring-2 focus:ring-artisan-primary/15" /><span className={`mt-1 block text-xs ${reason && !validation.isValid ? 'text-red-700' : 'text-artisan-text-muted'}`}>{reason ? validation.message || `${reason.trim().length}/500 characters` : 'At least 10 characters. This is stored in the audit trail.'}</span></label>
          {isDelete && <label className="block text-sm font-semibold text-artisan-text">Type <span className="font-mono text-red-700">{confirmationPhrase}</span> to confirm<input value={confirmation} onChange={(event) => setConfirmation(event.target.value)} autoComplete="off" spellCheck="false" className="mt-2 w-full rounded-xl border border-artisan-border bg-white px-3 py-2.5 font-mono text-sm text-artisan-text outline-none transition focus:border-red-600 focus:ring-2 focus:ring-red-100" /></label>}
          <div className="flex flex-col-reverse gap-3 pt-1 sm:flex-row sm:justify-end"><Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>Cancel</Button><Button type="submit" variant={isDelete ? 'destructive' : 'default'} disabled={!canSubmit}>{isSubmitting ? 'Saving…' : copy.actionLabel}</Button></div>
        </form>
      </section>
    </div>
  );
}
