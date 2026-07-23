-- CreateEnum
CREATE TYPE "Sesso" AS ENUM ('MASCHIO', 'FEMMINA');

-- AlterTable
ALTER TABLE "Animale" ADD COLUMN     "sesso" "Sesso",
ADD COLUMN     "sterilizzato" BOOLEAN;
