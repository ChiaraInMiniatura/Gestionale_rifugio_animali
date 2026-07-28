-- CreateEnum
CREATE TYPE "TipoRapporto" AS ENUM ('AFFIDO', 'ADOZIONE');

-- CreateTable
CREATE TABLE "Adozione" (
    "id" SERIAL NOT NULL,
    "animaleId" INTEGER NOT NULL,
    "tipo" "TipoRapporto" NOT NULL,
    "nome" TEXT NOT NULL,
    "cognome" TEXT NOT NULL,
    "cellulare" TEXT NOT NULL,
    "documento" TEXT NOT NULL,
    "dataInizio" TIMESTAMP(3) NOT NULL,
    "dataFine" TIMESTAMP(3),
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Adozione_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Adozione" ADD CONSTRAINT "Adozione_animaleId_fkey" FOREIGN KEY ("animaleId") REFERENCES "Animale"("id") ON DELETE CASCADE ON UPDATE CASCADE;
