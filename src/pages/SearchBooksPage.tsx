import { useEffect, useMemo, useState } from 'react';
import { AlertTriangle, BookMarked, BookCopy as BookCopyIcon, Filter, Library, Loader2, Pencil, Save, Search, ShieldCheck, Sparkles } from 'lucide-react';
import { api, ApiError } from '@/lib/api';
import { formatINR } from '@/lib/format';
import type { Book, BookCopy as BookCopyType, BookCopyUpdate, BookUpdateRequest, FinePolicy } from '@/types';
import { Badge, EmptyState, ErrorBanner, Modal, Skeleton } from '@/components/ui';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';

function num(v: unknown): number {
  if (typeof v === 'number') return v;
  if (typeof v === 'string' && !isNaN(Number(v))) return Number(v);
  return 0;
}

function policyPoints(p: FinePolicy): string[] {
  const text = p.description || (p as Record<string, unknown>).details as string || p.title || p.name as string || '';
  if (!text) return [];
  const parts = text.split(/(?=(?:^|\s)\d+[.)]\s)/i).map((s) => s.trim()).filter(Boolean);
  if (parts.length > 1) return parts;
  return text ? [text] : [];
}

export function SearchBooksPage() {
  const { toast } = useToast();
  const { isAdmin } = useAuth();
  const [books, setBooks] = useState<Book[]>([]);
  const [policies, setPolicies] = useState<FinePolicy[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('all');
  const [busyId, setBusyId] = useState<string | null>(null);
  const [confirmBook, setConfirmBook] = useState<{ book: Book; action: 'borrow' | 'reserve' } | null>(null);
  const [editBook, setEditBook] = useState<Book | null>(null);
  const [editForm, setEditForm] = useState<BookUpdateRequest | null>(null);
  const [savingEdit, setSavingEdit] = useState(false);
  const [copiesBook, setCopiesBook] = useState<Book | null>(null);
  const [copyEdits, setCopyEdits] = useState<Record<string, BookCopyUpdate>>({});
  const [savingCopies, setSavingCopies] = useState(false);

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const [data, pol] = await Promise.all([
        api.searchBooks(),
        api.finePolicies().catch(() => [] as FinePolicy[]),
      ]);
      setBooks(data);
      setPolicies(pol);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to load books.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const categories = useMemo(() => {
    const set = new Set<string>();
    books.forEach((b) => b.category && set.add(b.category));
    return ['all', ...Array.from(set).sort()];
  }, [books]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return books.filter((b) => {
      const matchesQ =
        !q ||
        b.title?.toLowerCase().includes(q) ||
        b.author?.toLowerCase().includes(q) ||
        b.isbn?.toLowerCase().includes(q);
      const matchesCat = category === 'all' || b.category === category;
      return matchesQ && matchesCat;
    });
  }, [books, query, category]);

  const getAvailable = (b: Book) => {
    if (typeof b.availableCopies === 'number') return b.availableCopies;
    if (typeof b.available === 'number') return b.available;
    return 0;
  };
  const getReserved = (b: Book) => num(b.reservedCopies);
  const getBorrowed = (b: Book) => num(b.borrowedCopies);
  const getTotal = (b: Book) => {
    if (typeof b.totalCopies === 'number') return b.totalCopies;
    if (typeof b.quantity === 'number') return b.quantity;
    return getAvailable(b) + getReserved(b) + getBorrowed(b);
  };

  const doBorrow = async (book: Book) => {
    setBusyId(book.bookId);
    try {
      await api.borrowBook({ bookId: book.bookId });
      toast(`"${book.title}" borrowed. Check your borrowed books.`, 'success');
      setConfirmBook(null);
      load();
    } catch (err) {
      toast(err instanceof ApiError ? err.message : 'Could not borrow this book.', 'error');
    } finally {
      setBusyId(null);
    }
  };

  const doReserve = async (book: Book) => {
    setBusyId(book.bookId);
    try {
      await api.joinReservation({ bookId: book.bookId });
      toast(`You've joined the reservation queue for "${book.title}".`, 'success');
      setConfirmBook(null);
      load();
    } catch (err) {
      toast(err instanceof ApiError ? err.message : 'Could not join the queue.', 'error');
    } finally {
      setBusyId(null);
    }
  };

  const openEdit = (book: Book) => {
    setEditBook(book);
    setEditForm({
      bookId: book.bookId,
      title: book.title,
      author: book.author,
      publisher: book.publisher,
      isbn: book.isbn,
      edition: book.edition,
      category: book.category,
      description: book.description,
      price: book.price,
      quantity: book.quantity,
      copyIds: book.copies?.map((c) => c.copyId),
      language: book.language,
      purchaseDate: book.purchaseDate,
      shelfLocation: book.shelfLocation,
    });
  };

  const setField = (field: keyof BookUpdateRequest, value: unknown) => {
    setEditForm((f) => (f ? { ...f, [field]: value } : f));
  };

  const saveEdit = async () => {
    if (!editForm) return;
    setSavingEdit(true);
    try {
      await api.updateBook(editForm);
      toast(`"${editForm.title}" updated.`, 'success');
      setEditBook(null);
      setEditForm(null);
      load();
    } catch (err) {
      toast(err instanceof ApiError ? err.message : 'Could not update book.', 'error');
    } finally {
      setSavingEdit(false);
    }
  };

  const openCopies = (book: Book) => {
    setCopiesBook(book);
    const edits: Record<string, BookCopyUpdate> = {};
    book.copies?.forEach((c) => {
      edits[c.copyId] = {
        copyId: c.copyId,
        purchaseDate: c.purchaseDate,
        language: c.language,
        shelfLocation: c.shelfLocation,
        status: c.status as BookCopyUpdate['status'] | undefined,
      };
    });
    setCopyEdits(edits);
  };

  const setCopyField = (copyId: string, field: keyof BookCopyUpdate, value: unknown) => {
    setCopyEdits((edits) => ({
      ...edits,
      [copyId]: { ...(edits[copyId] ?? { copyId }), [field]: value },
    }));
  };

  const saveCopies = async () => {
    if (!copiesBook || !copiesBook.copies) return;
    const payload = copiesBook.copies
      .map((c) => copyEdits[c.copyId])
      .filter((c): c is BookCopyUpdate => !!c);
    if (payload.length === 0) return;
    setSavingCopies(true);
    try {
      await api.updateBookCopies(payload);
      toast('Book copies updated.', 'success');
      setCopiesBook(null);
      setCopyEdits({});
      load();
    } catch (err) {
      toast(err instanceof ApiError ? err.message : 'Could not update book copies.', 'error');
    } finally {
      setSavingCopies(false);
    }
  };

  const allPoints = useMemo(() => policies.flatMap(policyPoints), [policies]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-extrabold text-ink-900">Browse the catalog</h1>
        <p className="mt-1 text-sm text-ink-500">
          Search {books.length} books, borrow instantly, or join the reservation queue.
        </p>
      </div>

      <div className="card flex flex-col gap-3 p-4 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400" />
          <input
            className="input pl-10"
            placeholder="Search by title, author, or ISBN…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-ink-400" />
          <select
            className="input w-auto"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          >
            {categories.map((c) => (
              <option key={c} value={c}>
                {c === 'all' ? 'All categories' : c}
              </option>
            ))}
          </select>
        </div>
      </div>

      {error && <ErrorBanner message={error} onRetry={load} />}

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="card p-5">
              <div className="flex gap-4">
                <Skeleton className="h-28 w-20 flex-shrink-0" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-5 w-2/3" />
                  <Skeleton className="h-4 w-1/3" />
                  <Skeleton className="mt-3 h-16 w-full" />
                  <Skeleton className="h-9 w-40" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={<Library className="h-7 w-7" />}
          title="No books found"
          description="Try a different search term or category."
        />
      ) : (
        <div className="space-y-4">
          {filtered.map((book) => {
            const available = getAvailable(book);
            const reserved = getReserved(book);
            const borrowed = getBorrowed(book);
            const total = getTotal(book);
            const canBorrow = available > 0;

            return (
              <article
                key={book.bookId}
                className="card overflow-hidden transition hover:shadow-card-hover"
              >
                <div className="flex flex-col sm:flex-row">
                  {/* Cover */}
                  <div className="relative h-32 w-full flex-shrink-0 bg-gradient-to-br from-brand-50 to-ink-100 sm:h-auto sm:w-36">
                    {book.coverUrl ? (
                      <img
                        src={book.coverUrl}
                        alt={book.title}
                        className="h-full w-full object-cover"
                        onError={(e) => {
                          (e.currentTarget as HTMLImageElement).style.display = 'none';
                        }}
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center">
                        <Library className="h-10 w-10 text-brand-300" />
                      </div>
                    )}
                  </div>

                  {/* Body */}
                  <div className="flex flex-1 flex-col p-5">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div>
                        <h3 className="font-display text-lg font-bold leading-snug text-ink-900">
                          {book.title}
                        </h3>
                        <p className="text-sm text-ink-500">by {book.author}</p>
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        {book.category && <Badge tone="neutral">{book.category}</Badge>}
                        <Badge tone={canBorrow ? 'success' : 'warning'}>
                          {canBorrow ? `${available} available` : 'Reserved out'}
                        </Badge>
                      </div>
                    </div>

                    <div className="mt-4 grid grid-cols-2 gap-x-6 gap-y-2 text-sm sm:grid-cols-3 lg:grid-cols-4">
                      <Detail label="ISBN" value={book.isbn || '—'} />
                      <Detail label="Edition" value={book.edition || '—'} />
                      <Detail label="Quantity" value={String(total)} />
                      <Detail label="Available Copies" value={String(available)} tone="text-success-600" />
                      <Detail label="Reserved Copies" value={String(reserved)} tone="text-accent-700" />
                      <Detail label="Borrowed Copies" value={String(borrowed)} tone="text-warning-600" />
                      {book.price != null && <Detail label="Price" value={formatINR(book.price)} />}
                      {book.shelfLocation && <Detail label="Shelf" value={book.shelfLocation} />}
                    </div>

                    {/* Single button: borrow OR reserve */}
                    <div className="mt-5 flex flex-wrap gap-3">
                      {canBorrow ? (
                        <button
                          onClick={() => setConfirmBook({ book, action: 'borrow' })}
                          className="btn-primary"
                          disabled={busyId === book.bookId}
                        >
                          {busyId === book.bookId ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <BookMarked className="h-4 w-4" />
                          )}
                          Borrow Book
                        </button>
                      ) : (
                        <button
                          onClick={() => setConfirmBook({ book, action: 'reserve' })}
                          className="btn-secondary"
                          disabled={busyId === book.bookId}
                        >
                          {busyId === book.bookId ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Sparkles className="h-4 w-4" />
                          )}
                          Join Reservation
                        </button>
                      )}
                      {isAdmin && (
                        <button onClick={() => openEdit(book)} className="btn-ghost">
                          <Pencil className="h-4 w-4" /> Update Book
                        </button>
                      )}
                      {isAdmin && book.copies && book.copies.length > 0 && (
                        <button onClick={() => openCopies(book)} className="btn-ghost">
                          <BookCopyIcon className="h-4 w-4" /> Book Copy Details
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}

      {/* Confirmation modal for borrow / reserve */}
      <Modal
        open={!!confirmBook}
        onClose={() => setConfirmBook(null)}
        title={confirmBook?.action === 'borrow' ? 'Confirm borrow' : 'Confirm reservation'}
        size="md"
        footer={
          <>
            <button className="btn-secondary" onClick={() => setConfirmBook(null)} disabled={!!busyId}>
              Cancel
            </button>
            <button
              className="btn-primary"
              onClick={() => {
                if (!confirmBook) return;
                if (confirmBook.action === 'borrow') doBorrow(confirmBook.book);
                else doReserve(confirmBook.book);
              }}
              disabled={!!busyId}
            >
              {busyId ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldCheck className="h-4 w-4" />}
              I agree, continue
            </button>
          </>
        }
      >
        {confirmBook && (
          <div className="space-y-4">
            <div className="flex items-start gap-3 rounded-xl border border-warning-200 bg-warning-50 p-4">
              <AlertTriangle className="mt-0.5 h-5 w-5 flex-shrink-0 text-warning-600" />
              <div>
                <p className="text-sm font-semibold text-ink-900">
                  Please review the fines & penalties policy before proceeding.
                </p>
                <p className="mt-1 text-xs text-ink-600">
                  {confirmBook.action === 'borrow'
                    ? 'By borrowing this book you agree to return it by the due date. Overdue returns are subject to the fines below.'
                    : 'By joining the reservation queue you agree to collect the book when it becomes available, or you may lose your spot.'}
                </p>
              </div>
            </div>

            <div className="rounded-xl bg-ink-50 p-4">
              <p className="font-semibold text-ink-900">{confirmBook.book.title}</p>
              <p className="text-sm text-ink-500">by {confirmBook.book.author}</p>
            </div>

            {allPoints.length > 0 ? (
              <div className="rounded-xl border border-danger-200 bg-danger-50 p-4">
                <p className="mb-2 flex items-center gap-2 text-sm font-bold text-danger-700">
                  <AlertTriangle className="h-4 w-4" /> Fines & penalties policy
                </p>
                <ol className="list-decimal space-y-1 pl-5 text-xs text-ink-700">
                  {allPoints.map((pt, idx) => (
                    <li key={idx}>{pt}</li>
                  ))}
                </ol>
              </div>
            ) : (
              <p className="text-xs text-ink-400">
                Please review the fines & penalties section on your dashboard before continuing.
              </p>
            )}
          </div>
        )}
      </Modal>

      {/* Update book modal */}
      <Modal
        open={!!editBook}
        onClose={() => {
          setEditBook(null);
          setEditForm(null);
        }}
        title={editBook ? `Update "${editBook.title}"` : 'Update book'}
        size="lg"
        footer={
          <>
            <button
              className="btn-secondary"
              onClick={() => {
                setEditBook(null);
                setEditForm(null);
              }}
              disabled={savingEdit}
            >
              Cancel
            </button>
            <button className="btn-primary" onClick={saveEdit} disabled={savingEdit || !editForm}>
              {savingEdit ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              Save changes
            </button>
          </>
        }
      >
        {editForm && (
          <div className="space-y-5">
            <div>
              <h3 className="mb-3 font-display text-sm font-bold uppercase tracking-wide text-ink-400">
                Book details
              </h3>
              <div className="grid gap-4 sm:grid-cols-2">
                <EditField label="Title">
                  <input className="input" value={editForm.title ?? ''} onChange={(e) => setField('title', e.target.value)} />
                </EditField>
                <EditField label="Author">
                  <input className="input" value={editForm.author ?? ''} onChange={(e) => setField('author', e.target.value)} />
                </EditField>
                <EditField label="Publisher">
                  <input className="input" value={editForm.publisher ?? ''} onChange={(e) => setField('publisher', e.target.value)} />
                </EditField>
                <EditField label="ISBN">
                  <input className="input" value={editForm.isbn ?? ''} onChange={(e) => setField('isbn', e.target.value)} />
                </EditField>
                <EditField label="Edition">
                  <input className="input" value={editForm.edition ?? ''} onChange={(e) => setField('edition', e.target.value)} />
                </EditField>
                <EditField label="Category">
                  <input className="input" value={editForm.category ?? ''} onChange={(e) => setField('category', e.target.value)} />
                </EditField>
                <EditField label="Price (₹)">
                  <input type="number" min={0} step="0.01" className="input" value={editForm.price ?? 0} onChange={(e) => setField('price', Number(e.target.value))} />
                </EditField>
                <EditField label="Quantity">
                  <input
                    type="number"
                    min={0}
                    step="1"
                    className="input"
                    value={editForm.quantity ?? 0}
                    onChange={(e) => setField('quantity', Math.max(0, Math.floor(Number(e.target.value) || 0)))}
                  />
                </EditField>
                <EditField label="Purchase date">
                  <input type="date" className="input" value={editForm.purchaseDate ?? ''} onChange={(e) => setField('purchaseDate', e.target.value)} />
                </EditField>
                <EditField label="Description">
                  <textarea className="input min-h-[70px]" value={editForm.description ?? ''} onChange={(e) => setField('description', e.target.value)} />
                </EditField>
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* Book copy details modal — editable via Book Copy Update API */}
      <Modal
        open={!!copiesBook}
        onClose={() => {
          setCopiesBook(null);
          setCopyEdits({});
        }}
        title={copiesBook ? `Copies of "${copiesBook.title}"` : 'Book copies'}
        size="lg"
        footer={
          <>
            <button
              className="btn-secondary"
              onClick={() => {
                setCopiesBook(null);
                setCopyEdits({});
              }}
              disabled={savingCopies}
            >
              Close
            </button>
            <button className="btn-primary" onClick={saveCopies} disabled={savingCopies}>
              {savingCopies ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              Save copies
            </button>
          </>
        }
      >
        {copiesBook && (
          <div className="space-y-3">
            {copiesBook.copies && copiesBook.copies.length > 0 ? (
              copiesBook.copies.map((copy: BookCopyType, idx) => {
                const edit = copyEdits[copy.copyId];
                return (
                  <div key={copy.copyId || idx} className="rounded-xl border border-ink-100 bg-ink-50 p-4">
                    <div className="mb-3 flex items-center gap-2">
                      <span className="flex h-6 w-6 items-center justify-center rounded-md bg-brand-100 text-xs font-bold text-brand-700">
                        {idx + 1}
                      </span>
                      <span className="text-sm font-semibold text-ink-800">Copy {idx + 1}</span>
                      {copy.status && (
                        <Badge tone={copy.available ? 'success' : 'warning'}>{copy.status}</Badge>
                      )}
                    </div>
                    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                      {/* Read-only: Book ID, Copy ID, Status */}
                      <ReadOnlyField label="Book ID" value={copy.bookId || copiesBook.bookId || '—'} />
                      <ReadOnlyField label="Copy ID" value={copy.copyId || '—'} />
                      <ReadOnlyField
                        label="Status"
                        value={copy.status || (copy.available ? 'Available' : 'Unavailable')}
                      />
                      {/* Editable: Shelf Location, Purchase Date, Language */}
                      <EditField label="Shelf Location">
                        <input
                          className="input"
                          value={edit?.shelfLocation ?? ''}
                          onChange={(e) => setCopyField(copy.copyId, 'shelfLocation', e.target.value)}
                          placeholder="e.g. A-12"
                        />
                      </EditField>
                      <EditField label="Purchase Date">
                        <input
                          type="date"
                          className="input"
                          value={edit?.purchaseDate ?? ''}
                          onChange={(e) => setCopyField(copy.copyId, 'purchaseDate', e.target.value)}
                        />
                      </EditField>
                      <EditField label="Language">
                        <input
                          className="input"
                          value={edit?.language ?? ''}
                          onChange={(e) => setCopyField(copy.copyId, 'language', e.target.value)}
                          placeholder="e.g. English"
                        />
                      </EditField>
                    </div>
                  </div>
                );
              })
            ) : (
              <p className="text-sm text-ink-500">No copy details available for this book.</p>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}

function EditField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="input-label">{label}</label>
      {children}
    </div>
  );
}

function ReadOnlyField({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <label className="input-label">{label}</label>
      <div className="input flex items-center bg-ink-100 font-mono text-[11px] text-ink-600">{value}</div>
    </div>
  );
}

function Detail({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone?: string;
}) {
  return (
    <div className="flex items-center justify-between gap-2">
      <span className="text-ink-400">{label}</span>
      <span className={`font-semibold ${tone ?? 'text-ink-700'}`}>{value}</span>
    </div>
  );
}
