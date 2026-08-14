import { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';

const MIN_MESSAGE_LENGTH = 10;
const MAX_MESSAGE_LENGTH = 500;

const StatusCorrectionRequestDialog = ({ order, isSubmitting, onClose, onSubmit }) => {
  const [message, setMessage] = useState('');
  const textareaRef = useRef(null);
  const isValid = message.trim().length >= MIN_MESSAGE_LENGTH;

  useEffect(() => {
    textareaRef.current?.focus();
  }, []);

  const handleSubmit = (event) => {
    event.preventDefault();
    if (!isValid || isSubmitting) return;
    onSubmit(message.trim());
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
        aria-labelledby="status-correction-title"
        aria-modal="true"
        className="w-full max-w-lg rounded-2xl border border-artisan-primary/15 bg-white p-5 shadow-2xl sm:p-6"
        role="dialog"
      >
        <p className="text-xs font-bold uppercase tracking-[0.16em] text-artisan-primary">Status correction</p>
        <h2 id="status-correction-title" className="mt-2 font-playfair text-2xl font-bold text-artisan-text">
          Ask the main admin to correct this order
        </h2>
        <p className="mt-2 text-sm leading-6 text-artisan-text-muted">
          Order #{order?.id?.slice(0, 8)} is currently {String(order?.status || '').replace(/_/g, ' ')}. Explain what needs to be corrected.
        </p>

        <form className="mt-5 space-y-4" onSubmit={handleSubmit}>
          <div>
            <label className="text-sm font-semibold text-artisan-text" htmlFor="status-correction-message">
              Message <span className="text-red-700">*</span>
            </label>
            <textarea
              ref={textareaRef}
              id="status-correction-message"
              value={message}
              onChange={(event) => setMessage(event.target.value.slice(0, MAX_MESSAGE_LENGTH))}
              rows={5}
              maxLength={MAX_MESSAGE_LENGTH}
              required
              className="mt-2 w-full resize-y rounded-xl border border-artisan-border bg-white px-3 py-2.5 text-sm text-artisan-text outline-none transition focus:border-artisan-primary focus:ring-2 focus:ring-artisan-primary/15"
              placeholder="Example: I marked this as Processing before payment was confirmed. Please return it to Accepted."
            />
            <p className="mt-1 text-xs text-artisan-text-muted">
              At least {MIN_MESSAGE_LENGTH} characters. {message.trim().length}/{MAX_MESSAGE_LENGTH}
            </p>
          </div>

          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="submit" disabled={!isValid || isSubmitting}>
              {isSubmitting ? 'Sending request…' : 'Notify main admin'}
            </Button>
          </div>
        </form>
      </section>
    </div>
  );
};

export default StatusCorrectionRequestDialog;
