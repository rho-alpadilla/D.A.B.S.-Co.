# D.A.B.S. AI Worker

This Cloudflare Worker is the private server-side proxy for Groq. It verifies a Firebase ID token before calling Groq and only accepts the minimum context needed by the relevant chat mode.

## Routes and data boundaries

- `POST /chat` is the buyer product concierge. It receives only a sanitized product catalog.
- `POST /admin-chat` is for `admin` and `sub-admin` accounts only. The Worker verifies the role by reading the signed-in user's own Firestore profile using their Firebase ID token.
- Admin AI receives only an aggregate dashboard summary. It never receives raw orders, customer names, emails, addresses, payment references, or shipping information.
- Only the main `admin` role may receive supplied revenue and average-order-value aggregates. Sub-admins are limited to operational product, stock, and order-status assistance.

## Local setup

1. Copy `.dev.vars.example` to `.dev.vars`.
2. Add a **rotated** Groq key as `GROQ_API_KEY`.
3. Set `ALLOWED_ORIGINS` to the local app origin.
4. Run `npm run worker:dev` from the repository root.
5. Add the printed Worker URL to the frontend's ignored `.env` file as `VITE_BUYER_AI_PROXY_URL`.

## Production setup (free Worker plan)

1. Log in with `npx wrangler login`.
2. Deploy with `npm run worker:deploy`.
3. Add secrets with:

   ```powershell
   npx wrangler secret put GROQ_API_KEY --config workers/buyer-ai/wrangler.jsonc
   npx wrangler secret put ALLOWED_ORIGINS --config workers/buyer-ai/wrangler.jsonc
   ```

4. Set `VITE_BUYER_AI_PROXY_URL` in the frontend deployment environment to the Worker URL and redeploy the frontend.

Never place the Groq key in a `VITE_` variable, frontend source file, or committed configuration.
