# Purpose Web Application – Product & Delivery Specification

Version: 1.0 (Web)
Last Updated: October 8, 2025
Document Purpose: Adapt the Purpose AI life coach product for a modern responsive web experience, prioritising desktop and mobile web browsers while deferring native iOS/Android specific work.

> **Note:** Purpose is now executing mobile-first. Treat this spec as a reference for companion web work; confirm priority before starting large web initiatives.

---

## 1. Executive Overview

Purpose on the web delivers the same coaching value as the mobile product, but optimises for browser-based interactions, accessibility, and rapid iteration. The AI companion **Fermi** remains the primary touchpoint, supported by psychometric onboarding, personalised insights, and daily quests. The web experience must feel premium, responsive, and frictionless across breakpoints (mobile web, tablet, desktop).

### Key Adaptations for Web
- Focus on responsive layouts (CSS grid/flex) instead of native view hierarchies; support mobile web ≥375px and desktop ≥1280px widths.
- Replace native-only affordances (haptics, system modals) with web equivalents (micro-animations, toasts, inline validation, modals built with accessible primitives).
- Optimise for keyboard and screen reader accessibility (ARIA roles, focus management).
- Re-evaluate interactions that assumed mobile gestures (swipe, long-press) and substitute web-friendly patterns (icon buttons, context menus, hover states).
- Integrate web authentication (Clerk web SDK) and handle cookie/session storage with security best practices.

---

## 2. Product Vision & Experience Principles

The mission, core values, brand voice, and coaching methodology remain unchanged. On the web, we emphasise:

- **Clarity-first UI**: Layouts that surface the chat and actionable insights without overwhelming the user.
- **Accessible compassion**: Ensure every interaction works with keyboard navigation, screen readers, and high-contrast themes.
- **Delight via micro-interactions**: Leverage CSS transitions, Lottie web animations, and subtle soundscapes instead of haptics.
- **Performance**: Aim for sub-1s meaningful paint, streaming chat responses <2s median, and minimal bundle size via code-splitting.

---

## 3. Core User Journey (Web)

### First-Time User Flow
```
Landing Page
    ↓
Age Disclaimer Lightbox
    ↓
Before We Begin Modal (assessment framing)
    ↓
Interactive Assessment Flow (multi-step form)
    ↓
Processing Screen (full-screen overlay)
    ↓
Sign Up / Account Creation (Clerk web modal)
    ↓
Legal Disclaimer Modal
    ↓
Chat Screen with You Report card
    ↓
Notification Permission Prompt (browser, optional)
    ↓
7-day Trial Starts
    ↓
Ongoing Coaching Relationship
```

### Returning User Flow
```
App Visit (authenticated session)
    ↓
Paywall Check (if trial expired and not premium)
    ↓
Chat Screen (default route)
    ↓
Access Tabs: Chat | Quests | Journey (when enabled)
```

Web-specific notes:
- Use client-side routing (Next.js App Router or Remix) to persist context between tabs without full reloads.
- Persist onboarding progress in localStorage + server drafts to handle tab refreshes.
- Provide route-guarded paywall overlays that preserve underlying context.

---

## 4. Feature Specifications (Web)

### 4.1 Onboarding & FTUE

#### Welcome & Age Disclaimer
- Implement as a full-bleed landing page with CTA opening an accessible modal for age confirmation (ARIA `dialog`).
- Use smooth scroll reveal for storytelling blocks; maintain 60fps via CSS transforms.

#### Assessment Flow
- Multi-step form built with a wizard component; each step renders within a centred card for desktop and full-bleed sections for mobile.
- Progress tracker persists across steps (e.g., horizontal stepper on desktop, pill indicator on mobile).
- Inputs:
  - Demographics: use validated HTML inputs (`type="number"`, `autocomplete`).
  - Life fulfilment sliders: custom slider component using `<input type="range">` with bubble tooltip; fallback numeric input for accessibility.
  - BFI-13: render one statement per page with radio group buttons styled as segmented controls; allow keyboard navigation.
  - Values ranking: drag-and-drop via accessible DnD library (e.g., `@dnd-kit/core`) with manual reorder buttons for keyboard users.
  - Open-ended questions: autosizing `<textarea>` with live character counter; autosave debounced to localStorage.
- Navigation: `Back` and `Continue` buttons fixed to bottom for mobile, right-aligned for desktop.

#### Processing State
- Fullscreen overlay with animated SVG/Lottie Fermi logo and progress bar.
- Background submission via TanStack Query mutation; show optimistic progress increments until completion.
- Provide fallback retry CTA on failure with inline error copy.

#### Account Creation
- Use Clerk hosted components embedded as modal overlays to keep visual continuity.
- After successful auth, fetch onboarding completion state via React Query and transition to chat route.

### 4.2 Chat Interface
- Layout: Three-panel responsive design.
  - **Desktop (≥1024px)**: left nav rail (logo, tabs), central conversation column, optional right sidebar for insights/quests preview.
  - **Mobile web (<1024px)**: top navbar, conversation full-width, bottom sticky input bar.
- Chat bubbles: CSS variables for theming; support markdown rendering in assistant messages.
- Provide message context menu via ellipsis icon (copy, reply). Use inline reply chip above composer.
- Streaming responses via Server-Sent Events handled in React component with incremental state updates.
- Pacing simulation handled client-side with configurable token delay; provide "Skip to end" button to show full response instantly.
- Error states: toast notifications using accessible live regions.

### 4.3 Quests System
- Quests tab uses masonry or stacked cards depending on viewport. Each card uses motion effects on hover.
- Quest modal implemented with a fullscreen overlay for mobile and centred dialog for desktop.
- Input controls mirror onboarding variants for consistency.
- Completion animation: CSS/JS animation plus optional chime via Web Audio API (muted by default unless user enables sound).
- Track quest analytics via central event hook.

### 4.4 Journey Page (Feature-flagged)
- Use timeline layout with sticky year markers on desktop; simplified stacked cards on mobile.
- Achievements modal uses responsive grid (`grid-template-columns` auto-fit) and accessible focus trapping.
- Data fetched lazily when user opens tab to avoid initial bundle bloat.

### 4.5 Personal Insights Report
- Report card in chat rendered as clickable callout with gradient border and subtle hover scale.
- Full report page uses two-column layout on desktop (sections list left, detail right) and stacked accordion on mobile.
- Markdown content rendered with `react-markdown`; custom components for lists, emphasis, callouts.
- Persist section completion in localStorage keyed by `questInstanceId`; sync to backend in the background when available.

---

## 5. Technical Architecture

### Frontend
- **Framework**: Next.js 14 (App Router) with React Server Components where beneficial; fallback to Remix if team prefers.
- **Language**: TypeScript.
- **Styling**: Tailwind CSS + CSS variables for theming; integrate Radix UI primitives for accessible dialogs, dropdowns, sliders.
- **State Management**:
  - Client state: Zustand (session UI, onboarding wizard state).
  - Server state: TanStack Query for API calls and SSE chat stream.
- **Routing**: File-based routes: `/`, `/onboarding/*`, `/chat`, `/quests`, `/journey`, `/report/[id]`, `/paywall`.
- **Streaming**: SSE via fetch + ReadableStream; use abort controllers for cancellation.
- **Storage**: Browser-local only (localStorage for autosave, IndexedDB as needed). No external database or remote persistence in the prototype.
- **Analytics**: PostHog web SDK, Customer.io webhooks, AppsFlyer web (if required) or alternative web attribution.
- **Error Monitoring**: Sentry browser SDK with replay for session diagnostics.
- **Testing**: Vitest + Testing Library + Playwright for end-to-end flows (onboarding, chat, paywall).

### Backend (Reference Only)
- The prototype does not provision AWS or any remote services; backend endpoints are mocked client-side with local storage and in-memory adapters.
- For eventual production hardening, keep the target architecture in mind: AWS Lambda + API Gateway, with Clerk-issued JWT validation and DynamoDB storage.
- When transitioning to production, ensure CORS configuration for web origins, prepare SSE capacity planning, and fan out analytics via EventBridge.

### Environment & Secrets
- Required runtime configuration is limited to `ANTHROPIC_API_KEY` for the coaching model.
- All other integrations (Clerk, RevenueCat, analytics) remain stubbed locally during this internal build.
- Provide a `.env.local.example` file documenting the single expected variable.

### Deployment Pipeline
- CI: GitHub Actions (lint, test, build). Use Playwright tests on PRs targeting `main`.
- Hosting: Vercel (preferred for Next.js) or AWS Amplify. Configure environment secrets for Clerk, PostHog, RevenueCat web keys.
- CDN: Automatic via Vercel; ensure long-term caching for static assets.

---

## 6. Web UX Guidelines

- **Accessibility**: Meet WCAG 2.1 AA. Use Axe automated checks in CI; manual testing with NVDA/VoiceOver.
- **Responsive Breakpoints**: 375px, 768px, 1024px, 1440px.
- **Theme Support**: Light/dark toggle persisted per user; sync with OS preference via `prefers-color-scheme`.
- **Animation**: Use `prefers-reduced-motion` media query to disable non-essential animations.
- **Sound**: Opt-in toggle in settings; store choice server-side.

---

## 7. Analytics & Tracking (Web)

Event taxonomy mirrors mobile spec with web-specific context properties:
- `device_type`, `viewport_width`, `input_method` (keyboard/mouse/touch), `referrer`, `utm_*`.
- Track `page_view` per route and `cta_click` for marketing surfaces.
- Funnel dashboards: Onboarding completion, trial start, chat engagement, quest completion.
- Use PostHog autocapture sparingly; rely on explicit events for critical flows.
- Prototype implementation: analytics events buffer locally in `localStorage` (`analytics.ts`) for debugging before wiring remote sinks. A developer inspector at `/debug/analytics` exposes the buffered events.

---

## 8. Monetisation & Paywall

- Implement Superwall web SDK or build custom paywall modal with RevenueCat web entitlements.
- Paywall triggers identical to mobile (chat entry, session start, settings) but rendered as overlays that preserve in-page context.
- Stripe Checkout may supplement mobile stores for desktop-based upgrades; integrate via RevenueCat offerings.
- Ensure compliance with web store policies (e.g., linking to native app stores where necessary).

---

## 9. Legal & Compliance

- Present Terms of Service and Privacy Policy via modal or external link pre-signup.
- Age gate and coaching disclaimer implemented before onboarding begins.
- GDPR compliance: Cookie consent banner with granular analytics toggles; honour Do Not Track.
- Data deletion flows accessible in settings; automate backend cleanup job within 30 days.

---

## 10. Implementation Roadmap

### Phase 1 – Foundation (MVP)
1. Bootstrap Next.js project, configure Clerk, TanStack Query, Tailwind, PostHog.
2. Implement landing page + age gate modal.
3. Build onboarding wizard (demographics → BFI → values → reflections) with autosave.
4. Wire the processing screen to a local persistence service that simulates backend responses.
5. Add a lightweight account creation stub (local identity) and legal disclaimer modal.
6. Deliver chat interface with streaming responses and You Report card display.
7. Provide prototype reset action to clear local state for iterative testing.

### Phase 2 – Engagement Features
1. Implement Quests tab with quest types and completion modal.
2. Add Journey tab skeleton (feature flagged) with achievements modal.
3. Enhance analytics instrumentation across key funnels.
4. Introduce subscription paywall overlays and RevenueCat entitlements.

### Phase 3 – Polish & Scale
1. Accessibility audit and fixes; add localisation scaffolding.
2. Performance tuning (bundle splitting, image optimisation, caching).
3. Add weekly reports, voice transcription via WebRTC upload, and optional TTS.
4. Expand QA automation (Playwright regression suite, synthetic monitoring).

---

## 11. Success Metrics (Web)
- Onboarding completion rate ≥70% for web visitors starting assessment.
- Conversion from landing to trial start ≥20%.
- Median chat response latency ≤2s.
- Day 7 web retention ≥30%.
- Quest completion rate ≥60%.
- Lighthouse scores ≥90 (Performance, Accessibility, Best Practices, SEO) on desktop and mobile audits.

---

## 12. Open Questions & Next Steps
- Confirm whether web voice mode is in scope for MVP or post-launch.
- Decide on marketing pages vs. app domain split (subdomain approach).
- Determine data residency requirements for EU users accessing web app.
- Align with design on theming system (Tailwind tokens vs. CSS custom properties).

---

*End of Specification*
