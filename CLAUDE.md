# One Life Vault

Document management system for One Life Foundation (NDIS SIL provider). Google Drive-backed document vault with Supabase metadata and authentication.

## Tech Stack

- React 19 + Vite 8 + Tailwind CSS 4
- react-router-dom 7 (multi-page SPA)
- Supabase (PostgreSQL + Auth)
- Google Drive API (document storage)

## Setup

```bash
git clone https://github.com/kraegeronimo-tech/one-life-vault.git
cd one-life-vault
npm install
npm run dev
```

## Environment Variables

Create a `.env` file in the project root:

```
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_REFRESH_TOKEN=your_google_refresh_token
GOOGLE_ROOT_FOLDER_ID=your_google_drive_folder_id
VITE_APP_NAME=One Life Vault
```

- Google Drive folder ID: `1lZhXJWVHsUWx78eIBEkzcHGXO9HKIrbE`
- `VITE_` prefixed vars are exposed to the client
- Google credentials are server-only (Vercel API functions)

## Deployment

```bash
npx vercel --prod --yes
```

**Vercel URL:** https://one-life-vault.vercel.app

## Key Notes

- Company: One Life Foundation (NDIS SIL provider in Australia)
- Documents are stored in Google Drive; Supabase handles metadata and auth.
- Always use Tailwind utility classes -- never raw CSS for spacing/styling.
- Never add `* { padding: 0 }` global reset in Tailwind CSS 4 projects.
