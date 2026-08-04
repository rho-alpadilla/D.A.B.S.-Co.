# D.A.B.S. Buyer AI Worker

This Cloudflare Worker is the private server-side proxy for Groq. It verifies a Firebase ID token before calling Groq and only accepts a limited, public catalog snapshot from the buyer chat widget.

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
