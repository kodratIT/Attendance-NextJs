export const REQUEST_LIMITS = {
  maxBackDays: Number(process.env.NEXT_PUBLIC_REQUEST_MAX_BACK_DAYS ?? 7),
  minReasonChars: Number(process.env.NEXT_PUBLIC_REQUEST_MIN_REASON_CHARS ?? 10),
  monthlyFrequencyLimit: Number(process.env.NEXT_PUBLIC_REQUEST_MONTHLY_LIMIT ?? 5),
};

export const REVIEWER_ROLES = (process.env.NEXT_PUBLIC_REVIEWER_ROLES || 'Admin,HR,Manager')
  .split(',')
  .map(s => s.trim())
  .filter(Boolean);
