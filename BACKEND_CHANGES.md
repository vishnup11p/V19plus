# V19 Plus Backend Changes & Integrations

The Next.js App Router frontend integrates with the backend APIs via standard endpoint mappings:

---

## 1. Mapped Integration Endpoints

- **Authentication**:
  - `POST /auth/login` (email/password login)
  - `POST /auth/register` (user signup)
  - `POST /auth/refresh` (token refresh)
  - `GET /auth/me` (session user profile details)
  - `POST /auth/logout` (session termination)
  - `POST /auth/google` (Google OAuth token sign-in)
  
- **User Dashboard & Profiles**:
  - `GET /user/profiles` (profiles collection)
  - `POST /user/profiles` (profile creation)
  - `DELETE /user/profiles/:id` (profile deletion)

- **Subscription & Billing**:
  - `GET /user/payments` (billing record history)
  - `GET /subscription/plans` (pricing levels)
  - `POST /subscription/checkout` (Stripe portal sessions)

- **Platform Content**:
  - `GET /content/featured` (hero carousel slides)
  - `GET /content/trending` (Top 10 listings)
  - `GET /content/originals` (original collection)
  - `GET /content/new-releases` (recently appended titles)

---

## 2. Dev Proxy Rewrites

The Next.js App Router configuration (`next.config.ts`) incorporates a reverse proxy setup to automatically forward client-side calls directly to the local Express server:
- Client target path: `/api/:path*`
- Mapped backend destination: `http://localhost:4000/api/:path*`
- WebSocket target path: `/socket.io/:path*`
- Mapped WebSocket server: `http://localhost:4000/socket.io/:path*`
