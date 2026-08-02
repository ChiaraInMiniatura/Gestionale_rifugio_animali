# 🐾 Frida

**Gestionale web per un rifugio per cani** — registro animali, cartella clinica,
scadenzario dei richiami e ciclo adozioni, pensato per essere usato soprattutto
da smartphone da volontarie non necessariamente pratiche di tecnologia.

## Perché esiste

Le volontarie di un rifugio seguono ogni cane su fogli sparsi o messaggi
WhatsApp: vaccini, antiparassitari, richiami, chi è in affido a chi. Frida
raccoglie tutto in un unico posto, con un'interfaccia semplice, caratteri e
bottoni grandi, e conferme esplicite prima di ogni azione che non si può
annullare.

## Funzionalità principali

### Accesso e ruoli
Due ruoli: **volontaria/o** (uso quotidiano) e **admin** (gestione utenti e
stati di adozione). I nuovi account nascono in attesa: un admin li approva
prima che possano operare. Sessione via Auth.js (JWT), verificata ad ogni
richiesta contro lo stato reale nel database — non solo contro il token, così
una disapprovazione o un cambio ruolo hanno effetto immediato.

### Registro animali e cartella clinica
Anagrafica (nome, specie, razza, età calcolata dalla data di nascita, sesso,
sterilizzazione, foto) e cartella clinica per ogni animale: vaccini,
antiparassitari, visite, terapie continuative. Ogni evento ha uno storico
delle modifiche, e una scheda clinica stampabile/scaricabile da consegnare a
un veterinario o a un nuovo affidatario.

### Scadenze e richiami automatici
Vista aggregata su tutto il rifugio, evidenziata per urgenza (colore *e*
grassetto, non solo colore, per chi ha difficoltà a distinguere le tonalità).
I richiami periodici (es. antiparassitario mensile) si rigenerano da soli alla
conferma — non serve reinserirli a mano ogni volta.

### Adozioni e affidi
Ciclo a stati (disponibile → in affido/adottato → di nuovo disponibile) con
storico completo per animale. Dati sensibili della persona (cellulare,
documento) visibili solo agli admin.

### Amministrazione
Approvazione nuovi account, cambio ruolo, reimpostazione password (senza
self-service, per un pubblico a cui la gestione password crea spesso
confusione), note interne per admin. Guardie anti-lockout: nessuno può
eliminare o declassare se stesso.

### Installabile
Icona dedicata su cellulare ("Aggiungi a schermata Home") e computer
(Chrome/Edge, finestra a sé), con bottone di installazione in dashboard.
Nessun funzionamento offline: cambia solo il modo in cui l'app si apre.

## Stack tecnico

- **Next.js 16** (App Router) + **React 19** (React Compiler) + **TypeScript**
- **Tailwind CSS v4**
- **PostgreSQL** via **Prisma 7**
- **Auth.js v4** (Credentials + sessione JWT)
- **react-hook-form** + **zod** (stessa validazione client e server)
- Icone e favicon generati via codice (`next/og`), nessun file immagine da mantenere

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

## Modello dati

- `Role` (enum): `VOLONTARIA`, `ADMIN`
- `User`: `id`, `email` (univoca), `password` (hash bcrypt, mai in chiaro), `name`, `role` (default `VOLONTARIA`), `approved` (default `false`), `cellulare` (opzionale, ad uso esclusivo admin), `note` (opzionale, ad uso esclusivo admin), `createdAt`
- `StatoAnimale` (enum): `DISPONIBILE`, `IN_AFFIDO`, `ADOTTATO`
- `Specie` (enum): `CANE`, `GATTO`, `ALTRO` — pensata per un'estensione futura oltre ai cani, anche se oggi il rifugio ospita solo cani
- `Sesso` (enum): `MASCHIO`, `FEMMINA`
- `Animale`: `id`, `nome`, `specie` (default `CANE`), `razza` (opzionale), `dataNascita` (opzionale, indicativa se non nota con precisione), `descrizione` (opzionale), `note` (opzionale), `stato` (default `DISPONIBILE`), `foto` (opzionale, data URL base64), `sesso` (opzionale), `sterilizzato` (opzionale, booleano), `createdAt`, `updatedAt`
- `TipoEvento` (enum): `VACCINO`, `ANTIPARASSITARIO`, `VISITA`, `TERAPIA`
- `RicorrenzaEvento` (enum): `NESSUNA` (evento singolo, con eventuale richiamo manuale), `GIORNALIERA` (terapia continuativa), `MENSILE`/`ANNUALE` (richiamo periodico con rinnovo automatico)
- `EventoClinico`: `id`, `animaleId` (relazione con `Animale`, `onDelete: Cascade` — eliminare un animale elimina anche la sua cartella clinica), `tipo`, `nomeSpecifico`, `data` (con orario), `dataScadenza` (opzionale, solo per ricorrenza `NESSUNA`), `ricorrenza` (default `NESSUNA`), `dataFine` (opzionale, solo per ricorrenza `GIORNALIERA`), `confermato` (booleano, default `true`; per ricorrenza `NESSUNA`/`MENSILE`/`ANNUALE` indica se l'appuntamento è stato confermato come avvenuto), `prossimoGenerato` (booleano, default `false`; solo per `MENSILE`/`ANNUALE`, evita di generare due volte il richiamo successivo), `note` (opzionale), `createdAt`, `updatedAt`
- `EventoClinicoStorico`: `id`, `eventoId` (relazione con `EventoClinico`, `onDelete: Cascade`), istantanea dei campi dell'evento subito prima di una modifica (tipo, nomeSpecifico, data, dataScadenza, ricorrenza, dataFine, confermato, note), `modificatoIl` — nessun riferimento a chi ha fatto la modifica, solo cosa e quando
- `TipoRapporto` (enum): `AFFIDO`, `ADOZIONE` — un affido che diventa adozione aggiorna il tipo sullo stesso record
- `Adozione`: `id`, `animaleId` (relazione con `Animale`, `onDelete: Cascade`), `tipo`, `nome`, `cognome`, `cellulare`, `documento` (dati sensibili, visibili solo all'ADMIN), `dataInizio`, `dataFine` (opzionale, `null` = rapporto ancora in corso), `note` (opzionale), `createdAt`, `updatedAt`
