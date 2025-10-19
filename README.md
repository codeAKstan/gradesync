# GradeSync

> GradeSync is an academic management system built with Next.js (App Router) for managing courses, lecturers, students, registrations, and results. This repository contains both the frontend and server actions (API routes) that connect to MongoDB.

## Key features

- Lecturer, admin and student interfaces
- Course registration, assignments, and result processing
- Email notifications for account setup
- MongoDB-backed data models

## Requirements

- Node.js 18+ (recommended)
- pnpm (optional) or npm/yarn
- A MongoDB connection (Atlas or self-hosted)
- A Gmail account (or SMTP) for sending emails (used by `lib/email.js`)

This project was developed and tested on Windows; the commands below use PowerShell syntax where applicable.

## Quick start (development)

1. Install dependencies

```powershell
# using pnpm (recommended if you have it)
pnpm install

# or npm
npm install
```

2. Create a `.env` file in the project root and set required environment variables (see list below).

3. Run the development server

```powershell
pnpm dev
# or npm run dev
```

Open http://localhost:3000 in your browser.

## Important environment variables

Create a `.env` (for development) or set environment variables in your hosting provider. The project reads these variables using `process.env`:

- MONGODB_URI - MongoDB connection string (required)
- JWT_SECRET - Secret used to sign JSON Web Tokens (recommended to override the default)
- EMAIL_USER - SMTP username/email used to send mails (used by `lib/email.js`)
- EMAIL_PASS - SMTP password or app password for the email account
- NEXT_PUBLIC_APP_URL - Public URL of the app (used in email links). Defaults to `http://localhost:3000` in development.

Example `.env` (do NOT commit to version control):

```text
MONGODB_URI="mongodb+srv://username:password@cluster0.mongodb.net/?retryWrites=true&w=majority"
JWT_SECRET="a-very-strong-secret"
EMAIL_USER="youremail@gmail.com"
EMAIL_PASS="your-email-password-or-app-password"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

## Available scripts

The main scripts are defined in `package.json`:

- `pnpm dev` / `npm run dev` — Start Next.js in development mode (hot reload)
- `pnpm build` / `npm run build` — Build the production application
- `pnpm start` / `npm run start` — Start the built Next.js app (requires `build` first)
- `pnpm lint` / `npm run lint` — Run linter (Next.js lint)

Example (build + start) in PowerShell:

```powershell
pnpm build; pnpm start
```

## Project structure highlights

- `app/` - Next.js App Router pages and layout
- `api/` - API route handlers (server actions)
- `components/` - Reusable React UI components and design system
- `lib/` - Utility modules (database, auth, email, etc.)
- `models/` - Mongoose-like model definitions (plain JS modules used by the API)
- `public/` - Static assets

## Notes for maintainers

- The MongoDB client is initialized in `lib/mongodb.js` and expects `MONGODB_URI` to be set.
- JWT handling is in `lib/auth.js`. Change `JWT_SECRET` to a secure value in production.
- Email sending uses Gmail via `nodemailer` in `lib/email.js`. For Gmail you may need an app password or allow less secure apps (not recommended).
- Next.js config (`next.config.mjs`) disables image optimization and ignores type/lint errors during build — be mindful when changing these.

## Testing and utilities

There are several small scripts at the repository root for testing and debugging (for example `test-registration.js`, `create-test-lecturer.js`, `debug-course-structure.js`). These are Node scripts you can run directly. They typically rely on the same environment variables as the app.

Run a script in PowerShell like this:

```powershell
node .\create-test-lecturer.js
```

## Deployment

Deploy like any Next.js app. On Vercel you can add the environment variables in the project settings. If you deploy to other providers, ensure `MONGODB_URI`, `JWT_SECRET`, `EMAIL_USER`, and `EMAIL_PASS` are set.

## Contributing

If you plan to extend or refactor, please:

- Open an issue describing the change
- Create a feature branch from `main`
- Add tests where applicable and run the app locally

## Contact

If you need help running the project, share the `pnpm dev` (or `npm run dev`) output and any error traces you see in the terminal.

---

Generated README for the GradeSync project.
