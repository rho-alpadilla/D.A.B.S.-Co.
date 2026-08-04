import { useEffect, useMemo, useRef, useState } from 'react';
import { AlertTriangle, Trash2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { validateLifecycleReason } from '@/lib/orders/orderLifecycle';

export default function BulkPermanentOrderDeleteDialog({ orders, source = 'recycle-bin', isSubmitting, onClose, onConfirm }) {
  const [reason, setReason] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const dialogRef = useRef(null);
  const validOrders = Array.isArray(orders) ? orders : [];
  const isRecycleBin = source === 'recycle-bin';
  const confirmationPhrase = useMemo(() => `DELETE ${validOrders.length} ORDERS`, [validOrders.length]);
  const validation = validateLifecycleReason(reason);
  const canSubmit = validOrders.length > 0 && validation.isValid && confirmation.trim() === confirmationPhrase && !isSubmitting;

  useEffect(() => {
    dialogRef.current?.focus();
  }, []);

  const submit = async (event) => {
    event.preventDefault();
    if (canSubmit) await onConfirm({ reason });
  };

  return (
    <div className="fixed inset-0 z-[75] flex items-center justify-center p-4" onKeyDown={(event) => event.key === 'Escape' && !isSubmitting && onClose()}>
      <button type="button" aria-label="Close permanent-delete confirmation" className="absolute inset-0 bg-[#24101F]/60" onClick={!isSubmitting ? onClose : undefined} />
      <section ref={dialogRef} role="dialog" aria-modal="true" aria-labelledby="bulk-permanent-delete-title" tabIndex={-1} className="relative z-10 w-full max-w-lg rounded-2xl border border-red-200 bg-[#FAF8F1] p-5 text-artisan-text shadow-2xl sm:p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-red-100 text-red-700"><AlertTriangle size={20} /></span>
            <div>
              <h2 id="bulk-permanent-delete-title" className="font-nunito text-xl font-bold">Permanently delete orders</h2>
              <p className="mt-1 text-sm leading-6 text-artisan-text-muted">This will permanently remove {validOrders.length} {isRecycleBin ? 'recycled ' : ''}order{validOrders.length === 1 ? '' : 's'}. They cannot be restored.</p>
            </div>
          </div>
          <button type="button" aria-label="Close permanent-delete confirmation" onClick={onClose} disabled={isSubmitting} className="rounded-lg p-2 text-artisan-text-muted transition hover:bg-red-50 hover:text-red-700 disabled:opacity-50"><X size={18} /></button>
        </div>

        <div className="mt-5 max-h-32 overflow-y-auto rounded-xl border border-red-100 bg-white px-4 py-3 text-sm text-artisan-text-muted">
          {validOrders.map((order) => <p key={order.id}>#{String(order.id).slice(0, 8)} · {order.status || 'Unknown status'}</p>)}
        </div>

        <form className="mt-5 space-y-4" onSubmit={submit}>
          <label className="block text-sm font-semibold text-artisan-text">Reason <span className="text-red-700">(required)</span>
            <textarea value={reason} onChange={(event) => setReason(event.target.value)} maxLength={500} rows={4} autoFocus placeholder="State why these orders must be permanently deleted." className="mt-2 w-full resize-y rounded-xl border border-artisan-border bg-white px-3 py-2.5 text-sm font-normal text-artisan-text outline-none transition placeholder:text-artisan-text-faint focus:border-red-600 focus:ring-2 focus:ring-red-100" />
            <span className={`mt-1 block text-xs ${reason && !validation.isValid ? 'text-red-700' : 'text-artisan-text-muted'}`}>{reason ? validation.message || `${reason.trim().length}/500 characters` : 'At least 10 characters. This is stored in the audit trail.'}</span>
          </label>
          <label className="block text-sm font-semibold text-artisan-text">Type <span className="font-mono text-red-700">{confirmationPhrase}</span> to confirm
            <input value={confirmation} onChange={(event) => setConfirmation(event.target.value)} autoComplete="off" spellCheck="false" className="mt-2 w-full rounded-xl border border-artisan-border bg-white px-3 py-2.5 font-mono text-sm text-artisan-text outline-none transition focus:border-red-600 focus:ring-2 focus:ring-red-100" />
          </label>
          <div className="flex flex-col-reverse gap-3 pt-1 sm:flex-row sm:justify-end">
            <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>Cancel</Button>
            <Button type="submit" variant="destructive" disabled={!canSubmit}><Trash2 className="mr-2" size={16} />{isSubmitting ? 'Deleting…' : `Delete ${validOrders.length} permanently`}</Button>
          </div>
        </form>
      </section>
    </div>
  );
}
