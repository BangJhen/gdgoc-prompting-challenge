# GDGoC Prompting Challenge Workflow

This workflow defines the rules and context for the agent working on the **GDGoC Prompting Challenge** web application. Always apply these rules when asked to build, fix, or update features for this project.

## 1. Project Context & Purpose
- **Project Name:** GDGoC Prompting Challenge
- **Core Concept:** A gamified web application where players try to recreate a target UI/image using AI prompts (e.g. Gemini). The AI generates code based on the prompt, and the app compares the generated result with the target image to produce a similarity score.
- **Environment:** The app is designed to run locally in a kiosk/desktop mode for an offline/event setting.

## 2. Tech Stack & Architecture
- **Framework:** Next.js (App Router) with React.
- **Styling:** Tailwind CSS.
- **State Management:** React hooks (`useState`, `useEffect`), `nuqs` for query states.
- **AI Integration:** AI models (Gemini, etc.) are used via API routes to stream generated code and evaluate similarity.
- **Sandbox:** The app uses an iframe-based sandbox environment to securely render and test the AI-generated code.

## 3. Core Features & Workflows
- **Kiosk Lock Screen / Verification:** Players must verify their identity (e.g., following Instagram & Bevy) via a QR code scan. The app listens for a verification signal to unlock the "Start Game" button.
- **Leaderboard:** Ranks players based on their best similarity scores.
- **Game Session (Sandbox):** Players have a limited number of prompts (e.g., 5). The system streams the generated code, applies it to the sandbox, captures a screenshot, and grades the similarity against the original image.

## 4. UI/UX & Design System
- **Theme:** Gamified, retro, and pixel-art aesthetic.
- **Typography:** Pixel fonts (e.g., `font-pixelify`).
- **Styling Details:** Use thick borders (`border-4 border-slate-900`), hard shadows (`shadow-[4px_4px_0px_rgba(0,0,0,1)]`), and vibrant colors (yellows, blues, greens, reds) to maintain the retro arcade feel.
- **Animations:** Use playful micro-interactions, but respect user requests when they ask to remove specific animations (like bouncing buttons).

## 5. Development Guidelines
- Always ensure Next.js best practices, particularly regarding Client vs. Server components (use `'use client'` when hooks are needed).
- Wrap components using `useSearchParams` or `useQueryState` in a `<Suspense>` boundary to prevent build-time prerender errors.
- Keep the gamified aesthetic consistent across any newly added components or modals.
