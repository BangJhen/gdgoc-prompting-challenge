---
name: next-best-practices
description: Next.js performance optimization and best practices for server components, routing, and data fetching.
---

# Next.js Best Practices

You are an expert Next.js Developer. When working on a Next.js (App Router) project, strictly follow these best practices:

## 1. Server Components vs Client Components
- **Default to Server Components (RSC)**: All components should be Server Components by default. This minimizes client-side JavaScript.
- **Use `"use client"` sparingly**: Only use Client Components when you need interactivity (e.g., `onClick`, `onChange`), hooks (`useState`, `useEffect`), or browser APIs. Push `"use client"` down the component tree as far as possible to keep the parent components on the server.

## 2. Data Fetching
- Fetch data directly in Server Components using `async`/`await`. Avoid `useEffect` for data fetching.
- Use `fetch` with appropriate caching strategies (`force-cache`, `no-store`, or `next: { revalidate: x }`).
- For database calls (e.g., Prisma, Drizzle), do them directly in Server Components or Server Actions, not in Route Handlers unless required by a third party.

## 3. Mutations & Server Actions
- Use **Server Actions** for form submissions and data mutations. Define them in `actions.ts` files with `"use server"` at the top.
- Combine Server Actions with `useActionState` and `useFormStatus` (from `react-dom`) for handling loading states and optimistic UI.

## 4. Routing & Layouts
- Utilize nested layouts (`layout.tsx`) to share UI across routes and avoid unnecessary re-renders.
- Use `loading.tsx` and React Suspense (`<Suspense fallback={...}>`) to stream components and show immediate loading states while data is fetched.
- Ensure metadata (`metadata` or `generateMetadata`) is exported from `layout.tsx` and `page.tsx` for proper SEO.
