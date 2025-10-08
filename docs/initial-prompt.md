# Purpose – Complete Product Specification
**AI Life Coach Application**

Version: 1.0
Last Updated: October 8, 2025
Document Purpose: Comprehensive specification for recreating the Purpose mobile application

---

## Table of Contents

1. [Executive Overview](#executive-overview)
2. [Product Vision & Philosophy](#product-vision--philosophy)
3. [Core User Journey](#core-user-journey)
4. [Feature Specifications](#feature-specifications)
   - [Onboarding & FTUE](#1-onboarding--ftue-first-time-user-experience)
   - [Chat Interface](#2-chat-interface)
   - [Quests System](#3-quests-system)
   - [Journey Page](#4-journey-page-in-development)
   - [Personal Insights Report](#5-personal-insights-report)
5. [Technical Requirements](#technical-requirements)
6. [User Experience Principles](#user-experience-principles)
7. [Analytics & Tracking](#analytics--tracking)
8. [Monetization & Access Control](#monetization--access-control)
9. [Legal & Compliance](#legal--compliance)

---

## Executive Overview

**Purpose** is an AI-powered life coaching application that guides users from "I'm doing fine" to genuine clarity and momentum through a deeply personal AI companion named **Fermi**. The app combines psychometric assessments, conversational AI, and personalized guidance to deliver tailored, always-on coaching at the cost of a streaming subscription.

**Key Differentiators:**
- Personalized AI that learns user psychology through validated assessments
- Action-biased accountability with compassionate candor
- Spotify Wrapped-style "You Report" generated after first session
- Weekly insights and trend tracking
- Voice mode capability (Q4 2025)

---

## Product Vision & Philosophy

### Mission Statement
Guide people from "I'm doing fine" to genuine clarity and momentum through a deeply-personal AI companion.

### Core Values
1. **Radical Clarity** – No hype, no canned positivity, no patronizing tone
2. **Action-Biased Accountability** – Focus on forward movement and real change
3. **Compassionate Candor** – Truth-telling with empathy

### Brand Voice
- Empathetic yet direct
- Transparent and honest
- Insightful without being preachy
- No-BS approach (inspired by Mark Manson's philosophy)
- Encouraging but never patronizing

### Coaching Methodology
- **CBT-style reframing** – Cognitive behavioral therapy techniques
- **Values clarification** – Deep understanding of what matters
- **Habit stacking** – Building sustainable behaviors
- **Reflective questioning** – Socratic method for self-discovery
- **Pattern recognition** – Identifying behavioral trends

---

## Core User Journey

### First-Time User Flow
```
App Install
    ↓
Welcome Screen (Pre-Authentication)
    ↓
Age Disclaimer (Must be 18+)
    ↓
Onboarding Assessment (10-15 minutes)
    ├─ Demographics (Age, Gender, Occupation)
    ├─ Life Fulfillment Assessment (5 areas)
    ├─ Big Five Personality (BFI-13)
    ├─ Values Assessment (Schwartz)
    └─ Open-Ended Questions
    ↓
Processing Screen (Animated with progress)
    ↓
Sign Up / Account Creation
    ↓
Legal Disclaimer Modal
    ↓
Chat Screen with "You Report"
    ├─ Personal Insights Report Card appears in chat
    └─ User can tap to explore detailed insights
    ↓
Notification Permission Request
    ↓
Free Trial Begins (7 days)
    ↓
Ongoing Coaching Relationship
```

### Returning User Flow
```
App Open
    ↓
[Paywall Check - if trial expired and not premium]
    ↓
Chat Screen (Default landing)
    ├─ Welcome back banner (if from notification)
    ├─ Trial status banner (if in trial)
    └─ Continue conversation with Fermi
    ↓
Access to:
    ├─ Chat (Main tab)
    ├─ Quests (Feature flagged)
    └─ Journey (Feature flagged, coming soon)
```

---

## Feature Specifications

### 1. Onboarding & FTUE (First-Time User Experience)

#### 1.1 Welcome & Authentication Flow

**Welcome Screen**
- **Purpose**: Pre-authentication introduction
- **Content**: Brief intro to Purpose and Fermi
- **Actions**: "Get Started" button leading to age verification
- **Design**: Clean, minimal, brand-aligned

**Age Disclaimer Screen**
- **Purpose**: Legal compliance - must be 18+ to use
- **Content**: "You must be 18 or older to use Purpose"
- **Actions**:
  - "I am 18 or older" → Continue
  - "Go Back" → Return to welcome
- **Validation**: User confirms age before proceeding
- **Analytics**: Track age verification completion

**Before We Begin Screen**
- **Purpose**: Set expectations for assessment
- **Content**:
  - Explain the assessment will take 10-15 minutes
  - Emphasize honesty and thoughtful responses
  - Clarify this helps Fermi personalize guidance
- **Actions**: "Begin Assessment" button

#### 1.2 Comprehensive Assessment Flow

The assessment collects validated psychometric data to build user's psychological profile.

**Step 1: Demographics**

*Age Question*
- Input type: Numeric input field
- Validation: Must be 18-120
- Purpose: Contextualizes life stage for coaching

*Gender Question*
- Options: Male, Female, Non-binary, Prefer not to say
- Purpose: Enables appropriate language and context

*Occupation Question*
- Input type: Text input with suggestions
- Examples: "Software Engineer", "Student", "Entrepreneur", "Parent"
- Purpose: Understands daily context and pressures

**Step 2: Life Fulfillment Assessment (5 Areas)**

Each area uses a **visual slider with bubble ratings** (1-5 scale):
1. **Physical Health & Energy**
   - Question: "How satisfied are you with your physical health and energy levels?"
   - Scale: 1 (Very Unsatisfied) → 5 (Very Satisfied)

2. **Work & Career**
   - Question: "How satisfied are you with your work and career progress?"

3. **Confidence & Self-Worth**
   - Question: "How would you rate your overall confidence and self-worth?"

4. **Romantic Relationship**
   - Question: "How satisfied are you with your romantic relationship?" (or "relationship life" if single)

5. **Social Life & Friendships**
   - Question: "How satisfied are you with your social life and friendships?"

**UI Specifications:**
- Large, draggable slider with haptic feedback
- Visual rating dots (5 circles) that fill as slider moves
- Animated bubble that shows current rating value
- Smooth transitions between ratings
- Color gradients (red/orange for low → green for high)

**Step 3: Constraint Question**
- **Question**: "What's the one thing holding you back the most right now?"
- **Purpose**: Identifies primary obstacle for focused coaching
- **Input**: Text area, encourages thoughtful reflection

**Step 4: Big Five Personality Assessment (BFI-13)**

Scientifically validated 13-item personality assessment measuring five traits:

**The Five Traits:**
1. **Extraversion** (2 questions)
2. **Agreeableness** (2 questions)
3. **Conscientiousness** (3 questions)
4. **Neuroticism** (2 questions)
5. **Openness** (4 questions)

**Question Format:**
- Statement: "I see myself as someone who..."
- Scale: 1 (Disagree Strongly) → 5 (Agree Strongly)
- Visual: Same slider/bubble interface as fulfillment questions

**Example Questions:**
- "I see myself as someone who is outgoing, sociable" (Extraversion)
- "In social situations, I usually stay in the background" (Extraversion - reverse scored)
- "I am generally trusting of other people" (Agreeableness)
- "When I do something, I try to do a very thorough job" (Conscientiousness)
- "I tend to get nervous very easily" (Neuroticism)
- "I have a very active imagination" (Openness)

**Technical Details:**
- Some items are reverse-scored for validation
- All questions presented one at a time
- Progress indicator shows X of 13
- Can navigate back to previous questions

**Step 5: Values Assessment (Schwartz Values Survey)**

Three-screen ranking exercise to identify core values.

**Screen 1: First Ranking**
- Present 5 random values from the 10 total
- User drag-and-drop to rank from most to least important
- Values presented:
  - Own Your Time (Self-Direction)
  - New Experiences (Stimulation)
  - Fun and Pleasure (Hedonism)
  - Achieve Success (Achievement)
  - Have Control (Power)
  - Feel Safe (Security)
  - Be Liked by Others (Conformity)
  - Honor Tradition (Tradition)
  - Generosity (Benevolence)
  - Equality and Inclusion (Universalism)

**Screen 2: Second Ranking**
- Present the remaining 5 values
- Same drag-and-drop ranking interface
- Smooth animations and haptic feedback

**Screen 3: Final Ranking**
- Present top 3 from each previous screen (6 total)
- User ranks these to determine absolute priorities
- This reveals the user's core value hierarchy

**UI Specifications:**
- Beautiful card-based design for each value
- Drag handles with clear affordances
- Real-time reordering with smooth animations
- Progress indicator: "Step 1 of 3", "Step 2 of 3", "Step 3 of 3"
- "Continue" button appears after ranking is complete

**Step 6: Open-Ended Reflection Questions**

Two deep reflection questions for qualitative insights:

**Question 1: "What do you want?"**
- Full prompt: "Think about your life as a whole. What do you truly want? Not what you think you should want—what you actually want."
- Input: Multi-line text area
- Minimum: 20 characters
- Purpose: Uncovers authentic desires vs. societal expectations

**Question 2: "What are you avoiding?"**
- Full prompt: "What truth or reality are you avoiding looking at directly? What makes you uncomfortable to think about?"
- Input: Multi-line text area
- Minimum: 20 characters
- Purpose: Identifies areas of resistance and growth opportunities

**UI Specifications:**
- Large text area with comfortable typing space
- Character count visible
- Soft validation (encourages depth but allows submission)
- Autosave functionality
- Can navigate back to edit previous question

**Step 7: Processing & Submission**

**Processing Screen**
- **Visual**: Animated Fermi logo with pulsing glow rings
- **Messages** (rotate every 1.5 seconds):
  1. "Analyzing your responses..."
  2. "Understanding your values..."
  3. "Mapping your personality..."
  4. "Crafting your personalized journey..."
  5. "Almost ready..."
- **Progress bar**: Fills smoothly from 0% to 100%
- **Duration**: Approximately 7.5 seconds total
- **Bottom text**: "I'm learning about you so I can provide the most helpful guidance for your unique journey."

**Behind the Scenes:**
- All assessment data is batched and submitted to backend
- Backend generates personalized "You Report"
- User state marked as "onboarding complete"
- Onboarding data cleaned from local storage after successful submission

**Intro Assessment Screen (Before Questions Begin)**
- **Visual**: Speech bubble from Fermi introducing himself
- **Content**:
  - "Hi, I'm Fermi 👋"
  - "Nice to meet you"
  - "I'm going to ask you a series of questions to help me understand you better. This will help me give you personalized advice immediately."
  - "It will only take a few minutes. Are you ready?"
- **Actions**:
  - "Let's do this!" button (enabled after animations complete)
  - ATT (App Tracking Transparency) permission requested after clicking continue (iOS only)
- **Design**: Animated entrance, pulsing Fermi logo

**Assessment Navigation**
- **Header**: Stepper showing progress (e.g., "7 of 30")
- **Back button**: Allows navigating to previous question
- **Next/Continue**: Advances when answer provided
- **Visual**: Smooth page transitions with fade animations

#### 1.3 Post-Assessment Experience

After the processing screen completes:

**Account Creation**
- Redirect to Clerk authentication
- Sign up with email or social providers (Google, Apple)
- Email verification via OTP
- Sets user's Clerk ID and syncs with backend

**Legal Disclaimer Modal**
- **Trigger**: Appears after sign-up (controlled by feature flag)
- **Content**: Important disclaimers
  - Purpose is for coaching, not therapy
  - Not a substitute for professional mental health care
  - Emergency resources provided if in crisis
- **Actions**: "I Understand and Accept" to proceed
- **Requirement**: Must accept to use the app

**Initial Chat Experience**
- User lands on chat screen with special parameters:
  - `showChatLoader: false` (skip loading animation)
  - `showDisclaimer: true` (show legal disclaimer first if flagged)
  - `startOnboardingConversation: true` (triggers initial message)
- Fermi automatically sends first message: `/onboarding` command
- This triggers backend to generate and deliver the "You Report"

---

### 2. Chat Interface

The chat is the primary interaction surface—an iMessage-style conversational interface with Fermi.

#### 2.1 Chat Screen Layout

**Header**
- **Left**: Back button (only shown when Quests/Journey tabs are enabled)
- **Center**: "Chat" title or app logo
- **Right**: Settings/Account icon
- **Theme**: Adapts to light/dark mode
- **Trial Banner**: Shows trial status if user is in trial period

**Message List**
- **Scrollable area**: Displays conversation history
- **Message bubbles**:
  - User messages: Right-aligned, distinct color
  - Fermi messages: Left-aligned with Fermi avatar
- **Timestamps**: Grouped by day with date separators
- **Pull to refresh**: Load previous messages
- **Infinite scroll**: Pagination loads older messages on scroll up
- **Typing indicator**: Animated dots when Fermi is responding

**Input Area (Bottom)**
- **Text input**: Multi-line text field
- **Voice button**: Record voice input (appears on iOS)
- **Send button**: Sends message (disabled while streaming)
- **Reply indicator**: Shows when replying to specific message (with cancel)
- **Keyboard avoiding**: Interface adjusts when keyboard appears

#### 2.2 Chat Functionality

**Sending Messages**
- User types message and taps send
- Message immediately appears in chat
- Fermi begins typing indicator
- Streaming response appears token-by-token
- **Haptic feedback** on message send
- **Analytics tracking**: Message length, reply context, conversation length

**Message Interactions**
- **Swipe right on message**: Initiates reply to that message
- **Long press message**: Opens action popup menu
  - Reply option
  - Copy text
  - (Future: React with emoji, Share)
- **Tap message**: Dismiss keyboard if open

**Streaming Response Behavior**
- Fermi's responses stream in real-time (token-by-token)
- **Pacing system**:
  - Minimum delay between message bubbles
  - Reading speed simulation (tokens per second)
  - Configurable pacing speed factor
  - Makes responses feel natural, not robotic
- **Message segmentation**: Long responses broken into multiple bubbles
- **Streaming states**:
  - Active streaming (tokens appearing)
  - Typing indicator (between bubbles)
  - Completed (full message visible)

**Chat History Management**
- **Initial load**: Fetches last 20 messages (configurable)
- **Pagination**: Load more on scroll to top
- **Pull to refresh**: Manually refresh chat history
- **Automatic refresh**: After streaming completes
- **Persistence**: All messages stored server-side
- **Sync behavior**: Updates reflect latest server state

**Chat Loader Experience**
- **When**: Shows on first chat visit or after long absence
- **Visual**: Full-screen overlay with animated Fermi logo
- **Content**: Random inspirational quote from curated list
- **Duration**: Minimum 2 seconds, maximum 10 seconds
- **Transition**: Smooth fade-out with "finishing" animation
- **Skip conditions**: Can be disabled via URL parameter

#### 2.3 Special Message Types

**Personal Report Card**
- **Appearance**: Special card UI embedded in chat
- **Content**: "Your Insights Are Ready" with preview
- **Action**: Tap to open full Personal Insights screen
- **Timing**: Appears after onboarding completion (15-30 seconds)
- **Visual**: Distinct from regular messages, eye-catching design

**System Messages**
- Tools used by Fermi (e.g., notification permission prompt)
- Filtered from display in most contexts
- Special rendering for certain tool results

**Welcome Back Banner**
- **Trigger**: User opens app from notification
- **Visual**: Banner at top of screen
- **Duration**: Auto-dismisses after 3 seconds
- **Content**: "Welcome back!" message
- **Animation**: Slide down entrance, fade out exit

#### 2.4 Voice Input (iOS)

**Voice Recording**
- **Activation**: Hold voice button in input area
- **Visual**: Waveform animation showing audio input
- **Feedback**: Haptic feedback on start/stop
- **Cancel**: Slide finger to cancel area
- **Send**: Release button to send
- **Processing**: Audio transcribed to text via backend
- **Result**: Transcribed text appears as user message

**Voice Playback (Future)**
- Text-to-speech for Fermi's responses
- Toggle to enable voice mode
- Natural-sounding AI voice

#### 2.5 Chat Settings & Features

**Context Window**
- Chat sends last 20 messages to AI for context
- Includes user's timezone for time-aware responses
- Profile data and assessment results available to AI

**Error Handling**
- Network errors: User-friendly alert with retry option
- Streaming errors: Message saved partially, user can retry
- Offline mode: Queue messages for sending when online

**Chat-Entry Paywall**
- Non-premium users see paywall before first message
- Premium users have unlimited access
- Trial users get full access during trial period

---

### 3. Quests System

**Quests** are bite-sized, psychometrically-designed prompts that help Fermi learn more about the user and provide daily engagement points.

#### 3.1 Quests Screen Layout

**Header**
- **Title**: "Your Quests"
- **Subtitle**: "Joined [Month Year]" (user join date)
- **Font**: Large, elegant serif font
- **Theme**: Matches app theme (light/dark)

**Quest Cards List**
- **Layout**: Vertical scrolling list
- **Card Design**:
  - Gradient background (varies by quest type)
  - Quest title and description
  - Quest status (new, in-progress, completed)
  - Estimated time to complete
  - Visual icon/illustration
- **Empty State**: "No quests available today. Check back tomorrow!"
- **Pull to refresh**: Refreshes quest list from server
- **Loading state**: Skeleton cards while loading

#### 3.2 Quest Types

**1. Likert Scale Quests**
- **Format**: Statement with 1-5 rating scale
- **Example**: "I feel energized by social interactions"
- **UI**: Slider with labeled points
- **Use case**: Measuring attitudes, agreement, frequency

**2. Open-Ended Reflection Quests**
- **Format**: Thought-provoking question
- **Example**: "What would you do if you knew you couldn't fail?"
- **UI**: Large text area for written response
- **Use case**: Deep reflection, qualitative insights

**3. Spark/Fast Choice Quests (FC)**
- **Format**: Quick decision between options
- **Example**: "Which energizes you more?" [A) Solo time, B) Being with friends]
- **UI**: Two large choice buttons
- **Use case**: Value trade-offs, preference discovery

**4. Ranking Quests (Ordered)**
- **Format**: Rank items by importance/preference
- **Example**: "Rank these life areas by priority: Career, Health, Relationships, Creativity"
- **UI**: Drag-and-drop reorderable list
- **Use case**: Priority clarification, value hierarchies

#### 3.3 Quest Interaction Flow

**Opening a Quest**
- User taps quest card from quests screen
- Modal slides up with gradient background (color matches quest type)
- **Header**:
  - Quest type label (e.g., "Scale Quest", "Reflection Quest")
  - Quest name
  - "X of Y" indicator if multi-part
  - Close button (X)
- **Body**: Full-screen quest content
- **Start Quest API call**: Tracks quest start timestamp

**Completing Quest Interactions**
- User provides answer (scale rating, text, choice, ranking)
- "Continue" or "Submit" button enabled when valid answer given
- **Submit answer**: API call with interaction ID and response
- **Multi-part quests**: Automatically advances to next interaction
- **Single quests**: Shows completion modal

**Quest Completion Modal**
- **Trigger**: After final interaction submitted
- **Visual**:
  - Animated checkmark or success animation
  - Encouraging message ("Great work!", "Quest complete!")
  - XP/points earned display (if gamification enabled)
  - Optional: Preview of next quest
- **Actions**:
  - "Close" → Returns to quests list
  - "Do Another" → Opens next available quest
- **Sound**: Success sound effect (level-up chime)
- **Haptics**: Success haptic feedback

**Quest States**
- **Available**: Ready to start (rendered as cards)
- **In Progress**: Partially completed (can resume)
- **Completed**: Finished (shows checkmark, grayed out)
- **Locked**: Not yet available (future feature)

#### 3.4 Quest Assignment Logic (Backend)

- Quests are assigned daily based on:
  - User's personality profile
  - Previous quest responses
  - Areas needing deeper exploration
  - Engagement patterns
- Algorithm ensures variety and relevance
- User typically gets 2-5 quests per day

#### 3.5 Quest Analytics

**Tracked Events**:
- Quest screen viewed
- Quest selected
- Quest started
- Interaction completed
- Quest completed
- Quest dismissed/canceled
- Time spent on quest

**Metrics**:
- Daily quest completion rate
- Quest type preferences
- Average completion time
- Drop-off points

---

### 4. Journey Page (In Development)

The Journey page is a visual timeline of the user's growth, insights, and milestones with Purpose.

#### 4.1 Planned Features

**Timeline View**
- Chronological scroll of user's journey
- Key milestones marked with special cards:
  - First session
  - Assessment completed
  - First breakthrough insight
  - Streak milestones (7-day, 30-day, 100-day)
  - Quest completion milestones

**Insights & Reports Section**
- Library of all generated reports
- Personal Insights Report (from onboarding)
- Weekly reports archive
- Monthly summaries
- Ability to regenerate/update reports

**Achievements & Gamification**
- Visual achievement badges
- Completion percentages
- Streak tracking
- XP/level system (optional)

**Nostalgic Highlights**
- "One year ago today" memories
- Significant conversation snippets
- Before/after comparisons
- Progress visualization charts

#### 4.2 Current Implementation Status

**Achievements Modal** (Partially built)
- Grid of achievement cards
- Shows earned vs. locked achievements
- Rarity tiers: Common, Rare, Epic, Legendary
- Achievement categories:
  - Streak achievements (7-day, 30-day)
  - Insight achievements (discoveries)
  - Goal achievements (completed objectives)
  - Consistency achievements (total days)
- Stats display: Earned / Total / Completion %
- Color-coded by rarity with gradient backgrounds

**Insights Reports Modal** (Stubbed)
- Placeholder for accessing past reports
- Will integrate with backend reports API

**Note**: Journey tab is feature-flagged and not yet available to users. The foundational components exist but need full integration.

---

### 5. Personal Insights Report

The **Personal Insights Report** is Purpose's "Spotify Wrapped" moment—a beautifully designed, data-driven profile generated from the onboarding assessment.

#### 5.1 Report Generation

**Timing**
- Generated on backend after onboarding processing completes
- Typically ready 15-30 seconds after processing screen
- Frontend polls backend every 15 seconds (max 5 retries)
- When ready, appears as special card in chat

**Input Data**
- All onboarding assessment responses:
  - Demographics
  - Life fulfillment ratings
  - BFI-13 personality scores
  - Schwartz values rankings
  - Open-ended reflections
  - Primary constraint

**Report Structure**
```json
{
  "title": "Your Personal Insights",
  "openingInsight": "You've built a life that runs like a well-tuned product...",
  "sections": [
    {
      "id": "multitudes",
      "title": "Your Multitudes",
      "order": 1,
      "content": "Full markdown content..."
    },
    {
      "id": "superpowers",
      "title": "Your Superpowers",
      "order": 2,
      "content": "Full markdown content..."
    },
    // ... more sections
  ]
}
```

#### 5.2 Report Sections

Each report contains 4-6 sections, ordered intentionally:

**1. Your Multitudes**
- **Purpose**: Holistic personality profile
- **Based on**: Big Five personality dimensions
- **Content**:
  - Trait scores and interpretations
  - How traits interact and manifest
  - Nuanced view of user's personality
- **Icon**: Multifaceted gem image

**2. Your Superpowers**
- **Purpose**: Strengths and natural advantages
- **Based on**: High-scoring traits + values alignment
- **Content**:
  - 3-5 key strengths
  - How to leverage them
  - Real-world applications
- **Icon**: Lightning/power image

**3. Your Blind Spots**
- **Purpose**: Areas of growth opportunity
- **Based on**: Low fulfillment ratings + constraint question
- **Content**:
  - Patterns user might not see
  - Potential areas of avoidance
  - Gentle reframes of weaknesses
- **Icon**: Eye/vision image

**4. Your Growth Opportunities**
- **Purpose**: Actionable next steps
- **Based on**: Gaps between values and fulfillment
- **Content**:
  - Specific areas to explore
  - Practical starting points
  - Connected to what matters most
- **Icon**: Seedling/growth image

**5. Closing Reflection** (Optional)
- **Purpose**: Inspirational wrap-up
- **Content**: Personalized encouragement and call-to-action
- **Icon**: Sunset/journey image

#### 5.3 Report UI/UX

**Report Card in Chat**
- **Visual**: Distinct card design, stands out from messages
- **Content**:
  - "Your Insights Are Ready" headline
  - Preview text or image
  - "Tap to explore" call-to-action
- **Interaction**: Taps anywhere on card → Opens full report screen

**Full Report Screen**

**Header**
- Back button (left)
- "Your personal insights" title (center)
- Empty space (right, for symmetry)
- Fixed header on scroll

**Content**
- **Report title**: Large, centered, bold
- **Opening insight**: Centered paragraph below title
- **Sections list**: Scrollable cards
  - Each section = tappable card
  - Section icon/image (left)
  - Section title (center)
  - Checkmark if viewed, arrow if not (right)
  - Card styling: Rounded, elevated, border
  - Animation: Staggered fade-in on load

**Section Detail View**
- **Header**: Back button, section title, next button
- **Content**:
  - Full section content (markdown rendered)
  - Rich text formatting
  - Bullet points, emphasis, paragraphs
  - Optimized for reading (generous spacing, readable font size)
- **Navigation**:
  - Back → Returns to section list
  - Next → Opens next section
  - Auto-marks section as "viewed" when opened

**Progress Tracking**
- Viewed sections tracked locally (AsyncStorage)
- Persisted per report (keyed by questInstanceId)
- Checkmarks update in real-time
- Completion encourages exploring all sections

**Navigation Flow**
```
Chat Screen
    ↓ (tap report card)
Report List Screen (all sections)
    ↓ (tap section)
Section Detail Screen
    ↓ (tap next)
Next Section Detail
    ... (continue through all)
    ↓ (after last section)
Back to Chat Screen
```

#### 5.4 Report Regeneration (Future)

- Ability to request updated report after months of usage
- "See how you've changed" feature
- Compare old vs. new reports side-by-side

---

## Technical Requirements

### Frontend Technical Stack
- **Framework**: React Native with Expo
- **Navigation**: Expo Router (file-based routing)
- **State Management**:
  - Zustand for client state (onboarding, submissions)
  - TanStack Query (React Query) for server state
- **Authentication**: Clerk (email, OAuth, OTP)
- **Styling**: NativeWind (Tailwind for React Native)
- **Themes**: Custom theme system with light/dark mode support
- **Animations**:
  - React Native Reanimated
  - React Native Animatable
  - Lottie (for complex animations)
- **API Communication**:
  - Fetch API with auth middleware
  - Streaming support for chat (Server-Sent Events)
- **Storage**: AsyncStorage for local persistence
- **Analytics**:
  - PostHog for product analytics
  - Custom analytics layer with domain-specific tracking
  - AppsFlyer for attribution
  - Customer.io for messaging
- **Error Tracking**: Sentry
- **Notifications**: Expo Notifications
- **Payments**: RevenueCat (subscription management)
- **Paywalls**: Superwall (paywall presentation)
- **Testing**: Jest + React Native Testing Library

### Backend Technical Stack
- **Infrastructure**: AWS (CDK-managed)
- **API**: REST APIs via AWS API Gateway + Lambda
- **Streaming**: Server-Sent Events for chat streaming
- **Database**: DynamoDB (user data, conversations, assessments)
- **AI/LLM**:
  - Claude (Anthropic) – primary conversational AI
  - GPT (OpenAI) – alternative/backup
  - Tool use capabilities (function calling)
- **Authentication**: Clerk JWT validation
- **Storage**: S3 for assets
- **Monitoring**: CloudWatch, Sentry
- **Voice**: Transcription API for voice-to-text

### API Endpoints (Key Routes)

**Chat**
- `POST /chat/stream` – Streaming chat responses
- `GET /chat/history` – Fetch chat history (paginated)
- `POST /chat/message` – Send message (non-streaming fallback)

**Quests**
- `GET /quests` – List available quests
- `POST /quests/{questId}/start` – Start a quest
- `POST /quests/{questId}/submit` – Submit quest answers
- `GET /quests/{questInstanceId}/report` – Get quest report (You Report)

**User**
- `GET /users/me` – Get current user profile
- `PUT /users/me` – Update user profile
- `GET /users/me/stats` – Get user statistics
- `POST /users/me/settings` – Update user settings

**Onboarding**
- `POST /onboarding/submit` – Submit onboarding assessment data
- `GET /onboarding/status` – Check onboarding completion status

**Feedback**
- `POST /feedback` – Submit user feedback

**Notifications**
- `POST /notifications/register` – Register push notification token
- `PUT /notifications/settings` – Update notification preferences

### Data Models

**User Profile**
```typescript
{
  userId: string (Clerk ID)
  email: string
  createdAt: timestamp
  onboardingComplete: boolean
  questInstanceId: string (from onboarding)
  assessmentData: {
    demographics: { age, gender, occupation }
    fulfillment: { health, work, confidence, relationships, social }
    constraint: string
    bfi: { q01: 1-5, q02: 1-5, ... }
    schwartz: { top3: string[], ranked: string[] }
    openQuestions: { q1: string, q2: string }
  }
  personalityScores: {
    extraversion: number
    agreeableness: number
    conscientiousness: number
    neuroticism: number
    openness: number
  }
  coreValues: string[]
  notificationPreferences: { ... }
  subscriptionStatus: 'trial' | 'premium' | 'expired'
}
```

**Chat Message**
```typescript
{
  messageId: string
  userId: string
  conversationId: string
  sender: 'user' | 'assistant'
  content: string
  timestamp: ISO8601 string
  metadata?: {
    model: string
    tokens: number
    toolCalls?: ToolCall[]
    replyTo?: string
  }
}
```

**Quest**
```typescript
{
  questId: string
  questName: string
  questDescription: string
  questType: 'Likert' | 'OE' | 'FC' | 'Ordered'
  status: 'available' | 'in_progress' | 'completed'
  interactions: [
    {
      interactionId: string
      type: 'Likert' | 'OE' | 'FC' | 'Ordered'
      prompt: string
      options?: string[] (for FC, Ordered)
      scale?: { min: 1, max: 5, labels } (for Likert)
    }
  ]
  estimatedMinutes: number
  createdAt: timestamp
}
```

**Quest Report (You Report)**
```typescript
{
  questInstanceId: string
  userId: string
  title: string
  openingInsight: string (html/markdown)
  sections: [
    {
      id: string
      title: string
      order: number
      content: string (markdown)
    }
  ]
  generatedAt: timestamp
}
```

---

## User Experience Principles

### Design Philosophy
1. **Minimalist & Focused** – Remove distractions, emphasize content
2. **Conversational & Human** – Feel like talking to a friend, not a robot
3. **Delightful Interactions** – Smooth animations, thoughtful haptics, polished details
4. **Accessible & Inclusive** – Support light/dark mode, readable fonts, clear hierarchy
5. **Fast & Responsive** – Minimal loading states, optimistic UI updates, stream responses

### Animation Guidelines
- **Entrance animations**: FadeInUp or FadeInDown, 600-800ms
- **Staggered lists**: Delay each item by 100ms for cascade effect
- **Loading states**: Pulsing or shimmer effects, never static
- **Transitions**: Smooth page changes, 300-400ms
- **Feedback**: Immediate haptic and visual response to interactions

### Typography
- **Primary font**: SF Pro Display (iOS-style, modern, clean)
- **Secondary font**: Gentium Plus or Cormorant Garamond (serif for elegance)
- **Hierarchy**:
  - Titles: 28-34pt, bold
  - Body: 16-17pt, regular
  - Captions: 13-14pt, medium
- **Line height**: Generous (1.4-1.6) for readability

### Color System
- **Themes**: Light and dark mode fully supported
- **Primary colors**: Purple/indigo family (coaching, wisdom)
- **Accent colors**: Gradient backgrounds for quests, reports
- **Semantic colors**: Green (success), Red (error), Amber (warning)
- **Neutrals**: Layered grays for depth and hierarchy

### Haptic Feedback
- **Light**: Taps, selections, minor interactions
- **Medium**: Confirmations, submissions, completions
- **Heavy**: Errors, major milestones
- **Success**: Special pattern for achievements

### Sound Design
- **Tap**: Subtle click for button presses
- **Send**: Satisfying "whoosh" for message send
- **Level-up**: Celebratory chime for quest completion
- **Error**: Gentle alert tone
- **Volume**: Respectful and not annoying (low volume by default)

---

## Analytics & Tracking

### Analytics Architecture
- **Unified analytics layer** with domain-specific modules
- **Domains**:
  - Application Lifecycle
  - Auth
  - FTUE (onboarding)
  - Chat
  - Quests
  - Monetization
  - Profile
  - Content
  - Feature Usage
  - Engagement & Retention
  - Privacy & Consent
  - System Errors

### Key Metrics & Events

**Onboarding/FTUE**
- `ftue_intro_screen_viewed`
- `ftue_intro_continue_clicked`
- `ftue_assessment_started`
- `ftue_step_completed` (per step)
- `ftue_step_skipped`
- `ftue_assessment_abandoned` (drop-off tracking)
- `ftue_processing_started`
- `ftue_onboarding_completed`

**Chat**
- `chat_screen_viewed`
- `chat_session_started`
- `chat_message_sent`
- `chat_message_completed`
- `chat_reply_initiated`
- `chat_message_popup_opened`
- `chat_tool_used`
- `chat_error`

**Quests**
- `quests_screen_viewed`
- `quest_selected`
- `quest_started`
- `quest_interaction_completed`
- `quest_completed`
- `quest_modal_closed`
- `quest_completion_modal_closed`

**Monetization**
- `paywall_viewed`
- `paywall_dismissed`
- `subscription_started`
- `trial_started`
- `subscription_renewed`
- `subscription_cancelled`

**Engagement**
- `app_opened`
- `app_backgrounded`
- `session_duration`
- `daily_active_user`
- `weekly_active_user`
- `streak_achieved`
- `return_after_absence`

### Retention Metrics
- **Day 1 Retention**: % users who return day after install
- **Day 7 Retention**: % users still active after 7 days
- **Day 30 Retention**: % users still active after 30 days (North Star)
- **Paid Retention**: % paid users still subscribed after 30/60/90 days

---

## Monetization & Access Control

### Subscription Model

**Pricing Tiers** (Subject to change)
- **7-day free trial** – Full access, no payment required upfront
- **Weekly**: $7/week
- **Monthly**: $20/month (most popular)
- **Yearly**: $150/year (best value, 37% savings)

**Trial Behavior**
- Trial starts immediately after account creation
- User gets full access to all features
- RevenueCat manages trial clock
- Push notifications to remind users before trial ends
- Paywall surfaces 1-2 days before expiration

**Subscription Management**
- Managed via RevenueCat SDK
- iOS: Apple In-App Purchases
- Android: Google Play Billing
- Paywall presentation via Superwall
- Cancellation through OS settings

### Paywall Strategy

**Paywall Triggers**
1. **Chat Entry Paywall**
   - Non-premium users without active trial
   - Appears before accessing chat after trial expiry
   - Soft block with upgrade CTA

2. **App Open Paywall**
   - Shown to trial users approaching expiration
   - Can dismiss, but shown daily

3. **Account Settings Paywall**
   - Accessing settings/profile for expired users
   - Encourages resubscription

4. **Message Threshold Paywall** (Optional)
   - After X messages in trial, soft paywall reminder
   - "Loving Purpose? Subscribe to keep going"

**Paywall Design**
- Beautiful, non-intrusive presentation
- Highlights value props:
  - Unlimited coaching conversations
  - Personalized daily quests
  - Weekly insights & reports
  - Voice mode (coming soon)
- Social proof: "Join 10,000+ people finding clarity"
- Clear pricing with free trial callout
- Easy dismiss option (early in trial)

### Feature Gating

**Always Free** (Pre-signup)
- Welcome screens
- Age disclaimer
- Onboarding assessment
- "You Report" viewing

**Requires Account** (Free trial or paid)
- Chat with Fermi
- Daily quests
- Journey page
- Weekly reports
- Voice input
- Profile settings

**Premium Only** (Future)
- Advanced analytics
- Unlimited voice mode
- Priority AI response time
- Export data/reports

### Subscription Feature Flags
- `useSubscriptionFeatureFlags` hook checks entitlements
- RevenueCat entitlements: `pro`, `premium`, etc.
- Graceful degradation if subscription check fails

---

## Legal & Compliance

### Terms & Disclaimers

**Pre-Use Disclaimers**
- **Age gate**: Must be 18+ to use
- **Legal terms acceptance**: Required before first use
- **Privacy policy**: Available and linked
- **Terms of service**: Available and linked

**Coaching vs. Therapy Disclaimer**
- Clear messaging: "Purpose is for coaching, not therapy"
- Not a substitute for professional mental health care
- Not licensed therapists
- Crisis resources provided:
  - National Suicide Prevention Lifeline
  - Crisis Text Line
  - Emergency services (911)

**Data Handling**
- User data stored securely (AWS, encrypted)
- User can request data export
- User can request account deletion
- Data deletion must complete within 30 days
- No selling of user data

### Privacy & Consent

**Data Collection Transparency**
- Clear explanation of what data is collected:
  - Assessment responses
  - Chat conversations
  - Usage analytics
  - Device identifiers
- Why data is collected:
  - Personalize coaching
  - Improve AI responses
  - Measure product effectiveness

**App Tracking Transparency (ATT)**
- iOS requirement for tracking across apps/sites
- Prompt shown after onboarding intro
- User can decline without losing functionality
- Tracks consent in analytics

**GDPR & COPPA Compliance**
- GDPR: Right to access, deletion, portability (EU users)
- COPPA: No users under 13 (enforced via age gate)
- Cookie/tracking consent (web version)

### Ethical Guidelines

**AI Behavior Guardrails**
- Never shame or judge users
- Never provide medical advice
- Never provide legal advice
- Recognize crisis situations and offer resources
- Maintain confidentiality (user data not shared)
- Transparent about being AI (not pretending to be human)
- Bias monitoring and correction

**Content Moderation**
- Flag harmful content (self-harm, violence, illegal activity)
- Escalation protocols for crisis situations
- User can report inappropriate AI responses

---

## Implementation Priorities

### Phase 1: MVP (Current State)
✅ Complete onboarding flow with assessments
✅ Real-time chat with streaming responses
✅ Personal Insights Report ("You Report")
✅ Daily quests system (basic)
✅ Authentication & user accounts
✅ Subscription management & paywalls
✅ Analytics tracking
✅ Light/dark theme support

### Phase 2: Enhancement (In Progress)
🔄 Journey page (timeline, achievements)
🔄 Voice mode (voice-to-text complete, text-to-voice needed)
🔄 Weekly reports generation
🔄 Enhanced gamification (XP, levels)
🔄 Quest variety expansion

### Phase 3: Scale (Future)
⏳ Android optimization
⏳ Web responsive version
⏳ Social features (share insights, compare anonymously)
⏳ Integration with wearables (health data)
⏳ Advanced analytics dashboard (user-facing)
⏳ Group coaching features
⏳ Referral program

---

## Success Criteria

### Product Success Metrics
- **Onboarding completion rate**: >70% of installs complete assessment
- **Day 1 retention**: >50%
- **Day 30 retention**: >30% (North Star)
- **Trial-to-paid conversion**: >15%
- **Paid 30-day retention**: >70%
- **Daily active users**: Steady growth month-over-month
- **Chat engagement**: Average 3+ messages per session
- **Quest completion rate**: >60% of available quests completed

### User Experience Goals
- **Chat response time**: Median <2 seconds
- **Onboarding time**: 10-15 minutes average
- **App crash rate**: <0.1%
- **User satisfaction**: NPS >50
- **Clarity Score**: Custom metric showing self-reported clarity improvement

---

## Appendix: Key User Flows

### Flow 1: Complete First-Time User Journey
```
1. Install app from App Store
2. Open app → Welcome screen
3. Tap "Get Started" → Age disclaimer
4. Confirm 18+ → Before We Begin screen
5. Tap "Begin Assessment" → Intro Assessment with Fermi
6. Tap "Let's do this!" → ATT permission (iOS)
7. Complete demographics (age, gender, occupation)
8. Complete life fulfillment assessment (5 areas)
9. Answer constraint question
10. Complete BFI-13 (13 questions)
11. Complete Schwartz ranking (3 screens)
12. Answer open-ended questions (2 questions)
13. Processing screen (7.5 seconds)
14. Sign up / create account (Clerk)
15. Accept legal disclaimer
16. Land on chat screen
17. Fermi sends You Report card
18. User taps to view full report
19. Explore report sections
20. Return to chat → continue conversation
21. [Later] Get notification → return to chat
22. [Later] Check out daily quests
```

### Flow 2: Daily Returning User
```
1. Open app (from home screen or notification)
2. [If expired] See paywall → upgrade or dismiss
3. Land on chat screen
4. See welcome back banner (if from notification)
5. Continue conversation with Fermi
6. OR tap Quests tab
7. See 2-5 new daily quests
8. Tap quest → complete interactions
9. Receive completion feedback
10. Return to chat to discuss quest insights
11. Close app → background
```

### Flow 3: Quest Completion
```
1. Open Quests tab
2. See list of available quests
3. Tap quest card → Quest modal opens
4. Read quest prompt
5. Provide answer (scale, text, choice, ranking)
6. Tap Continue
7. [If multi-part] Complete next interaction
8. [If last] See completion modal
9. Celebrate with animation & sound
10. Tap Close → back to quests list
11. Quest now shows as completed with checkmark
```

---

## Final Notes

This specification represents the **current working state** of the Purpose mobile application. The focus is on:

1. **Onboarding/FTUE**: Complete, polished, scientifically-validated psychometric assessments that give Fermi deep user understanding immediately
2. **Chat**: Real-time, streaming conversational interface that feels natural and responsive
3. **Quests**: Engaging daily touchpoints that deepen Fermi's knowledge and provide value between chat sessions
4. **Personal Insights Report**: Delightful "Spotify Wrapped" moment that shows users we understand them

**Journey page** is partially implemented but not complete. Focus on getting the core loop perfect before expanding.

The product should feel **premium, polished, and personal**—not like a generic chatbot, but like a deeply knowledgeable coach who genuinely understands you.

**Tone**: Empathetic, insightful, direct, no-BS
**Quality bar**: Every interaction should feel intentional and valuable
**North Star**: 30-day paid retention—are users getting enough value to stay?

---

*End of Specification*
