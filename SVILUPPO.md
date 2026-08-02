# Sviluppo locale

Note tecniche per eseguire Frida in locale — non fanno parte del
README.md (quello descrive il prodotto, questo come farlo girare).

## Eseguirlo in locale

```bash
npm install
npx prisma generate
npx prisma migrate dev
npm run dev
```

Serve un PostgreSQL raggiungibile da `DATABASE_URL` (`.env`, non versionato).

## Nota sul deploy

Il progetto non è pubblicato online: il database è locale (`localhost`), non
raggiungibile da un hosting come Vercel. Per pubblicarlo servirebbe un
Postgres in cloud (es. Neon, Supabase, Railway) e aggiornare `DATABASE_URL` —
tecnicamente possibile, semplicemente non ancora fatto.
