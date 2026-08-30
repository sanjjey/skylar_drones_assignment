// Centralized API configuration supporting local Vite proxy and production Vercel/Railway URLs
export const API_BASE = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '');
