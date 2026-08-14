import { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';

const MIN_MESSAGE_LENGTH = 10;
const MAX_MESSAGE_LENGTH = 500;

const ResolveStatusCorrectionDialog = ({
  order,
  statusOptions,
  formatStatusOptionLabel,
  isSubmitting,
  onClose,
  onSubmit,
}) => {
  const [nextStatus, setNextStatus] = useState(order?.status || '');
  const [customerMessage, setCustomerMessage] = useState('');
  const textareaRef = useRef(null);
  const isValid = statusOptions.includes(nextStatus) && customerMessage.trim().length >= MIN_MESSAGE_LENGTH;

  useEffect(() => {
    textareaRef.current?.focus();
  }, []);

  const handleSubmit = (event) => {
    event.preventDefault();
    if (!isValid || isSubmitting) return;
    onSubmit({ nextStatus, customerMessage: customerMessage.trim() });
  };

  return (
    <div
      className="fixed inset-0 z-[90] flex items-center justify-center bg-[#01243A]/45 p-4"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !isSubmitting) onClose();
      }}
    >
      <section
        aria-labelledby="resolve-status-correction-title"
        aria-modal="true"
        className="w-full max-w-lg rounded-2xl border border-artisan-primary/15 bg-white p-5 shadow-2xl sm:p-6"
        role="dialog"
      >
        <p className="text-xs font-bold uppercase tracking-[0.16em] text-artisan-primary">Special attention</p>
        <h2 id="resolve-status-correction-title" className="mt-2 font-playfair text-2xl font-bold text-artisan-text">
          Resolve correction request
        </h2>
        <p className="mt-2 text-sm leading-6 text-artisan-text-muted">
          The sub-admin wrote: &ldquo;{order?.statusCorrectionRequest?.message || 'No message provided.'}&rdquo;
        </p>

        <form className="mt-5 space-y-4" onSubmit={handleSubmit}>
          <div>
            <label className="text-sm font-semibold text-artisan-text" htmlFor="corrected-order-status">
              Corrected status
            </label>
            <select
              id="corrected-order-status"
              value={nextStatus}
              onChange={(event) => setNextStatus(event.target.value)}
              className="mt-2 w-full rounded-xl border border-artisan-border bg-white px-3 py-2.5 text-sm text-artisan-text outline-none focus:border-artisan-primary focus:ring-2 focus:ring-artisan-primary/15"
            >
              {statusOptions.map((status) => (
                <option key={status} value={status}>{formatStatusOptionLabel(status)}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-sm font-semibold text-artisan-text" htmlFor="customer-correction-message">
              Message for customer <span className="text-red-700">*</span>
            </label>
            <textarea
              ref={textareaRef}
              id="customer-correction-message"
              value={customerMessage}
              onChange={(event) => setCustomerMessage(event.target.value.slice(0, MAX_MESSAGE_LENGTH))}
              rows={5}
              maxLength={MAX_MESSAGE_LENGTH}
              required
              className="mt-2 w-full resize-y rounded-xl border border-artisan-border bg-white px-3 py-2.5 text-sm text-artisan-text outline-none transition focus:border-artisan-primary focus:ring-2 focus:ring-artisan-primary/15"
              placeholder="Explain the updated order status to the customer."
            />
            <p className="mt-1 text-xs text-artisan-text-muted">
              At least {MIN_MESSAGE_LENGTH} characters. {customerMessage.trim().length}/{MAX_MESSAGE_LENGTH}
            </p>
          </div>

          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="submit" disabled={!isValid || isSubmitting}>
              {isSubmitting ? 'Resolving...' : 'Resolve and notify'}
            </Button>
          </div>
        </form>
      </section>
    </div>
  );
};

export default ResolveStatusCorrectionDialog;
