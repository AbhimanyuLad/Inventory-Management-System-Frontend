import type {
  AddBookRequest,
  AuthUser,
  Book,
  BookSubmission,
  BookSubmissionRequestPayload,
  BookCopyUpdate,
  BookUpdateRequest,
  BorrowRequestPayload,
  BorrowedBook,
  DashboardInfo,
  DeactivationRequest,
  Fine,
  FinePolicy,
  FineRequestPayload,
  ForgotPasswordPayload,
  LoginPayload,
  QRCodeResult,
  RegisterPayload,
  Reservation,
  ResetPasswordPayload,
} from '@/types';

//const BASE_URL = 'http://localhost:8080/booktrack';
const BASE_URL = import.meta.env.VITE_API_URL;

const TOKEN_KEY = 'booktrack.token';
const USER_KEY = 'booktrack.user';

export function getStoredAuth(): AuthUser | null {
  try {
    const raw = localStorage.getItem(USER_KEY);
    const token = localStorage.getItem(TOKEN_KEY);
    if (!raw || !token) return null;
    const user = JSON.parse(raw) as AuthUser;
    return { ...user, token };
  } catch {
    return null;
  }
}

export function persistAuth(user: AuthUser) {
  localStorage.setItem(TOKEN_KEY, user.token);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function clearAuth() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

function authHeaders(): Record<string, string> {
  const token = localStorage.getItem(TOKEN_KEY);
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export class ApiError extends Error {
  status: number;
  details?: unknown;
  constructor(message: string, status: number, details?: unknown) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.details = details;
  }
}

async function request<T>(
  path: string,
  options: {
    method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
    body?: unknown;
    query?: Record<string, string>;
    auth?: boolean;
  } = {},
): Promise<T> {
  const { method = 'GET', body, query, auth = true } = options;
  const url = new URL(`${BASE_URL}${path}`);
  if (query) Object.entries(query).forEach(([k, v]) => url.searchParams.set(k, v));

  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (auth) Object.assign(headers, authHeaders());

  let res: Response;
  try {
    res = await fetch(url.toString(), {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new ApiError('Cannot reach the server. Make sure the backend is running.', 0);
  }

  const text = await res.text();
  let parsed: unknown = null;
  if (text) {
    try {
      parsed = JSON.parse(text);
    } catch {
      parsed = text;
    }
  }

  if (!res.ok) {
    const message =
      (typeof parsed === 'object' && parsed && 'message' in parsed
        ? String((parsed as Record<string, unknown>).message)
        : typeof parsed === 'string'
          ? parsed
          : `Request failed (${res.status})`) || `Request failed (${res.status})`;
    throw new ApiError(message, res.status, parsed);
  }

  return parsed as T;
}

function unwrap<T>(data: T): T {
  return data;
}

function toArray<T>(d: unknown, ...keys: string[]): T[] {
  if (Array.isArray(d)) return d as T[];
  if (d && typeof d === 'object') {
    const obj = d as Record<string, unknown>;
    for (const k of keys) {
      if (Array.isArray(obj[k])) return obj[k] as T[];
    }
    // last resort: first array-valued property
    for (const v of Object.values(obj)) {
      if (Array.isArray(v)) return v as T[];
    }
  }
  return [];
}

export const api = {
  // auth
  register: (p: RegisterPayload) =>
    request<Record<string, unknown>>('/register', { method: 'POST', body: p, auth: false }).then(unwrap),
  login: (p: LoginPayload) =>
    request<Record<string, unknown>>('/login', { method: 'POST', body: p, auth: false }).then(unwrap),
  forgotPassword: (p: ForgotPasswordPayload) =>
    request<string>('/forgot-password', { method: 'POST', body: p, auth: false }).then(unwrap),
  resetPassword: (p: ResetPasswordPayload) =>
    request<string>('/reset-password', { method: 'POST', body: p, auth: false }).then(unwrap),
  checkUsername: (username: string) =>
    request<Record<string, unknown>>('/username/check', { query: { username }, auth: false }).then(unwrap),

  // dashboard
  dashboard: () => request<DashboardInfo>('/dashboard/user').then(unwrap),
  finePolicies: () =>
    request<unknown>('/dashboard/instructions/fine-policy').then((d) => {
      if (typeof d === 'string') return [];
      return toArray<FinePolicy>(d, 'policies', 'finePolicies', 'list', 'data');
    }),
  recommendations: () =>
    request<unknown>('/dashboard/recommendations').then((d) => toArray<Book>(d, 'recommendations', 'books', 'data', 'content')),

  // books
  searchBooks: () => request<unknown>('/book/search').then((d) => toArray<Book>(d, 'books', 'bookList', 'data', 'content')),
  borrowBook: (p: BorrowRequestPayload) =>
    request<Record<string, unknown>>('/book/search/borrow', { method: 'POST', body: p }).then(unwrap),
  joinReservation: (p: BorrowRequestPayload) =>
    request<Record<string, unknown>>('/book/search/reservation', { method: 'POST', body: p }).then(unwrap),

  // borrowed
  borrowedBooks: () => request<unknown>('/borrowed-books').then((d) => toArray<BorrowedBook>(d, 'borrowedBooks', 'books', 'data', 'content')),
  returnRequest: (transactionId: string) =>
    request<Record<string, unknown>>(`/borrowed-books/return-request/${transactionId}`, { method: 'POST' }).then(unwrap),

  // reservations
  reservations: () => request<unknown>('/reservations').then((d) => toArray<Reservation>(d, 'reservations', 'data', 'content')),
  withdrawReservation: (transactionId: string, confirmed: boolean) =>
    request<boolean>(`/reservations/${transactionId}`, {
      method: 'DELETE',
      query: confirmed ? { confirmed: 'true' } : undefined,
    }).then(unwrap),

  // fines
  fines: () => request<unknown>('/fines-penalties').then((d) => toArray<Fine>(d, 'fines', 'penalties', 'data', 'content')),
  payFine: (p: FineRequestPayload) =>
    request<Record<string, unknown>>('/fines-penalties/pay-fine', { method: 'POST', body: p }).then(unwrap),
  payAllFines: (p: FineRequestPayload[]) =>
    request<Record<string, unknown>>('/fines-penalties/pay/allfines', { method: 'POST', body: p }).then(unwrap),

  // admin
  addBooks: (p: AddBookRequest[]) =>
    request<Record<string, unknown>>('/admin/inventory/add', { method: 'POST', body: p }).then(unwrap),
  makeAdmin: (p: DeactivationRequest) =>
    request<Record<string, unknown>>('/admin/makeadmin', { method: 'POST', body: p }).then(unwrap),
  deactivateUser: (p: DeactivationRequest) =>
    request<Record<string, unknown>>('/admin/deactivate', { method: 'POST', body: p }).then(unwrap),
  submissionRequests: () =>
    request<unknown>('/admin/booksubmission').then((d) => toArray<BookSubmission>(d, 'submissions', 'bookSubmissions', 'data', 'content')),
  transactionStatuses: () =>
    request<unknown>('/admin/transaction-statuses').then((d) => toArray<string>(d, 'statuses', 'transactionStatuses', 'data', 'content').map((s) => String(s))),
  approveSubmission: (p: BookSubmissionRequestPayload) =>
    request<Record<string, unknown>>('/admin/booksubmission', { method: 'POST', body: p }).then(unwrap),
  generateQRCodes: () =>
    request<unknown>('/admin/books/qrcodegeneration/generate').then((d) => toArray<QRCodeResult>(d, 'codes', 'qrCodes', 'data', 'content')),
  updateBook: (p: BookUpdateRequest) =>
    request<Record<string, unknown>>('/admin/inventory/update-book', { method: 'PUT', body: p }).then(unwrap),
  updateBookCopies: (p: BookCopyUpdate[]) =>
    request<Record<string, unknown>>('/admin/inventory/update-book-copy', { method: 'PUT', body: p }).then(unwrap),
  bookCopyStatuses: () =>
    request<unknown>('/admin/inventory/book-copies/statuses').then((d) =>
      toArray<string>(d, 'statuses', 'bookCopyStatuses', 'data', 'content').map((s) => String(s)),
    ),
};
