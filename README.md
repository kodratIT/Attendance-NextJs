# Attendance-NextJs — Permohonan (ACC) Feature

This repo contains the Permohonan (Attendance Request) MVP implemented without Cloud Functions.

Key collections
- request: attendance fix requests
- attendance/{userId}/day/{YYYY-MM-DD}: daily attendance
- audit_logs: audit trail
- notifications: basic notification stubs

API endpoints
- GET /api/requests?status=SUBMITTED&type=...&employeeId=...
- POST /api/requests
- GET /api/requests/[id]
- PATCH /api/requests/[id]
- GET /api/requests/[id]/context

Role enforcement
- Reviewers (env: NEXT_PUBLIC_REVIEWER_ROLES, default Admin,HR,Manager) can approve/reject/return.
- Regular users can only list their own; can cancel own SUBMITTED request.

Validations
- Backdate and future date rules, reason length, duplicate active request prevention, monthly limit, subtype/time sanity, duration checks.

Indexes to create (Firestore)
- request: status Asc, createdAt Desc
- request: employeeId Asc, date Asc, type Asc
- request: employeeId Asc, createdAt Asc
- audit_logs: requestId Asc, createdAt Asc

Environment variables (optional)
- NEXT_PUBLIC_REQUEST_MAX_BACK_DAYS=7
- NEXT_PUBLIC_REQUEST_MIN_REASON_CHARS=10
- NEXT_PUBLIC_REQUEST_MONTHLY_LIMIT=5
- NEXT_PUBLIC_REVIEWER_ROLES=Admin,HR,Manager

Dashboard
- Menu Permohonan lists and filters requests.
- Detail shows user, before attendance, audit history, attachments, and location snapshot.
- Create dialog allows submitting a new request.

This is a [Next.js](https://nextjs.org/) project bootstrapped with [`create-next-app`](https://github.com/vercel/next.js/tree/canary/packages/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/basic-features/font-optimization) to automatically optimize and load Inter, a custom Google Font.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js/) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/deployment) for more details.
