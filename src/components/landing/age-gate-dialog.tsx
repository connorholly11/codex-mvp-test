'use client';

import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

type AgeGateDialogProps = {
  open: boolean;
  onConfirm: () => void;
  onCancel: () => void;
};

export function AgeGateDialog({ open, onConfirm, onCancel }: AgeGateDialogProps) {
  const [isMounted, setIsMounted] = useState(false);
  const confirmButtonRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (!open) {
      return;
    }

    const handleKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onCancel();
      }
    };

    window.addEventListener('keydown', handleKey);

    const timeout = window.setTimeout(() => {
      confirmButtonRef.current?.focus();
    }, 10);

    return () => {
      window.removeEventListener('keydown', handleKey);
      window.clearTimeout(timeout);
    };
  }, [open, onCancel]);

  if (!isMounted || !open) {
    return null;
  }

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4"
      role="presentation"
      onClick={onCancel}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="age-dialog-title"
        aria-describedby="age-dialog-body"
        className="w-full max-w-lg rounded-2xl border border-border bg-surface px-6 py-7 shadow-2xl shadow-black/40 sm:rounded-3xl sm:px-8"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex flex-col gap-6">
          <div className="flex flex-col gap-3">
            <span className="text-xs font-semibold uppercase tracking-[0.2em] text-muted">
              Age disclaimer
            </span>
            <h2 id="age-dialog-title" className="text-2xl font-semibold text-foreground">
              You must be 18+ to use Purpose
            </h2>
            <p id="age-dialog-body" className="text-sm leading-6 text-muted">
              This internal prototype mirrors the production requirement that all Purpose
              users confirm they are 18 years or older. Please confirm below to continue
              into the onboarding flow. Your response is saved locally on this device.
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={onCancel}
              className="inline-flex w-full items-center justify-center rounded-full border border-border px-5 py-2.5 text-sm font-semibold text-foreground transition hover:bg-surface-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent sm:w-auto"
            >
              Go back
            </button>
            <button
              ref={confirmButtonRef}
              type="button"
              onClick={onConfirm}
              className="inline-flex w-full items-center justify-center rounded-full bg-accent px-5 py-2.5 text-sm font-semibold text-accent-foreground transition hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent sm:w-auto"
            >
              I am 18 or older
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}
