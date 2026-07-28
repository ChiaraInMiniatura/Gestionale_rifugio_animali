-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "RicorrenzaEvento" ADD VALUE 'MENSILE';
ALTER TYPE "RicorrenzaEvento" ADD VALUE 'ANNUALE';

-- AlterTable
ALTER TABLE "EventoClinico" ADD COLUMN     "prossimoGenerato" BOOLEAN NOT NULL DEFAULT false;
