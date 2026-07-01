<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Permit to Work System

This project has been redesigned as a SaaS-ready platform for multi-company EHS operations.

## New SaaS foundation

- Multi-tenant architecture with tenant-aware records and isolated scopes
- Role-based access control with permissions for admin, safety, and requester roles
- Backend API endpoints for tenant discovery and scoped permit access
- Frontend shell that presents tenant context and access rules from the start

## Run Locally

**Prerequisites:**  Node.js

1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Run the app:
   `npm run dev`

## Verification

- Frontend build: `npm run build`
- Backend test: `node --test backend/tests/saas.test.ts`