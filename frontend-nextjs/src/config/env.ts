export const env = {
  appUrl: process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
  apiUrl: process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000",
  workplaceHost: process.env.NEXT_PUBLIC_WORKPLACE_HOST ?? "workplace.localhost:3000",
  rootDomain: process.env.NEXT_PUBLIC_ROOT_DOMAIN ?? "localhost",
} as const;
