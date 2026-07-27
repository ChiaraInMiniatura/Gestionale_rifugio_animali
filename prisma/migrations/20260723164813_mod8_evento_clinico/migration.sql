-- CreateEnum
CREATE TYPE "TipoEvento" AS ENUM ('VACCINO', 'ANTIPARASSITARIO', 'VISITA', 'TERAPIA');

-- CreateEnum
CREATE TYPE "RicorrenzaEvento" AS ENUM ('NESSUNA', 'GIORNALIERA');

-- CreateTable
CREATE TABLE "EventoClinico" (
    "id" SERIAL NOT NULL,
    "animaleId" INTEGER NOT NULL,
    "tipo" "TipoEvento" NOT NULL,
    "nomeSpecifico" TEXT NOT NULL,
    "data" TIMESTAMP(3) NOT NULL,
    "dataScadenza" TIMESTAMP(3),
    "ricorrenza" "RicorrenzaEvento" NOT NULL DEFAULT 'NESSUNA',
    "dataFine" TIMESTAMP(3),
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EventoClinico_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "EventoClinico" ADD CONSTRAINT "EventoClinico_animaleId_fkey" FOREIGN KEY ("animaleId") REFERENCES "Animale"("id") ON DELETE CASCADE ON UPDATE CASCADE;
