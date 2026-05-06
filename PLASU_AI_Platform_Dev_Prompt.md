# PLASU AI-Enabled Learning Repository — Master Development Prompt

> **Instructions for the implementing LLM:**
> This document is a complete, self-contained specification for building the PLASU AI Learning Platform end-to-end.
> Work **feature by feature** in the order listed. After fully implementing and verifying a feature, **replace its checkbox `[ ]` with `[x]`**.
> Do not skip ahead. Each feature builds on the previous.

---

## 🏛️ Project Overview

**Project Name:** PLASU Academic Intelligence Platform (PAIP)
**Institution:** Plateau State University (PLASU), Bokkos, Nigeria
**Purpose:** An AI-enabled, web-based learning repository that allows students to interact with departmental handouts and past examination questions through a conversational RAG (Retrieval-Augmented Generation) interface. The system also includes exam simulation, analytics, gamification, collaborative tools, and a full admin/lecturer control panel.

---

## 🧱 Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | Next.js 14+ (App Router), TypeScript, Tailwind CSS, shadcn/ui |
| **Backend** | Node.js, **Fastify** (NOT Express), TypeScript |
| **AI / LLM** | OpenAI API (GPT-4o for chat, text-embedding-3-small for embeddings) |
| **Vector Database** | Pgvector (PostgreSQL extension) or Pinecone |
| **Relational Database** | PostgreSQL |
| **ORM** | Prisma |
| **Auth** | NextAuth.js (JWT strategy) |
| **File Storage** | Local filesystem (dev) / AWS S3 or Cloudinary (prod) |
| **PDF Parsing** | pdf-parse or LangChain document loaders |
| **Queue / Background Jobs** | BullMQ + Redis |
| **Realtime** | Socket.IO (for study group chat) |
| **Testing** | Vitest (unit), Playwright (E2E) |
| **Deployment** | Docker + Docker Compose |

---

## 📁 Monorepo Structure

```
/plasu-platform
├── apps/
│   ├── web/              # Next.js frontend
│   └── api/              # Fastify backend
├── packages/
│   ├── db/               # Prisma schema + migrations
│   ├── types/            # Shared TypeScript types
│   └── config/           # Shared ESLint, TS configs
├── docker-compose.yml
├── .env.example
└── README.md
```

---

## 🗂️ Feature Implementation Checklist

> **Rule:** Implement features in the exact order below. Check `[x]` only when the feature is fully working, tested, and integrated with the rest of the system.

---

## PHASE 1 — Foundation & Infrastructure

---

- [x] Feature 1: Project Scaffolding & Environment Setup

**Goal:** Establish the monorepo, shared configs, Docker environment, and base dependencies.

**Checklist:**
- [ ] Initialize a pnpm monorepo with `apps/web` (Next.js) and `apps/api` (Fastify)
- [ ] Set up shared `packages/types`, `packages/db`, `packages/config`
- [ ] Configure TypeScript (`tsconfig.json`) across all workspaces
- [ ] Configure ESLint + Prettier with shared config
- [ ] Set up `docker-compose.yml` with services: `postgres`, `redis`, `api`, `web`
- [ ] Create `.env.example` documenting all required environment variables
- [ ] Configure Prisma in `packages/db` connected to PostgreSQL
- [ ] Enable `pgvector` extension in PostgreSQL via migration
- [ ] Verify all services start with `docker compose up`

**Key Environment Variables to Document:**
```
DATABASE_URL=
REDIS_URL=
OPENAI_API_KEY=
NEXTAUTH_SECRET=
NEXTAUTH_URL=
JWT_SECRET=
AWS_S3_BUCKET= (optional)
AWS_ACCESS_KEY_ID= (optional)
AWS_SECRET_ACCESS_KEY= (optional)
```

---

- [x] Feature 2: Database Schema Design

**Goal:** Define all Prisma models that will support every feature in this document.

**Checklist:**
- [ ] Create `User` model with fields: `id`, `name`, `email`, `passwordHash`, `role` (ENUM: STUDENT, LECTURER, MODERATOR, ADMIN), `avatarUrl`, `points`, `createdAt`, `updatedAt`
- [ ] Create `Department` model: `id`, `name`, `code`, `description`
- [ ] Create `Course` model: `id`, `name`, `code`, `level`, `departmentId`, `semester`
- [ ] Create `Document` model: `id`, `title`, `type` (ENUM: HANDOUT, PAST_QUESTION), `courseId`, `uploadedById`, `filePath`, `fileSize`, `mimeType`, `version`, `isActive`, `tags` (String[]), `createdAt`
- [ ] Create `DocumentVersion` model for version control: `id`, `documentId`, `version`, `filePath`, `uploadedById`, `createdAt`
- [ ] Create `DocumentChunk` model: `id`, `documentId`, `content`, `chunkIndex`, `embedding` (vector type via pgvector)
- [ ] Create `ChatSession` model: `id`, `userId`, `courseId`, `title`, `createdAt`
- [ ] Create `ChatMessage` model: `id`, `sessionId`, `role` (user/assistant), `content`, `sourcesUsed` (JSON), `createdAt`
- [ ] Create `ExamSession` model: `id`, `userId`, `courseId`, `questions` (JSON), `answers` (JSON), `score`, `totalQuestions`, `completedAt`, `createdAt`
- [ ] Create `Bookmark` model: `id`, `userId`, `documentId`, `questionRef`, `note`, `createdAt`
- [ ] Create `StudyGroup` model: `id`, `name`, `courseId`, `createdById`, `members` (relation), `createdAt`
- [ ] Create `GroupMessage` model: `id`, `groupId`, `userId`, `content`, `createdAt`
- [ ] Create `ForumPost` model: `id`, `userId`, `courseId`, `title`, `content`, `tags` (String[]), `upvotes` (Int), `isFlagged`, `isApproved`, `createdAt`
- [ ] Create `ForumReply` model: `id`, `postId`, `userId`, `content`, `upvotes`, `createdAt`
- [ ] Create `Notification` model: `id`, `userId`, `type`, `title`, `body`, `isRead`, `metadata` (JSON), `createdAt`
- [ ] Create `Badge` model: `id`, `name`, `description`, `iconUrl`, `criteria` (JSON)
- [ ] Create `UserBadge` model: `id`, `userId`, `badgeId`, `awardedAt`
- [ ] Create `ActivityLog` model: `id`, `userId`, `action`, `metadata` (JSON), `createdAt`
- [ ] Run `prisma migrate dev` and verify all tables are created

---

- [x] Feature 3: Authentication System

**Goal:** Secure, role-based authentication for all users.

**Checklist:**
- [ ] Implement user registration endpoint `POST /api/auth/register` — accepts name, email, password, role; hashes password with bcrypt; returns JWT
- [ ] Implement login endpoint `POST /api/auth/login` — validates credentials, returns JWT access token + refresh token
- [ ] Implement token refresh endpoint `POST /api/auth/refresh`
- [ ] Implement logout endpoint `POST /api/auth/logout` (invalidate refresh token in Redis)
- [ ] Create Fastify `authenticate` preHandler plugin that verifies JWT on protected routes
- [ ] Create `requireRole(...roles)` preHandler for role-based access control
- [ ] Implement NextAuth.js on the frontend with credentials provider calling the Fastify API
- [ ] Build `/login` page with email/password form, error states, and loading state
- [ ] Build `/register` page with name, email, password, confirm password, role selector
- [ ] Implement protected route middleware in Next.js (redirect unauthenticated users)
- [ ] Build user profile page `GET /api/users/me` and frontend `/profile`
- [ ] Add password change endpoint `PUT /api/users/me/password`

---

## PHASE 2 — Core Admin Features

---

### Feature 4: Department & Course Management (Admin)

**Goal:** Admins can manage the academic catalogue that all content is organized under.

**Checklist:**
- [ ] `POST /api/admin/departments` — Create department (Admin only)
- [ ] `GET /api/departments` — List all departments (authenticated)
- [ ] `PUT /api/admin/departments/:id` — Update department
- [ ] `DELETE /api/admin/departments/:id` — Soft-delete department
- [ ] `POST /api/admin/courses` — Create course linked to a department
- [ ] `GET /api/courses` — List courses, filterable by `departmentId`, `level`, `semester`
- [ ] `PUT /api/admin/courses/:id` — Update course
- [ ] `DELETE /api/admin/courses/:id` — Soft-delete course
- [ ] Build admin UI: `/admin/departments` — list, create, edit, delete departments
- [ ] Build admin UI: `/admin/courses` — list, create, edit, delete courses with department selector

---

### Feature 5: Document Upload & Management (Admin / Lecturer)

**Goal:** Admins and lecturers can upload, categorize, and manage academic documents.

**Checklist:**
- [ ] `POST /api/documents/upload` — Multipart file upload (PDF only); save file to storage; create `Document` record; enqueue background processing job
- [ ] `GET /api/documents` — List documents, filterable by `courseId`, `type`, `tags`; paginated
- [ ] `GET /api/documents/:id` — Get document metadata and download URL
- [ ] `PUT /api/documents/:id` — Update document metadata (title, tags, courseId)
- [ ] `DELETE /api/documents/:id` — Soft-delete document (set `isActive = false`)
- [ ] Implement **AI-Assisted Auto-Tagging**: after upload, call OpenAI to suggest relevant tags based on document title + first 500 chars; save suggested tags to `Document.tags`
- [ ] Build admin UI: `/admin/documents` — searchable, filterable document table with upload button
- [ ] Build upload modal with drag-and-drop, file type validation (PDF only), course + type selector, tags input (with AI suggestion), progress bar
- [ ] Implement **Bulk Upload**: accept a ZIP file containing multiple PDFs; extract and process each file individually via the same pipeline
- [ ] `POST /api/documents/bulk-upload` — accept ZIP, extract PDFs, enqueue each for processing

---

### Feature 6: Document Version Control

**Goal:** Every update to a document creates a new version; old versions remain accessible.

**Checklist:**
- [ ] When `PUT /api/documents/:id` includes a new file, create a `DocumentVersion` record for the old file before overwriting
- [ ] `GET /api/documents/:id/versions` — List all versions of a document
- [ ] `GET /api/documents/:id/versions/:version` — Get download URL for a specific version
- [ ] `POST /api/documents/:id/restore/:version` — Restore a previous version as the current active version (creates a new version entry)
- [ ] Show version history in admin document detail view with timestamps and uploader info
- [ ] Allow students to view and download any previous version from the document detail page

---

### Feature 7: RAG Pipeline — Background Document Processing

**Goal:** After upload, documents are automatically chunked, embedded, and stored in the vector database for AI retrieval.

**Checklist:**
- [ ] Set up BullMQ with Redis for job queueing
- [ ] Create `document-processing` BullMQ queue
- [ ] Implement worker that processes jobs: extract text from PDF using `pdf-parse`; split text into overlapping chunks (chunk size: ~500 tokens, overlap: ~50 tokens); generate embeddings for each chunk using OpenAI `text-embedding-3-small`; save chunks + vectors to `DocumentChunk` table
- [ ] Handle processing errors gracefully (mark document as `processingFailed`, retry up to 3 times)
- [ ] Expose `GET /api/documents/:id/processing-status` — returns `pending | processing | ready | failed`
- [ ] Show processing status badge in admin UI (spinner while processing, green check when ready, red X on failure)
- [ ] Implement `DELETE` cleanup — when a document is deleted, also delete all its `DocumentChunk` records

---

### Feature 8: Notification & Announcement System (Admin)

**Goal:** Admins can send targeted notifications to users; system also auto-generates notifications for key events.

**Checklist:**
- [ ] `POST /api/admin/notifications/broadcast` — Send notification to all students, all lecturers, or a specific course's enrolled users
- [ ] `GET /api/notifications` — Fetch current user's notifications (newest first, paginated)
- [ ] `PUT /api/notifications/:id/read` — Mark notification as read
- [ ] `PUT /api/notifications/read-all` — Mark all as read
- [ ] Auto-create notifications for: new document uploaded in a course, new exam simulation available, badge awarded, forum post replied to, study group invitation
- [ ] Build notification bell icon in navbar with unread count badge
- [ ] Build `/notifications` page with full notification history and mark-as-read controls
- [ ] Implement real-time notification delivery using Socket.IO (push to connected clients on notification creation)

---

### Feature 9: Admin Analytics Dashboard

**Goal:** Give admins and lecturers data-driven insights into student engagement.

**Checklist:**
- [ ] Log every key student action to `ActivityLog`: document view, chat query, exam attempt, bookmark created, forum post, forum reply
- [ ] `GET /api/admin/analytics/overview` — Returns: total students, total documents, total chat sessions, total exam attempts (last 30 days)
- [ ] `GET /api/admin/analytics/documents` — Returns: top 10 most viewed documents, top 10 most used documents in RAG answers
- [ ] `GET /api/admin/analytics/queries` — Returns: most frequently asked questions (cluster similar queries), topics with most questions
- [ ] `GET /api/admin/analytics/courses` — Per-course engagement: active users, document views, chat sessions
- [ ] `GET /api/admin/analytics/students` — Per-student activity summary (for lecturer view of their own course only)
- [ ] Build `/admin/analytics` page with:
  - [ ] Overview cards (total users, documents, sessions)
  - [ ] Line chart: daily active users over last 30 days
  - [ ] Bar chart: document engagement per course
  - [ ] Table: top asked questions / struggling topics
- [ ] Restrict lecturer access to only analytics for their own uploaded courses

---

### Feature 10: Forum Moderation (Admin / Moderator)

**Goal:** Maintain quality and safety of student forum discussions.

**Checklist:**
- [ ] `GET /api/admin/forum/flagged` — List all flagged posts and replies awaiting review
- [ ] `PUT /api/admin/forum/posts/:id/approve` — Approve a flagged post (set `isApproved = true`)
- [ ] `DELETE /api/admin/forum/posts/:id` — Hard-delete a post
- [ ] `PUT /api/admin/forum/posts/:id/unflag` — Remove flag without deleting
- [ ] Implement AI auto-moderation: on each new forum post, call OpenAI to classify content as `safe | inappropriate | spam`; if classified as `inappropriate` or `spam`, set `isFlagged = true` and hold for review
- [ ] Build `/admin/moderation` page with flagged posts queue: display post content, author, AI classification reason, approve/delete actions
- [ ] Auto-notify post author when their post is approved or removed

---

## PHASE 3 — Core Student Features

---

### Feature 11: AI Chat Interface (RAG)

**Goal:** Students can ask questions and receive answers grounded strictly in uploaded course documents.

**Implementation Details:**
- User sends a query with a selected `courseId`
- Backend embeds the query using OpenAI `text-embedding-3-small`
- Perform cosine similarity search against `DocumentChunk` vectors for the given course
- Retrieve top-K (default: 5) most relevant chunks
- Build a system prompt instructing the LLM to answer ONLY from the provided context, refuse if the answer is not in the documents
- Call OpenAI chat completion (GPT-4o) with the context + user query
- Stream the response back to the client
- Save the full exchange to `ChatMessage` with `sourcesUsed` containing referenced document IDs and chunk indices

**Checklist:**
- [ ] `POST /api/chat/sessions` — Create a new chat session for a course
- [ ] `GET /api/chat/sessions` — List user's chat sessions (most recent first)
- [ ] `GET /api/chat/sessions/:id/messages` — Fetch all messages in a session
- [ ] `DELETE /api/chat/sessions/:id` — Delete a chat session and its messages
- [ ] `POST /api/chat/sessions/:id/messages` — Send a message; trigger RAG pipeline; stream response using Fastify's reply streaming
- [ ] Enforce strict RAG grounding: if no relevant chunks found (similarity below threshold), respond with "I could not find an answer to this in the uploaded materials."
- [ ] Build `/chat` page with:
  - [ ] Course selector dropdown
  - [ ] Chat session sidebar (list of past sessions, new session button)
  - [ ] Message thread area with user and AI bubbles
  - [ ] Streaming response display (typewriter effect)
  - [ ] "Sources used" collapsible section below each AI response showing document names + page references
  - [ ] Send input at bottom with keyboard shortcut (Enter to send, Shift+Enter for newline)

---

### Feature 12: AI-Powered Document Summaries

**Goal:** Students can generate instant summaries and key exam points from any document.

**Checklist:**
- [ ] `POST /api/documents/:id/summarize` — Retrieve all chunks for the document; call OpenAI to generate a structured summary with: Overview (2–3 sentences), Key Concepts (bullet list), Likely Exam Topics (bullet list); cache the result in the `Document` record (add `summaryCache` JSON field)
- [ ] If summary already cached (and document version unchanged), return cached version without calling OpenAI again
- [ ] Build document detail page `/documents/:id` with:
  - [ ] Document viewer (PDF iframe embed or link)
  - [ ] "Generate Summary" button with loading state
  - [ ] Rendered summary with Overview, Key Concepts, Exam Topics sections
  - [ ] "Download Summary" button (generates a plain-text or PDF summary file)
- [ ] Show a "Summary available" badge on document cards where summary has been generated

---

### Feature 13: Exam Simulation Mode

**Goal:** Students can take AI-generated mock exams using past questions from uploaded documents.

**Implementation Details:**
- Admin uploads past question PDFs (type: PAST_QUESTION)
- The RAG pipeline extracts and chunks them
- The exam engine calls OpenAI with the chunks to extract structured question objects: `{ question, options?, correctAnswer, explanation, difficulty }`
- Questions are stored in `ExamSession`

**Checklist:**
- [ ] `POST /api/admin/documents/:id/extract-questions` — Parse a PAST_QUESTION document's chunks and extract structured questions using OpenAI; store results as JSON in a new `ExtractedQuestion` model
- [ ] Create `ExtractedQuestion` model: `id`, `documentId`, `question`, `options` (String[], for MCQ), `correctAnswer`, `explanation`, `difficulty` (ENUM: EASY, MEDIUM, HARD), `courseId`
- [ ] `POST /api/exam/start` — Accept `courseId` and `questionCount` (default 10); randomly select questions from `ExtractedQuestion` for the course; create `ExamSession`; return shuffled questions WITHOUT correct answers
- [ ] `POST /api/exam/sessions/:id/submit` — Accept student's answers; compute score; save to `ExamSession`; award points based on score; return detailed results with correct answers and explanations
- [ ] `GET /api/exam/sessions` — List user's past exam sessions with scores
- [ ] `GET /api/exam/sessions/:id` — Get full results of a completed session
- [ ] Build `/exam` page:
  - [ ] Course + question count selector
  - [ ] Timer display (configurable, e.g., 1 minute per question)
  - [ ] One question at a time with MCQ or short-answer input
  - [ ] Progress indicator (Question 3 of 10)
  - [ ] Auto-submit on timer expiry
  - [ ] Results page: score breakdown, per-question feedback with correct answer + explanation, performance chart
- [ ] After exam, log performance to `ActivityLog` and update student's `points`

---

### Feature 14: Bookmarking & Personal Notes

**Goal:** Students can save important questions, handout sections, and add personal notes.

**Checklist:**
- [ ] `POST /api/bookmarks` — Create bookmark; body: `{ documentId, questionRef? (for specific question), note? }`
- [ ] `GET /api/bookmarks` — List user's bookmarks, filterable by course
- [ ] `PUT /api/bookmarks/:id` — Update note text on a bookmark
- [ ] `DELETE /api/bookmarks/:id` — Remove bookmark
- [ ] Build `/bookmarks` page:
  - [ ] Grid of bookmark cards grouped by course
  - [ ] Each card shows document title, optional question snippet, user note
  - [ ] Inline note editing (click to edit, auto-save on blur)
  - [ ] Filter by course dropdown
  - [ ] Click-through to full document/question

---

### Feature 15: Student Analytics Dashboard

**Goal:** Students can track their own learning progress and identify weak areas.

**Checklist:**
- [ ] `GET /api/students/me/analytics` — Returns: total chat questions asked, top 5 topics queried, total exam sessions, average exam score, total time estimated (based on session count), documents viewed, current points + rank
- [ ] `GET /api/students/me/analytics/exam-history` — Returns per-session scores over time for chart
- [ ] `GET /api/students/me/analytics/topic-gaps` — Based on low-scoring exam questions, return list of topics to review
- [ ] Build `/dashboard` page (student home):
  - [ ] Welcome header with user name + current points
  - [ ] Stats cards: Questions Asked, Exams Taken, Avg Score, Bookmarks
  - [ ] Line chart: exam performance over time
  - [ ] "Topics to Review" section based on low-scoring areas
  - [ ] Recent activity feed (last 5 chat sessions, last 3 exams)
  - [ ] Quick-access links: Start Exam, Open Chat, Browse Documents

---

### Feature 16: Personalized Study Recommendations

**Goal:** The system proactively suggests relevant documents and questions based on a student's activity.

**Checklist:**
- [ ] After each chat session, analyze the topics queried using OpenAI to extract 2–3 topic keywords; store in `ActivityLog`
- [ ] `GET /api/recommendations` — Based on user's top queried topics (last 7 days), return: related documents not yet viewed, related extracted questions not yet attempted, suggested exam mode for the most-queried course
- [ ] Build "Recommended for You" section on the student dashboard showing 3–5 recommendation cards
- [ ] Each recommendation card shows: document/question title, why it was recommended ("You often ask about Algorithm Complexity"), and a direct action button (View Document / Start Exam)
- [ ] Refresh recommendations daily (cache in Redis with 24-hour TTL)

---

## PHASE 4 — Collaboration Features

---

### Feature 17: Student Forum

**Goal:** A moderated, course-specific discussion forum for student collaboration.

**Checklist:**
- [ ] `POST /api/forum/posts` — Create forum post: `{ courseId, title, content, tags[] }`; trigger AI moderation check; if safe, set `isApproved = true`; if flagged, hold for admin review
- [ ] `GET /api/forum/posts` — List approved posts, filterable by `courseId`, `tags`; sortable by newest / most upvoted; paginated
- [ ] `GET /api/forum/posts/:id` — Get post with all replies
- [ ] `POST /api/forum/posts/:id/replies` — Post a reply; trigger AI moderation
- [ ] `POST /api/forum/posts/:id/upvote` — Toggle upvote on a post (one per user)
- [ ] `POST /api/forum/replies/:id/upvote` — Toggle upvote on a reply
- [ ] `POST /api/forum/posts/:id/flag` — Student-flagged report (sends to moderation queue)
- [ ] Implement AI Feedback on Forum Posts: after a post is created, call OpenAI to suggest a helpful clarification or related concept from the course documents; display this as an "AI Insight" bubble at the top of the post thread (before human replies)
- [ ] Build `/forum` page:
  - [ ] Course filter tabs
  - [ ] Post list with title, author avatar, upvote count, reply count, tags, time ago
  - [ ] New post button (modal with rich text editor, tag input)
  - [ ] `/forum/posts/:id` — Full post thread: AI Insight bubble, post body, reply list, reply input
  - [ ] Upvote buttons on posts and replies
  - [ ] Report button (flag for moderation)

---

### Feature 18: Study Groups

**Goal:** Students can form private virtual groups around specific courses and chat in real-time.

**Checklist:**
- [ ] `POST /api/groups` — Create study group: `{ name, courseId }`; creator auto-joins as member
- [ ] `POST /api/groups/:id/invite` — Invite a user by email to the group
- [ ] `POST /api/groups/:id/join` — Accept invitation and join group
- [ ] `GET /api/groups` — List groups the current user is a member of
- [ ] `GET /api/groups/:id` — Get group info + member list
- [ ] `DELETE /api/groups/:id/leave` — Leave a group
- [ ] `GET /api/groups/:id/messages` — Fetch paginated message history
- [ ] Implement real-time group chat via Socket.IO:
  - [ ] Clients join a Socket.IO room per group (`group:{id}`)
  - [ ] `sendGroupMessage` event — broadcast message to room; save to `GroupMessage`
  - [ ] `typing` event — broadcast typing indicator to room
  - [ ] Show online members list using Socket.IO presence
- [ ] Build `/groups` page:
  - [ ] My Groups sidebar
  - [ ] Create Group modal
  - [ ] Group chat view: message history, message input, member list panel, typing indicator
  - [ ] Invite modal (enter email)

---

## PHASE 5 — Gamification & Engagement

---

### Feature 19: Points, Badges & Leaderboard

**Goal:** Reward student engagement to boost motivation and platform usage.

**Points System:**
| Action | Points Awarded |
|---|---|
| Ask a chat question | +2 |
| Complete an exam simulation | +10 |
| Score 80%+ on an exam | +20 bonus |
| Upload a resource (Lecturer) | +5 |
| Get a forum post upvoted | +3 |
| Post a forum reply | +2 |
| Bookmark a document | +1 |

**Badges:**
| Badge | Criteria |
|---|---|
| First Steps | Ask your first question |
| Exam Ready | Complete 5 exam simulations |
| Top Scorer | Score 90%+ on any exam |
| Knowledge Sharer | Get 10 upvotes on forum posts |
| Scholar | Accumulate 500 points |
| Power User | Log in 7 days in a row |

**Checklist:**
- [ ] Seed `Badge` table with all badges defined above
- [ ] Create `awardPoints(userId, amount, reason)` service function — adds to `User.points`, creates `ActivityLog` entry
- [ ] Create `checkAndAwardBadges(userId)` service function — checks all badge criteria, awards any not yet received, creates `UserBadge` record, sends notification
- [ ] Call `awardPoints` and `checkAndAwardBadges` at every relevant action
- [ ] `GET /api/leaderboard` — Return top 20 users by points, filterable by `courseId` (students enrolled in course) or global; show rank, name, avatar, points, badge count
- [ ] `GET /api/users/me/badges` — Return all badges earned by the current user
- [ ] Build `/leaderboard` page with global and per-course tabs; animated rank list
- [ ] Build badge display section on the student profile page
- [ ] Show points total and rank prominently in the student dashboard header
- [ ] Implement 7-day streak tracking: check on login if user logged in yesterday; if yes, increment streak counter in Redis; award "Power User" badge at 7 days

---

## PHASE 6 — Multi-Level Access Control

---

### Feature 20: Role-Based Access & Lecturer Portal

**Goal:** Distinct permissions and views for STUDENT, LECTURER, MODERATOR, and ADMIN roles.

**Role Permissions Matrix:**

| Action | STUDENT | LECTURER | MODERATOR | ADMIN |
|---|---|---|---|---|
| Ask AI questions | ✅ | ✅ | ✅ | ✅ |
| Take exam simulations | ✅ | ✅ | ❌ | ❌ |
| Upload documents | ❌ | ✅ (own courses) | ❌ | ✅ |
| View document analytics | ❌ | ✅ (own courses) | ❌ | ✅ |
| Moderate forum | ❌ | ❌ | ✅ | ✅ |
| Manage departments/courses | ❌ | ❌ | ❌ | ✅ |
| Broadcast notifications | ❌ | ❌ | ❌ | ✅ |
| View all student analytics | ❌ | ✅ (own courses) | ❌ | ✅ |
| Award/manage badges | ❌ | ❌ | ❌ | ✅ |

**Checklist:**
- [ ] Ensure all Fastify route handlers use `requireRole()` preHandler to enforce the matrix above
- [ ] Lecturers see only documents and analytics for courses they created or are assigned to
- [ ] Build `/lecturer` portal with: My Courses, Upload Document, My Document Analytics, Student Question Trends
- [ ] Build `/moderator` portal with: Flagged Post Queue (identical to admin moderation view, but no other admin access)
- [ ] Admin sees full `/admin` portal: all sections from Features 4–10
- [ ] Implement role-aware navigation: sidebar/navbar links shown based on user role
- [ ] Role upgrade requests: students can request lecturer access via `POST /api/users/me/request-role`; admin approves via `PUT /api/admin/users/:id/role`

---

## PHASE 7 — Polish, Security & Deployment

---

### Feature 21: Security Hardening

**Checklist:**
- [ ] Rate limiting: use `@fastify/rate-limit` — 100 req/min for general routes, 10 req/min for AI chat/exam endpoints
- [ ] Input validation: use `zod` schemas on all Fastify route inputs (body, params, query)
- [ ] File upload security: validate MIME type server-side (not just extension); reject non-PDF files; limit file size to 50MB
- [ ] Helmet: add `@fastify/helmet` for security headers
- [ ] CORS: configure `@fastify/cors` to only allow frontend origin
- [ ] SQL injection: Prisma's parameterized queries handle this; do not use raw SQL without parameterization
- [ ] Secrets: ensure no API keys are logged or returned in error responses
- [ ] Audit log: all admin actions (delete document, change user role, approve/reject post) are written to `ActivityLog`

---

### Feature 22: Search & Filtering

**Goal:** Students can quickly find documents, forum posts, and questions by keyword or filter.

**Checklist:**
- [ ] `GET /api/search?q=&type=document|forum|question&courseId=` — Full-text search across document titles/tags, forum post titles/content, and extracted question text; return ranked results by type
- [ ] Implement PostgreSQL full-text search using `tsvector` columns on `Document.title`, `ForumPost.title + content`, `ExtractedQuestion.question`
- [ ] Build global search bar in the navbar:
  - [ ] Dropdown shows instant results as user types (debounced, 300ms)
  - [ ] Results grouped by type (Documents, Forum, Questions)
  - [ ] "See all results" link to full `/search?q=` page
- [ ] Full search results page with filter tabs and pagination

---

### Feature 23: Responsive UI & Accessibility

**Checklist:**
- [ ] All pages are fully responsive (mobile-first): works on 320px screens up to 1440px+
- [ ] Dark mode support using Tailwind's `dark:` classes and a theme toggle in settings
- [ ] All interactive elements have proper ARIA labels
- [ ] Color contrast meets WCAG AA standards
- [ ] Keyboard navigation works for all critical flows (chat, exam, forum)
- [ ] Loading skeletons on all data-fetching components
- [ ] Error boundary components on all major page sections
- [ ] Empty states for all lists (no documents, no bookmarks, etc.) with helpful CTAs

---

### Feature 24: Testing

**Checklist:**
- [ ] Unit tests (Vitest) for: RAG pipeline chunking logic, points calculation, badge award logic, AI moderation classification parsing
- [ ] Integration tests for all Fastify routes using `fastify.inject()`: auth, document upload, chat, exam, forum, bookmarks
- [ ] E2E tests (Playwright) for critical user flows: register → login → start chat → receive answer with sources; upload document → see processing complete → document appears in list; start exam → submit answers → see score
- [ ] Test coverage report configured; target ≥ 70% coverage on backend

---

### Feature 25: Deployment & DevOps

**Checklist:**
- [ ] `Dockerfile` for `apps/api` (multi-stage build: build → production)
- [ ] `Dockerfile` for `apps/web` (multi-stage Next.js build)
- [ ] `docker-compose.yml` for local dev with all services + hot reload
- [ ] `docker-compose.prod.yml` for production (no dev volumes, production ENV)
- [ ] `prisma migrate deploy` runs automatically on API container startup
- [ ] BullMQ worker runs as a separate process/container in production
- [ ] Health check endpoint `GET /api/health` — returns `{ status: "ok", db: "connected", redis: "connected" }`
- [ ] Graceful shutdown: Fastify closes connections cleanly on SIGTERM
- [ ] `README.md` with: project description, full local setup guide, environment variable reference, architecture diagram (ASCII or Mermaid), API endpoint reference

---

## 📋 Master Feature Checklist Summary

Copy this as your progress tracker:

```
PHASE 1 — Foundation
[x] Feature 1: Project Scaffolding & Environment Setup
[x] Feature 2: Database Schema Design
[x] Feature 3: Authentication System

PHASE 2 — Admin Features
[ ] Feature 4: Department & Course Management
[ ] Feature 5: Document Upload & Management
[ ] Feature 6: Document Version Control
[ ] Feature 7: RAG Pipeline — Background Document Processing
[ ] Feature 8: Notification & Announcement System
[ ] Feature 9: Admin Analytics Dashboard
[ ] Feature 10: Forum Moderation

PHASE 3 — Student Features
[ ] Feature 11: AI Chat Interface (RAG)
[ ] Feature 12: AI-Powered Document Summaries
[ ] Feature 13: Exam Simulation Mode
[ ] Feature 14: Bookmarking & Personal Notes
[ ] Feature 15: Student Analytics Dashboard
[ ] Feature 16: Personalized Study Recommendations

PHASE 4 — Collaboration
[ ] Feature 17: Student Forum
[ ] Feature 18: Study Groups

PHASE 5 — Gamification
[ ] Feature 19: Points, Badges & Leaderboard

PHASE 6 — Access Control
[ ] Feature 20: Role-Based Access & Lecturer Portal

PHASE 7 — Polish & Deployment
[ ] Feature 21: Security Hardening
[ ] Feature 22: Search & Filtering
[ ] Feature 23: Responsive UI & Accessibility
[ ] Feature 24: Testing
[ ] Feature 25: Deployment & DevOps
```

---

## 🔑 Key Architectural Decisions & Constraints

1. **RAG answers must be grounded** — The AI MUST refuse to answer if no relevant chunks are found above a cosine similarity threshold of 0.75. Never hallucinate.
2. **Fastify (not Express)** — All backend routes use Fastify with its schema validation and plugin system. Use `fastify-plugin` for shared hooks.
3. **Streaming** — AI chat responses stream via Fastify's `reply.raw` piping from the OpenAI stream.
4. **Vector search** — Use pgvector's `<=>` cosine distance operator. Index chunks with `ivfflat` for performance.
5. **Background processing** — Document processing NEVER blocks the upload HTTP response. Always use BullMQ.
6. **Role isolation** — Lecturers can ONLY see data for their own courses. Enforce at query level with Prisma `where` clauses, not just UI.
7. **Versioning** — Never delete old document files from storage. Always keep the physical file when a new version is uploaded.

---

## 📚 Academic Context (for Grounding)

This system is built for **Plateau State University (PLASU), Bokkos, Nigeria**, specifically the **Department of Computer Science**. The platform addresses:
- Lack of centralized digital academic materials
- No 24/7 academic support during self-study
- General AI tools (ChatGPT) not trained on PLASU-specific curricula

The RAG architecture (based on Lewis et al., 2020) ensures all AI answers are derived exclusively from PLASU-uploaded materials. The Agile SDLC (Sommerville, 2016) is used for development, with iterative feedback from students and faculty.

---

*End of Development Prompt — Implement features in order, check off as you go.*
