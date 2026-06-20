export const ROUTES = {
  dashboard: '/',
  invoices: '/invoices',
  upload: '/invoices/upload',
  review: (id: string) => `/invoices/review?id=${id}`,
  history: '/history',
} as const;
