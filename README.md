# Rifugio – Gestionale

Gestionale web per un rifugio per cani, ad uso delle volontarie e degli admin del rifugio.

## Cosa fa

- Registro cani con cartella sanitaria (vaccini, antiparassitari, cure/interventi) e scadenzario dei richiami
- Ciclo di vita delle adozioni a stati: in rifugio → adottato → riportato, con storico e dati dell'adottante
- Due ruoli utente:
  - **VOLONTARIA**: aggiornamenti quotidiani (cani, cartelle sanitarie)
  - **ADMIN**: gestisce gli stati di adozione e approva i nuovi account
- I nuovi account nascono come VOLONTARIA non approvata; deve approvarli un ADMIN prima che possano operare
- Pagina pubblica `/registrazione`: form (nome, email, password) per richiedere un account; l'account resta in attesa di approvazione, senza login immediato
- Pagina pubblica `/login`: accesso con email e password per gli account già approvati; sessione gestita con Auth.js (JWT). Chi non è ancora approvato riceve un messaggio di attesa invece di entrare. Bottone di logout visibile in alto a destra quando si è collegati
- Rotte riservate `/dashboard` (qualunque utente loggato e approvato) e `/admin` (solo ADMIN): l'accesso è verificato ad ogni richiesta contro lo stato reale nel database, non solo contro la sessione. Link a queste pagine visibili in header solo se pertinenti al proprio ruolo
- Pannello admin (`/admin`): elenco delle richieste di registrazione in attesa, con bottoni Approva e Rifiuta. Rifiutare elimina definitivamente la richiesta (conferma esplicita richiesta prima dell'eliminazione). Le rotte API dietro ai bottoni verificano il ruolo ADMIN in modo indipendente dalla pagina che le chiama
- Registro animali (`/animali`): elenco, dettaglio, creazione e modifica dei dati di base (nome, specie, razza, data di nascita opzionale, descrizione, note) aperti a chiunque loggato e approvato. Eliminazione riservata agli ADMIN, con conferma esplicita; cambio di stato (Disponibile / In affido / Adottato) riservato agli ADMIN. Età mostrata calcolata automaticamente dalla data di nascita quando nota (giorni sotto il mese, mesi sotto l'anno, anno/i più eventuali mesi sotto i 2 anni, solo anni da 2 anni in su), mai salvata come valore a parte
- Foto dell'animale (opzionale): caricata da file, compressa e ridimensionata lato client (max 1200px, JPEG 80%) prima del salvataggio come data URL base64 nel database. Visibile solo nella pagina di dettaglio (in fondo, a piena larghezza su mobile), mai nell'elenco per non appesantirlo. Solo immagini, con limite di dimensione verificato anche lato server

## Modello dati

- `Role` (enum): `VOLONTARIA`, `ADMIN`
- `User`: `id`, `email` (univoca), `password` (hash bcrypt, mai in chiaro), `name`, `role` (default `VOLONTARIA`), `approved` (default `false`), `createdAt`
- `StatoAnimale` (enum): `DISPONIBILE`, `IN_AFFIDO`, `ADOTTATO`
- `Specie` (enum): `CANE`, `GATTO`, `ALTRO` — pensata per un'estensione futura oltre ai cani, anche se oggi il rifugio ospita solo cani
- `Animale`: `id`, `nome`, `specie` (default `CANE`), `razza` (opzionale), `dataNascita` (opzionale, indicativa se non nota con precisione), `descrizione` (opzionale), `note` (opzionale), `stato` (default `DISPONIBILE`), `foto` (opzionale, data URL base64), `createdAt`, `updatedAt`

## Sviluppo

- `npm run dev` — avvia il server di sviluppo (localhost:3000)
- `npm run build` / `npm run start` — build ed esecuzione in produzione
- `npm run lint` — ESLint
- `npx prisma migrate dev` — crea/applica migrazioni Prisma
