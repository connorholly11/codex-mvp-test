'use client';

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import type { QuestDefinition } from '@/features/quests/types';

type QuestModalProps = {
  quest: QuestDefinition | null;
  onClose: () => void;
  onComplete: (answer: string | number) => void;
};

export function QuestModal({ quest, onClose, onComplete }: QuestModalProps) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const [likertValue, setLikertValue] = useState(3);
  const [textValue, setTextValue] = useState('');
  const [choiceValue, setChoiceValue] = useState<string | null>(null);

  useEffect(() => {
    if (quest?.type === 'reflection') {
      setTextValue('');
    }
    if (quest?.type === 'likert') {
      setLikertValue(3);
    }
    if (quest?.type === 'choice') {
      setChoiceValue(null);
    }
  }, [quest]);

  if (!mounted || !quest) {
    return null;
  }

  const handleSubmit = () => {
    if (quest.payload.type === 'likert') {
      onComplete(likertValue);
    } else if (quest.payload.type === 'reflection') {
      onComplete(textValue.trim());
    } else {
      onComplete(choiceValue ?? '');
    }
  };

  const isValid = (() => {
    if (!quest) return false;
    switch (quest.payload.type) {
      case 'likert':
        return true;
      case 'reflection':
        return textValue.trim().length >= quest.payload.minLength;
      case 'choice':
        return Boolean(choiceValue);
      default:
        return false;
    }
  })();

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg rounded-2xl border border-border bg-surface px-6 py-7 shadow-2xl shadow-black/30 sm:rounded-3xl sm:px-8"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="mb-6 flex flex-col gap-2">
          <span className="text-xs font-semibold uppercase tracking-[0.2em] text-muted">
            {quest.estimatedMinutes} min quest
          </span>
          <h2 className="text-2xl font-semibold text-foreground">{quest.title}</h2>
          <p className="text-sm text-muted">{quest.description}</p>
        </div>

        {quest.payload.type === 'likert' ? (
          <div className="flex flex-col gap-4">
            <p className="text-sm text-foreground">{quest.payload.prompt}</p>
            <input
              type="range"
              min={1}
              max={5}
              value={likertValue}
              onChange={(event) => setLikertValue(Number(event.target.value))}
            />
            <div className="flex justify-between text-xs text-muted">
              <span>{quest.payload.scaleLabels[0]}</span>
              <span className="text-sm font-semibold text-foreground">{likertValue}</span>
              <span>{quest.payload.scaleLabels[1]}</span>
            </div>
          </div>
        ) : null}

        {quest.payload.type === 'reflection' ? (
          <div className="flex flex-col gap-3">
            <p className="text-sm text-foreground">{quest.payload.prompt}</p>
            <textarea
              value={textValue}
              onChange={(event) => setTextValue(event.target.value)}
              rows={5}
              className="resize-none rounded-2xl border border-border bg-surface-muted px-4 py-3 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
            />
            <span className="text-xs text-muted">
              {textValue.trim().length} / minimum {quest.payload.minLength} characters
            </span>
          </div>
        ) : null}

        {quest.payload.type === 'choice' ? (
          <div className="flex flex-col gap-4">
            <p className="text-sm text-foreground">{quest.payload.prompt}</p>
            <div className="flex flex-col gap-3">
              {quest.payload.options.map((option) => {
                const selected = choiceValue === option;
                return (
                  <button
                    key={option}
                    type="button"
                    onClick={() => setChoiceValue(option)}
                    className={`rounded-2xl border px-4 py-3 text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent ${
                      selected
                        ? 'border-transparent bg-accent text-accent-foreground'
                        : 'border-border bg-surface-muted text-foreground hover:bg-surface'
                    }`}
                  >
                    {option}
                  </button>
                );
              })}
            </div>
          </div>
        ) : null}

        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onClose}
            className="inline-flex w-full items-center justify-center rounded-full border border-border px-5 py-2.5 text-sm font-semibold text-foreground transition hover:bg-surface-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent sm:w-auto"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={!isValid}
            className="inline-flex w-full items-center justify-center rounded-full bg-accent px-5 py-2.5 text-sm font-semibold text-accent-foreground transition hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
          >
            Complete quest
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
