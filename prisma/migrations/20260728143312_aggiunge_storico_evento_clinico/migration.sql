-- CreateTable
CREATE TABLE "EventoClinicoStorico" (
    "id" SERIAL NOT NULL,
    "eventoId" INTEGER NOT NULL,
    "tipo" "TipoEvento" NOT NULL,
    "nomeSpecifico" TEXT NOT NULL,
    "data" TIMESTAMP(3) NOT NULL,
    "dataScadenza" TIMESTAMP(3),
    "ricorrenza" "RicorrenzaEvento" NOT NULL,
    "dataFine" TIMESTAMP(3),
    "confermato" BOOLEAN NOT NULL,
    "note" TEXT,
    "modificatoIl" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EventoClinicoStorico_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "EventoClinicoStorico" ADD CONSTRAINT "EventoClinicoStorico_eventoId_fkey" FOREIGN KEY ("eventoId") REFERENCES "EventoClinico"("id") ON DELETE CASCADE ON UPDATE CASCADE;
