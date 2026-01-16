'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  DocumentArrowDownIcon,
  PrinterIcon,
  XMarkIcon,
  CheckIcon,
  Square3Stack3DIcon,
  ArrowPathIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline';
import { DocumentTextIcon } from '@heroicons/react/24/solid';
import { Skeleton } from '@/components/ui/Skeleton';

interface CollectionCard {
  cardId: string;
  quantity: number;
}

interface CardData {
  id: string;
  name: string;
  number: string;
  set: {
    id: string;
    name: string;
  };
}

interface SetGroup {
  setId: string;
  setName: string;
  cards: Array<{
    cardId: string;
    name: string;
    number: string;
    quantity: number;
  }>;
}

interface ExportChecklistButtonProps {
  collection: CollectionCard[];
  stats: {
    totalCards: number;
    uniqueCards: number;
    setsStarted: number;
  };
  profileName?: string;
}

export function ExportChecklistButton({
  collection,
  stats,
  profileName = 'My Collection',
}: ExportChecklistButtonProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Don't show button if no cards
  if (collection.length === 0) {
    return null;
  }

  return (
    <>
      <button
        onClick={() => setIsModalOpen(true)}
        className="inline-flex items-center gap-2 rounded-lg bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm transition hover:bg-gray-50 hover:text-kid-primary"
        aria-label="Export collection as printable checklist"
      >
        <DocumentArrowDownIcon className="h-5 w-5" />
        Export Checklist
      </button>

      {isModalOpen && (
        <ExportChecklistModal
          collection={collection}
          stats={stats}
          profileName={profileName}
          onClose={() => setIsModalOpen(false)}
        />
      )}
    </>
  );
}

interface ExportChecklistModalProps {
  collection: CollectionCard[];
  stats: {
    totalCards: number;
    uniqueCards: number;
    setsStarted: number;
  };
  profileName?: string;
  onClose: () => void;
}

function ExportChecklistModal({
  collection,
  stats,
  profileName,
  onClose,
}: ExportChecklistModalProps) {
  const [cardData, setCardData] = useState<Map<string, CardData>>(new Map());
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [includeQuantities, setIncludeQuantities] = useState(true);
  const [includeEmptyCheckboxes, setIncludeEmptyCheckboxes] = useState(true);

  // Fetch card data
  const fetchCards = useCallback(async () => {
    if (collection.length === 0) {
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      const cardIds = collection.map((c) => c.cardId);

      const response = await fetch('/api/cards', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cardIds }),
      });

      if (!response.ok) {
        throw new Error('Failed to fetch card data');
      }

      const cards: CardData[] = await response.json();
      const cardMap = new Map<string, CardData>();
      cards.forEach((card) => cardMap.set(card.id, card));
      setCardData(cardMap);
    } catch {
      setError("We couldn't load your card data. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }, [collection]);

  useEffect(() => {
    fetchCards();
  }, [fetchCards]);

  // Group cards by set
  const setGroups: SetGroup[] = [];
  const setMap = new Map<string, SetGroup>();

  collection.forEach((item) => {
    const card = cardData.get(item.cardId);
    if (card) {
      const setId = card.set.id;
      const setName = card.set.name;

      if (!setMap.has(setId)) {
        setMap.set(setId, {
          setId,
          setName,
          cards: [],
        });
      }

      setMap.get(setId)!.cards.push({
        cardId: card.id,
        name: card.name,
        number: card.number,
        quantity: item.quantity,
      });
    }
  });

  // Convert map to array and sort by set name
  setMap.forEach((group) => {
    group.cards.sort((a, b) => {
      const numA = parseInt(a.number) || 0;
      const numB = parseInt(b.number) || 0;
      return numA - numB;
    });
    setGroups.push(group);
  });

  setGroups.sort((a, b) => a.setName.localeCompare(b.setName));

  const handlePrint = () => {
    window.print();
  };

  // Close on escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 print:bg-white print:p-0"
      role="dialog"
      aria-modal="true"
      aria-labelledby="export-modal-title"
    >
      {/* Backdrop */}
      <div className="absolute inset-0 print:hidden" onClick={onClose} aria-hidden="true" />

      {/* Modal */}
      <div className="relative flex max-h-[90vh] w-full max-w-4xl flex-col rounded-2xl bg-white shadow-xl print:max-h-none print:max-w-none print:rounded-none print:shadow-none">
        {/* Header - hidden in print */}
        <div className="flex items-center justify-between border-b border-gray-200 p-4 print:hidden">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-kid-primary to-kid-secondary">
              <DocumentTextIcon className="h-5 w-5 text-white" aria-hidden="true" />
            </div>
            <div>
              <h2 id="export-modal-title" className="text-lg font-bold text-gray-800">
                Export Collection Checklist
              </h2>
              <p className="text-sm text-gray-500">
                Preview and print your collection as a checklist
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-2 text-gray-400 transition hover:bg-gray-100 hover:text-gray-600"
            aria-label="Close export modal"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        {/* Options - hidden in print */}
        <div className="flex flex-wrap items-center gap-4 border-b border-gray-200 bg-gray-50 px-4 py-3 print:hidden">
          <label className="flex cursor-pointer items-center gap-2">
            <input
              type="checkbox"
              checked={includeQuantities}
              onChange={(e) => setIncludeQuantities(e.target.checked)}
              className="h-4 w-4 rounded border-gray-300 text-kid-primary focus:ring-kid-primary"
            />
            <span className="text-sm text-gray-700">Show quantities</span>
          </label>
          <label className="flex cursor-pointer items-center gap-2">
            <input
              type="checkbox"
              checked={includeEmptyCheckboxes}
              onChange={(e) => setIncludeEmptyCheckboxes(e.target.checked)}
              className="h-4 w-4 rounded border-gray-300 text-kid-primary focus:ring-kid-primary"
            />
            <span className="text-sm text-gray-700">Include checkboxes</span>
          </label>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-4 print:overflow-visible print:p-0">
          {isLoading ? (
            <div className="mx-auto max-w-2xl space-y-4 print:hidden">
              <Skeleton className="h-8 w-48" />
              <Skeleton className="h-4 w-64" />
              <div className="space-y-2">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Skeleton key={i} className="h-6 w-full" />
                ))}
              </div>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center py-12 print:hidden">
              <ExclamationTriangleIcon className="mb-4 h-12 w-12 text-amber-500" />
              <p className="mb-4 text-gray-600">{error}</p>
              <button
                onClick={fetchCards}
                className="inline-flex items-center gap-2 rounded-lg bg-kid-primary px-4 py-2 text-sm font-medium text-white transition hover:bg-kid-primary/90"
              >
                <ArrowPathIcon className="h-4 w-4" />
                Try Again
              </button>
            </div>
          ) : (
            <div className="mx-auto max-w-2xl rounded-lg border border-gray-200 bg-white p-6 shadow-sm print:mx-0 print:max-w-none print:rounded-none print:border-none print:p-8 print:shadow-none">
              <ChecklistContent
                profileName={profileName}
                stats={stats}
                setGroups={setGroups}
                includeQuantities={includeQuantities}
                includeEmptyCheckboxes={includeEmptyCheckboxes}
              />
            </div>
          )}
        </div>

        {/* Footer - hidden in print */}
        <div className="flex items-center justify-between border-t border-gray-200 bg-gray-50 p-4 print:hidden">
          <p className="text-sm text-gray-500">
            <Square3Stack3DIcon className="mr-1 inline h-4 w-4" aria-hidden="true" />
            {stats.uniqueCards} cards across {stats.setsStarted} sets
          </p>
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="rounded-lg px-4 py-2 text-sm font-medium text-gray-600 transition hover:bg-gray-100"
            >
              Cancel
            </button>
            <button
              onClick={handlePrint}
              disabled={isLoading || !!error}
              className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-kid-primary to-kid-secondary px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
              aria-label="Print or save as PDF"
            >
              <PrinterIcon className="h-5 w-5" />
              Print / Save PDF
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

interface ChecklistContentProps {
  profileName?: string;
  stats: {
    totalCards: number;
    uniqueCards: number;
    setsStarted: number;
  };
  setGroups: SetGroup[];
  includeQuantities: boolean;
  includeEmptyCheckboxes: boolean;
}

function ChecklistContent({
  profileName,
  stats,
  setGroups,
  includeQuantities,
  includeEmptyCheckboxes,
}: ChecklistContentProps) {
  const currentDate = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <div className="checklist-content">
      {/* Header */}
      <div className="mb-6 border-b border-gray-200 pb-4 print:mb-4 print:pb-2">
        <h1 className="text-2xl font-bold text-gray-800 print:text-xl">{profileName}</h1>
        <p className="mt-1 text-sm text-gray-500">
          Collection Checklist &bull; Generated {currentDate}
        </p>
        <div className="mt-2 flex gap-4 text-sm text-gray-600">
          <span>
            <strong>{stats.totalCards}</strong> total cards
          </span>
          <span>
            <strong>{stats.uniqueCards}</strong> unique
          </span>
          <span>
            <strong>{stats.setsStarted}</strong> sets
          </span>
        </div>
      </div>

      {/* Sets */}
      {setGroups.length === 0 ? (
        <div className="py-8 text-center text-gray-500">
          <Square3Stack3DIcon className="mx-auto mb-2 h-12 w-12 text-gray-300" aria-hidden="true" />
          <p>No cards in collection</p>
        </div>
      ) : (
        <div className="space-y-6 print:space-y-4">
          {setGroups.map((group) => (
            <div key={group.setId} className="break-inside-avoid">
              {/* Set header */}
              <h2 className="mb-2 border-b border-gray-100 pb-1 text-lg font-semibold text-gray-700 print:text-base">
                {group.setName}
                <span className="ml-2 text-sm font-normal text-gray-400">
                  ({group.cards.length} card{group.cards.length !== 1 ? 's' : ''})
                </span>
              </h2>

              {/* Cards list */}
              <ul className="grid grid-cols-1 gap-1 text-sm sm:grid-cols-2 print:grid-cols-2 print:gap-x-4 print:text-xs">
                {group.cards.map((card) => (
                  <li
                    key={card.cardId}
                    className="flex items-center gap-2 rounded px-2 py-1 print:px-0 print:py-0.5"
                  >
                    {includeEmptyCheckboxes && (
                      <span
                        className="flex h-4 w-4 flex-shrink-0 items-center justify-center rounded border border-gray-300 print:h-3 print:w-3"
                        aria-hidden="true"
                      >
                        <CheckIcon className="h-3 w-3 text-kid-primary print:h-2 print:w-2" />
                      </span>
                    )}
                    <span className="flex-shrink-0 text-gray-400">#{card.number}</span>
                    <span className="flex-1 truncate text-gray-700">{card.name}</span>
                    {includeQuantities && card.quantity > 1 && (
                      <span className="flex-shrink-0 rounded bg-gray-100 px-1.5 py-0.5 text-xs font-medium text-gray-600 print:bg-transparent print:text-gray-500">
                        x{card.quantity}
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}

      {/* Footer */}
      <div className="mt-6 border-t border-gray-200 pt-4 text-center text-xs text-gray-400 print:mt-4 print:pt-2">
        Generated by KidCollect &bull; pokemon.kidcollect.app
      </div>
    </div>
  );
}
