# Danish Immigration & Recruitment Portal (SIRI Candidate Dossier)

Official Danish Agency for International Recruitment and Integration (SIRI) Candidate & Caseworker Management Portal built with Next.js 14 (App Router), TypeScript, and Tailwind CSS.

## Architecture & Security Role Separation

- **Public Candidate Portal (`/`)**:
  - Exclusively dedicated to candidate dossier access.
  - No public caseworker links or administrative controls.
  - Pre-departure briefing countdown (anchored to UTC / 10:00 CET).
  - Authentic SIRI workflow tracking (Case Order ID `SB6-948123-2026`, VFS Appointment `VFS-KTM-2026-8819`).
  - Sensitive data masking, dynamic drag-and-drop document upload, HTML5 canvas biometric signature pad, and client-side A4 PDF generator (`html2pdf.js`).
  - Candidate Demo Account: `dk3430143@gmail.com` / `Dipak@1983`.

- **Restricted Caseworker Gateway (`/admin/login`)**:
  - Isolated and unindexed (`robots: noindex, nofollow`) administrative staff access.
  - Role-protected review dashboard at `/admin` for candidate status overrides, audit trail reviews, and signature inspection.
  - Administrative Account: `caseworker@siri.dk` / `AdminSiri@2026`.

## Legal Scheme & Collective Agreement Standards

- **Scheme**: SIRI Herdsmen & Farm Managers (Landbrugsmedhjælper).
- **Statutory Monthly Salary**: DKK 35,705.00 / month (37 hours/week).
- **Collective Bargaining Agreement**: 3F (Fagligt Fælles Forbund) & GLA (Gartneri-, Land- og Skovbrugets Arbejdsgivere).
- **Sponsor / Employer**: AgroNord A/S (CVR: 38291044 / Registry Sponsor #944135), Odense, Denmark.
- **SIRI Case Order ID**: `SB6-948123-2026` (Danish State Treasury statutory fee DKK 4,405).

## Build & Deployment

The application is configured for static export (`output: 'export'`) in `next.config.mjs` and published to `out/` via Netlify:

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Compile static production export
npm run build
```

Netlify redirects all SPA client-side routes via `netlify.toml`:
```toml
[build]
  command = "npm run build"
  publish = "out"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```
