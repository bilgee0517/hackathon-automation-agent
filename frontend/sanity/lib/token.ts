import 'server-only'

// Use write token if available (for mutations), otherwise fall back to read token
export const token = process.env.SANITY_API_WRITE_TOKEN || process.env.SANITY_API_READ_TOKEN
