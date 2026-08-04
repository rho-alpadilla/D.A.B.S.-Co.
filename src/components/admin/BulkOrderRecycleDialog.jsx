import { useEffect, useRef, useState } from 'react';
import { Trash2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { validateLifecycleReason } from '@/lib/orders/orderLifecycle';

export default function BulkOrderRecycleDialog({ orders, isSubmitting, onClose, onConfirm }) {
  const [reason, setReason] = useState('');
  const dialogRef = useRef(null);
  const validOrders = Array.isArray(orders) ? orders : [];
  const validation = validateLifecycleReason(reason);
  const canSubmit = validOrders.length > 0 && validation.isValid && !isSubmitting;

  useEffect(() => {
    dialogRef.current?.focus();
  }, []);

  const submit = async (event) => {
    event.preventDefault();
    if (canSubmit) await onConfirm({ reason });
  };

  return (
    <div className="fixed inset-0 z-[75] flex items-center justify-center p-4" onKeyDown={(event) => event.key === 'Escape' && !isSubmitting && onClose()}>
      <button type="button" aria-label="Close recycle-bin confirmation" className="absolute inset-0 bg-[#24101F]/55" onClick={!isSubmitting ? onClose : undefined} />
      <section ref={dialogRef} role="dialog" aria-modal="true" aria-labelledby="bulk-recycle-title" tabIndex={-1} className="relative z-10 w-full max-w-lg rounded-2xl border border-artisan-primary/15 bg-[#FAF8F1] p-5 text-artisan-text shadow-2xl sm:p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-artisan-primary-wash text-artisan-primary"><Trash2 size={20} /></span>
            <div>
              <h2 id="bulk-recycle-title" className="font-nunito text-xl font-bold">Move orders to recycle bin</h2>
              <p className="mt-1 text-sm leading-6 text-artisan-text-muted">{validOrders.length} completed, cancelled, or declined order{validOrders.length === 1 ? '' : 's'} will be hidden from the active list and can be restored later.</p>
            </div>
          </div>
          <button type="button" aria-label="Close recycle-bin confirmation" onClick={onClose} disabled={isSubmitting} className="rounded-lg p-2 text-artisan-text-muted transition hover:bg-artisan-primary-wash hover:text-artisan-primary disabled:opacity-50"><X size={18} /></button>
        </div>

        <div className="mt-5 max-h-32 overflow-y-auto rounded-xl border border-artisan-primary/10 bg-white px-4 py-3 text-sm text-artisan-text-muted">
          {validOrders.map((order) => <p key={order.id}>#{String(order.id).slice(0, 8)} · {order.status || 'Unknown status'}</p>)}
        </div>

        <form className="mt-5 space-y-4" onSubmit={submit}>
          <label className="block text-sm font-semibold text-artisan-text">Reason <span className="text-red-700">(required)</span>
            <textarea value={reason} onChange={(event) => setReason(event.target.value)} maxLength={500} rows={4} autoFocus placeholder="State why these orders are being cleared." className="mt-2 w-full resize-y rounded-xl border border-artisan-border bg-white px-3 py-2.5 text-sm font-normal text-artisan-text outline-none transition placeholder:text-artisan-text-faint focus:border-artisan-primary focus:ring-2 focus:ring-artisan-primary/15" />
            <span className={`mt-1 block text-xs ${reason && !validation.isValid ? 'text-red-700' : 'text-artisan-text-muted'}`}>{reason ? validation.message || `${reason.trim().length}/500 characters` : 'At least 10 characters. This is stored in the audit trail.'}</span>
          </label>
          <div className="flex flex-col-reverse gap-3 pt-1 sm:flex-row sm:justify-end">
            <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>Cancel</Button>
            <Button type="submit" disabled={!canSubmit}>{isSubmitting ? 'Moving…' : `Move ${validOrders.length} to recycle bin`}</Button>
          </div>
        </form>
      </section>
    </div>
  );
}
