import { useEffect, useRef, useState } from 'react';
import { BookOpen, Sparkles } from 'lucide-react';
import type { Book } from '@/types';
import { Link } from '@/lib/router';

interface Props {
  books: Book[];
  loading?: boolean;
}

/**
 * Recommended books carousel.
 * - 3 or fewer books: rendered statically, no animation.
 * - More than 3: continuously auto-scrolls vertically, showing 3 at a time.
 */
export function RecommendedBooks({ books, loading }: Props) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [paused, setPaused] = useState(false);

  const shouldScroll = books.length > 3;

  useEffect(() => {
    if (!shouldScroll || paused) return;
    const el = scrollRef.current;
    if (!el) return;

    let frame: number;
    const step = () => {
      if (!el) return;
      // Each card is roughly el.clientHeight / 3 (plus gap). Move 1px per frame.
      el.scrollTop += 0.5;
      // When we've scrolled past one card-height, move the first item to the end.
      const cardHeight = el.scrollHeight / books.length;
      if (el.scrollTop >= cardHeight) {
        el.scrollTop -= cardHeight;
        // Re-append first child to the end to create an infinite loop.
        if (el.firstChild) el.appendChild(el.removeChild(el.firstChild!));
      }
      frame = requestAnimationFrame(step);
    };
    frame = requestAnimationFrame(step);
    return () => cancelAnimationFrame(frame);
  }, [shouldScroll, paused, books.length]);

  if (loading) {
    return (
      <div className="card p-6">
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-accent-600" />
          <h2 className="font-display text-lg font-bold text-ink-900">Recommended for you</h2>
        </div>
        <div className="mt-4 space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3 rounded-xl border border-ink-100 p-3">
              <div className="h-12 w-10 animate-pulse rounded bg-ink-100" />
              <div className="flex-1 space-y-2">
                <div className="h-4 w-3/4 animate-pulse rounded bg-ink-100" />
                <div className="h-3 w-1/2 animate-pulse rounded bg-ink-100" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (books.length === 0) return null;

  return (
    <div className="card overflow-hidden p-6">
      <div className="flex items-center gap-2">
        <Sparkles className="h-5 w-5 text-accent-600" />
        <h2 className="font-display text-lg font-bold text-ink-900">Recommended for you</h2>
      </div>
      <p className="mt-1 text-sm text-ink-500">
        {shouldScroll ? 'Scrolling through picks — hover to pause.' : 'Handpicked based on your activity.'}
      </p>

      <div
        ref={scrollRef}
        className="mt-4 space-y-3"
        style={shouldScroll ? { height: 'calc(3 * 92px)', overflowY: 'hidden' } : undefined}
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
      >
        {/* Duplicate the list when scrolling so the loop is seamless */}
        {(shouldScroll ? [...books, ...books] : books).map((book, idx) => (
          <RecommendCard key={`${book.bookId}-${idx}`} book={book} />
        ))}
      </div>
    </div>
  );
}

function RecommendCard({ book }: { book: Book }) {
  return (
    <Link
      to="/search"
      className="group flex items-center gap-3 rounded-xl border border-ink-100 p-3 transition hover:border-brand-200 hover:bg-brand-50"
    >
      <div className="flex h-12 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-600">
        {book.coverUrl ? (
          <img src={book.coverUrl} alt="" className="h-12 w-10 rounded-lg object-cover" />
        ) : (
          <BookOpen className="h-5 w-5" />
        )}
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate font-semibold text-ink-900">{book.title}</p>
        <p className="truncate text-xs text-ink-500">by {book.author}</p>
        {book.category && (
          <span className="mt-1 inline-block rounded bg-accent-50 px-1.5 py-0.5 text-[10px] font-medium text-accent-700">
            {book.category}
          </span>
        )}
      </div>
    </Link>
  );
}
