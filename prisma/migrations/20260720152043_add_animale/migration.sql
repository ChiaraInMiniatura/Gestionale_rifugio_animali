-- CreateEnum
CREATE TYPE "StatoAnimale" AS ENUM ('DISPONIBILE', 'IN_AFFIDO', 'ADOTTATO');

-- CreateEnum
CREATE TYPE "Specie" AS ENUM ('CANE', 'GATTO', 'ALTRO');

-- CreateTable
CREATE TABLE "Animale" (
    "id" SERIAL NOT NULL,
    "nome" TEXT NOT NULL,
    "specie" "Specie" NOT NULL DEFAULT 'CANE',
    "razza" TEXT,
    "dataNascita" TIMESTAMP(3),
    "descrizione" TEXT,
    "note" TEXT,
    "stato" "StatoAnimale" NOT NULL DEFAULT 'DISPONIBILE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Animale_pkey" PRIMARY KEY ("id")
);
