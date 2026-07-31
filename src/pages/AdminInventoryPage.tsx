import { useState } from 'react';
import { BookPlus, Loader2, Plus, Save, Trash2 } from 'lucide-react';
import { api, ApiError } from '@/lib/api';
import { formatINR } from '@/lib/format';
import type { AddBookRequest } from '@/types';
import { useToast } from '@/context/ToastContext';

interface BookForm extends AddBookRequest {
  id: string;
}

function emptyBook(): BookForm {
  return {
    id: crypto.randomUUID(),
    title: '',
    author: '',
    publisher: '',
    price: 0,
    isbn: '',
    edition: '',
    language: 'English',
    category: '',
    shelfLocation: '',
    purchaseDate: new Date().toISOString().slice(0, 10),
    description: '',
    publishedYear: new Date().getFullYear(),
    quantity: 1,
  };
}

const CATEGORIES = ['Fiction', 'Non-Fiction', 'Science', 'History', 'Biography', 'Children', 'Technology', 'Other'];

// All fields mandatory except description.
const REQUIRED: { key: keyof BookForm; label: string }[] = [
  { key: 'title', label: 'Title' },
  { key: 'author', label: 'Author' },
  { key: 'publisher', label: 'Publisher' },
  { key: 'isbn', label: 'ISBN' },
  { key: 'edition', label: 'Edition' },
  { key: 'language', label: 'Language' },
  { key: 'category', label: 'Category' },
  { key: 'shelfLocation', label: 'Shelf location' },
  { key: 'purchaseDate', label: 'Purchase date' },
  { key: 'publishedYear', label: 'Published year' },
  { key: 'quantity', label: 'Quantity' },
  { key: 'price', label: 'Price' },
];

function isFieldEmpty(value: unknown): boolean {
  if (typeof value === 'string') return value.trim() === '';
  if (typeof value === 'number') return isNaN(value) || value <= 0;
  return value == null;
}

export function AdminInventoryPage() {
  const { toast } = useToast();
  const [books, setBooks] = useState<BookForm[]>([emptyBook()]);
  const [saving, setSaving] = useState(false);

  const update = (id: string, field: keyof BookForm, value: unknown) => {
    setBooks((bs) => bs.map((b) => (b.id === id ? { ...b, [field]: value } : b)));
  };

  const addRow = () => setBooks((bs) => [...bs, emptyBook()]);
  const removeRow = (id: string) =>
    setBooks((bs) => (bs.length === 1 ? bs : bs.filter((b) => b.id !== id)));

  const validate = (book: BookForm): string | null => {
    for (const f of REQUIRED) {
      if (isFieldEmpty(book[f.key])) {
        return `${f.label} is required for every book.`;
      }
    }
    return null;
  };

  const save = async () => {
    for (const b of books) {
      const err = validate(b);
      if (err) {
        toast(err, 'error');
        return;
      }
    }
    setSaving(true);
    try {
      const payload: AddBookRequest[] = books.map(({ id: _id, ...rest }) => rest);
      await api.addBooks(payload);
      toast(`${books.length} book${books.length > 1 ? 's' : ''} added to inventory.`, 'success');
      setBooks([emptyBook()]);
    } catch (err) {
      toast(err instanceof ApiError ? err.message : 'Could not add books.', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-extrabold text-ink-900">Add books to inventory</h1>
          <p className="mt-1 text-sm text-ink-500">
            All fields are required except <span className="font-semibold">Description</span>.
          </p>
        </div>
        <div className="flex gap-2">
          <button onClick={addRow} className="btn-secondary">
            <Plus className="h-4 w-4" /> Add another book
          </button>
          <button onClick={save} className="btn-primary" disabled={saving}>
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Save {books.length} book{books.length > 1 ? 's' : ''}
          </button>
        </div>
      </div>

      <div className="space-y-5">
        {books.map((book, idx) => (
          <section key={book.id} className="card p-5">
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-brand-100 text-xs font-bold text-brand-700">
                  {idx + 1}
                </span>
                <h2 className="font-display text-base font-bold text-ink-900">
                  {book.title || 'New book'}
                </h2>
              </div>
              <button
                onClick={() => removeRow(book.id)}
                className="rounded-lg p-2 text-ink-400 hover:bg-danger-50 hover:text-danger-600"
                disabled={books.length === 1}
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <Field label="Title *" required>
                <input className="input" value={book.title} onChange={(e) => update(book.id, 'title', e.target.value)} placeholder="Book title" />
              </Field>
              <Field label="Author *" required>
                <input className="input" value={book.author} onChange={(e) => update(book.id, 'author', e.target.value)} placeholder="Author name" />
              </Field>
              <Field label="Publisher *" required>
                <input className="input" value={book.publisher} onChange={(e) => update(book.id, 'publisher', e.target.value)} placeholder="Publisher" />
              </Field>
              <Field label="ISBN *" required>
                <input className="input" value={book.isbn} onChange={(e) => update(book.id, 'isbn', e.target.value)} placeholder="ISBN" />
              </Field>
              <Field label="Edition *" required>
                <input className="input" value={book.edition} onChange={(e) => update(book.id, 'edition', e.target.value)} placeholder="e.g. 3rd" />
              </Field>
              <Field label="Language *" required>
                <input className="input" value={book.language} onChange={(e) => update(book.id, 'language', e.target.value)} placeholder="Language" />
              </Field>
              <Field label="Category *" required>
                <select className="input" value={book.category} onChange={(e) => update(book.id, 'category', e.target.value)}>
                  <option value="">Select…</option>
                  {CATEGORIES.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </Field>
              <Field label="Shelf location *" required>
                <input className="input" value={book.shelfLocation} onChange={(e) => update(book.id, 'shelfLocation', e.target.value)} placeholder="e.g. A-12" />
              </Field>
              <Field label="Quantity *" required>
                <input type="number" min={1} className="input" value={book.quantity} onChange={(e) => update(book.id, 'quantity', Number(e.target.value))} />
              </Field>
              <Field label="Price (₹) *" required>
                <input type="number" min={0} step="0.01" className="input" value={book.price} onChange={(e) => update(book.id, 'price', Number(e.target.value))} />
              </Field>
              <Field label="Published year *" required>
                <input type="number" className="input" value={book.publishedYear} onChange={(e) => update(book.id, 'publishedYear', Number(e.target.value))} />
              </Field>
              <Field label="Purchase date *" required>
                <input type="date" className="input" value={book.purchaseDate} onChange={(e) => update(book.id, 'purchaseDate', e.target.value)} />
              </Field>
              <div className="sm:col-span-2 lg:col-span-3">
                <Field label="Description">
                  <textarea className="input min-h-[80px]" value={book.description} onChange={(e) => update(book.id, 'description', e.target.value)} placeholder="Short summary (optional)…" />
                </Field>
              </div>
            </div>
          </section>
        ))}
      </div>

      <div className="flex justify-end">
        <button onClick={save} className="btn-primary" disabled={saving}>
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <BookPlus className="h-4 w-4" />}
          Save to inventory
        </button>
      </div>
    </div>
  );
}

function Field({
  label,
  children,
  required,
}: {
  label: string;
  children: React.ReactNode;
  required?: boolean;
}) {
  return (
    <div>
      <label className="input-label">{label}</label>
      {children}
    </div>
  );
}
