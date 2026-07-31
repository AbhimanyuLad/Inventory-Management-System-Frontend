export type Role = 'USER' | 'ADMIN';

export interface AuthUser {
  username: string;
  email: string;
  role: Role;
  token: string;
}

export interface RegisterPayload {
  username: string;
  email: string;
  password: string;
}

export interface LoginPayload {
  username: string;
  password: string;
}

export interface ForgotPasswordPayload {
  email: string;
}

export interface ResetPasswordPayload {
  token: string;
  newPassword: string;
}

export interface DeactivationRequest {
  email: string;
}

export interface AddBookRequest {
  title: string;
  author: string;
  publisher?: string;
  price?: number;
  isbn?: string;
  edition?: string;
  language?: string;
  category?: string;
  shelfLocation?: string;
  purchaseDate?: string;
  description?: string;
  publishedYear?: number;
  quantity?: number;
}

export interface BookCopy {
  copyId: string;
  bookId?: string;
  shelfLocation?: string;
  language?: string;
  purchaseDate?: string;
  status?: string;
  available?: boolean;
  [key: string]: unknown;
}

export interface Book {
  bookId: string;
  title: string;
  author: string;
  publisher?: string;
  price?: number;
  isbn?: string;
  edition?: string;
  language?: string;
  category?: string;
  shelfLocation?: string;
  description?: string;
  publishedYear?: number;
  purchaseDate?: string;
  quantity?: number;
  available?: number;
  availableCopies?: number;
  reservedCopies?: number;
  borrowedCopies?: number;
  totalCopies?: number;
  coverUrl?: string;
  status?: string;
  copies?: BookCopy[];
}

export interface BookUpdateRequest {
  bookId: string;
  title?: string;
  author?: string;
  publisher?: string;
  isbn?: string;
  edition?: string;
  category?: string;
  description?: string;
  price?: number;
  quantity?: number;
  copyIds?: string[];
  language?: string;
  purchaseDate?: string;
  shelfLocation?: string;
  newBookCopiesPurchase?: string;
}

export interface BookCopyUpdate {
  copyId: string;
  purchaseDate?: string;
  language?: string;
  shelfLocation?: string;
  status?: 'AVAILABLE' | 'BORROWED' | 'RESERVED' | 'LOST' | 'DAMAGED';
}

export interface BorrowedBook {
  transactionId: string;
  bookId: string;
  copyId?: string;
  bookCopyId?: string;
  title: string;
  author: string;
  borrowedDate?: string;
  dueDate?: string;
  returnDate?: string;
  returnedDate?: string;
  status?: string;
  fine?: number;
  [key: string]: unknown;
}

export interface Reservation {
  reservationId: string;
  transactionId?: string;
  bookId: string;
  title: string;
  author: string;
  reservedDate?: string;
  status?: string;
  queuePosition?: number;
  [key: string]: unknown;
}

export interface Fine {
  fineId: string;
  transactionId?: string;
  bookId?: string;
  title?: string;
  bookTitle?: string;
  author?: string;
  amount: number;
  reason?: string;
  status?: string;
  date?: string;
  issuedDate?: string;
  dueDate?: string;
  borrowerName?: string;
  username?: string;
  daysOverdue?: number;
  rate?: number;
  [key: string]: unknown;
}

export interface BookSubmission {
  transactionId: string;
  bookId?: string;
  title?: string;
  author?: string;
  user?: string;
  username?: string;
  email?: string;
  status?: string;
  fine?: number;
  reason?: string;
  requestDate?: string;
  issuedDate?: string;
  dueDate?: string;
  returnDate?: string;
  copyId?: string;
  isbn?: string;
  category?: string;
  [key: string]: unknown;
}

export interface DashboardInfo {
  username?: string;
  email?: string;
  role?: Role;
  totalBorrowed?: number;
  activeBorrowed?: number;
  totalReservations?: number;
  totalFines?: number;
  outstandingFines?: number;
  totalUsers?: number;
  totalBooks?: number;
  totalCopies?: number;
  availableBooks?: number;
  borrowedBooks?: number;
  reservedBooks?: number;
  [key: string]: unknown;
}

export interface FinePolicy {
  id?: string;
  title?: string;
  name?: string;
  description?: string;
  amount?: number;
  rate?: number;
  perDay?: boolean;
  days?: number;
  [key: string]: unknown;
}

export interface BorrowRequestPayload {
  bookId: string;
}

export interface BookSubmissionRequestPayload {
  transactionId: string;
  status: string;
  fine?: number;
  reason?: string;
}

export interface FineRequestPayload {
  fineId: string;
}

export interface QRCodeResult {
  bookId: string;
  title?: string;
  qrCodeString?: string;
  qrCodeUrl?: string;
}
