export const ROUTES = {
  dashboard: '/',
  invoices: '/invoices',
  upload: '/invoices/upload',
  review: (id: string) => `/invoices/${id}/review`,
  history: '/history',
} as const;
