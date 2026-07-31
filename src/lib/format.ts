export function formatINR(amount: number | undefined | null): string {
  const value = typeof amount === 'number' && !isNaN(amount) ? amount : 0;
  return `₹${value.toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
}
