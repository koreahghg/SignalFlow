export const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? ''
export const isAdmin = (email: string | null | undefined): boolean =>
  !!ADMIN_EMAIL && email === ADMIN_EMAIL
