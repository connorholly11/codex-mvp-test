# Mobile Parity Plan

Purpose is shifting to a **mobile-first** product strategy. This document captures everything required to bring the Expo app up to feature parity with the current Next.js experience before we layer net-new work.

## 1. Current State Snapshot

- **Shared API client (`@purpose/api-client`)** already exposes onboarding schemas, chat helpers, and Supabase typings that both apps can consume.
- **Web (Next.js)** ships onboarding, chat (streaming + respond endpoints), journey/quests dashboards, personal insights reports, and Supabase-backed auth flows (magic links via Supabase).
- **Mobile (Expo/React Native)** delivers Supabase OTP sign-in and a single chat screen that posts messages via `sendChatMessage` (non-streaming). No onboarding, quests, reports, or subscription gating yet.

## 2. High-Level Goals

1. Users can complete the full FTUE on mobile: quests → account creation → legal acceptance → chat kick-off.
2. Chat on mobile streams in real time with parity to the web typing experience.
3. Quests, Journey timeline, and You Report surfaces are available in native UI.
4. Subscriptions and auth match the product doc: Clerk + RevenueCat with a 7-day trial, enforced gating.
5. Notifications, weekly reports, and analytics instrumented for mobile habit loops.
6. Shared packages (`@purpose/api-client`, `@purpose/ui`, `@purpose/analytics`) house the reusable logic/UI primitives for both platforms.

## 3. Workstreams & Tasks

### A. Authentication & Accounts
- Replace direct Supabase OTP in mobile with **Clerk** sign-up/sign-in, wired to Supabase for persistence (Profiles, Assessments, etc.).
- Ensure legal acceptance timestamp syncs to Supabase (`profiles.legal_acceptance_at`).
- Handle session refresh + token exchange for API routes (bearer tokens already supported by `/api/chat/*`).

### B. Subscriptions & Entitlements
- Integrate **RevenueCat** SDK in Expo for iOS (monthly, weekly, yearly tiers + sandbox testing).
- Build entitlement gating: lock chat/quests behind active subscription, with 7-day free trial.
- Mirror subscription state into Supabase for analytics and server-side checks (optional but recommended).

### C. Onboarding & Quests
- Port the onboarding wizard UX to React Native, reusing `@purpose/api-client/onboarding` schemas for validation.
- Call `/api/onboarding` endpoint from mobile to generate the Personal Insights report and seed chat history (apps/web/src/app/api/onboarding/route.ts:1).
- Implement quest list + completion flow using Supabase `quests_progress` data (apps/web/src/app/api/quests/route.ts:1, apps/web/src/app/api/quests/[questId]/complete/route.ts:1).
- Add progress persistence and UI states (available, in-progress, completed) similar to web journey view.

### D. Chat Experience
- Extend the shared client to expose streaming support in React Native (`streamChatMessage`) using fetch + SSE or a dedicated RN streaming helper.
- Update mobile chat UI with optimistic user bubble, live token rendering, error handling, and report refreshing (see apps/web/src/features/chat/components/chat-root.tsx:70 for reference logic).
- Add support for metadata badges (model info, report cards) as seen in the web `YouReportCard`.

### E. Journey & Reports
- Build native versions of:
  - Journey overview cards (quests completed, chat exchanges, constraint summary).
  - Insights archive and report viewer for Personal Insights.
- Ensure Supabase data fetches mirror web equivalents (`fetchChatHistory`, `QUESTS`, report parsing via `@purpose/api-client`).

### F. Notifications & Habit Loops
- Implement Expo Notifications to prompt daily quests and highlight weekly reports.
- Coordinate with Supabase cron/Edge Functions to enqueue notification payloads.
- Add in-app banners/toasts for new reports or coach nudges.

### G. Analytics & Telemetry
- Formalize `@purpose/analytics` with a thin abstraction (console in dev, PostHog/Segment in prod).
- Instrument key events: onboarding step complete, quest completed, chat message sent/received, subscription conversion, push opens.
- Ensure parity with web logging to support cross-platform dashboards.

### H. Voice & Future Enhancements (Post-Parity)
- Prepare for Q4 voice mode by capturing microphone permissions, recording pipelines, and playback hooks.
- Keep server endpoints modular so voice-to-text can reuse chat streaming logic.

## 4. Delivery Phasing

1. **Foundation (Weeks 1-3)**
   - Clerk + RevenueCat integration
   - Shared analytics abstraction
   - Streaming chat on mobile

2. **FTUE & Core Surfaces (Weeks 4-8)**
   - Onboarding wizard + quests
   - Personal Insights report viewer
   - Journey dashboard

3. **Habit Layer (Weeks 9-12)**
   - Push notifications, weekly summaries
   - Trial-to-paid funnels, in-app dialogs
   - QA hardening, TestFlight rollouts

4. **Launch Prep (Weeks 13+)**
   - App Store assets & review readiness
   - Beta instrumentation (crash reporting, Sentry)
   - Marketing hooks (shareable reports, referral prompts)

## 5. Dependencies & Open Questions

- Confirm timeline for migrating web auth to Clerk to keep parity (or maintain Supabase-only web auth temporarily).
- Decide whether the mobile app will host the marketing landing or redirect to a separate site.
- Define minimum viable journey/report visuals for launch versus nice-to-have animations.
- Determine if we need offline support caching for chat history/quests before App Store submission.

## 6. Next Steps

1. Align on engineering resourcing for mobile-first sprints.
2. Kick off design audit to adapt web components to native equivalents; start populating `@purpose/ui` with cross-platform tokens/primitives.
3. Schedule milestone reviews (e.g., bi-weekly) to track progress toward August App Store release.
4. Coordinate with growth/marketing on notification cadence, App Store metadata, and beta tester recruitment.

This plan should be treated as a living document; update tasks and phasing as we uncover new requirements or dependencies during implementation.
