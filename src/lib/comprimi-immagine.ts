// Compressione/ridimensionamento delle foto animale lato client, prima
// dell'invio al server: riduce il peso del data URL base64 che finirà
// salvato direttamente nel campo `foto` di Animale (nessuno storage
// esterno), restando così più facilmente sotto la soglia FOTO_MAX_LENGTH
// validata anche lato server in src/lib/validations/animale.ts.

const LARGHEZZA_MASSIMA = 1200;
const QUALITA_JPEG = 0.8;

// Ridisegna il file su un <canvas> a larghezza massima 1200px e lo
// riesporta come JPEG all'80% di qualità, prima di convertirlo in
// data URL base64. Il caricamento file → Image è asincrono: bisogna
// attendere l'evento onload dell'Image prima di disegnare sul canvas.
/**
 * Comprime e ridimensiona un file immagine per l'upload.
 * @param file file immagine selezionato dall'utente (da un `<input type="file">`).
 * @returns Promise che risolve con il data URL JPEG risultante (stringa
 *   `data:image/jpeg;base64,...`); si rifiuta se il file non è leggibile
 *   o non è un'immagine valida, o se il canvas 2D non è disponibile.
 */
export function comprimiImmagine(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onerror = () => reject(new Error("Impossibile leggere il file"));

    reader.onload = () => {
      const img = new Image();

      img.onerror = () => reject(new Error("Il file selezionato non è un'immagine valida"));

      img.onload = () => {
        // Scala solo verso il basso (Math.min(1, ...)): un'immagine già
        // più piccola di 1200px non viene mai ingrandita.
        const scala = Math.min(1, LARGHEZZA_MASSIMA / img.width);
        const larghezza = Math.round(img.width * scala);
        const altezza = Math.round(img.height * scala);

        const canvas = document.createElement("canvas");
        canvas.width = larghezza;
        canvas.height = altezza;

        const ctx = canvas.getContext("2d");
        if (!ctx) {
          reject(new Error("Impossibile elaborare l'immagine"));
          return;
        }

        ctx.drawImage(img, 0, 0, larghezza, altezza);
        resolve(canvas.toDataURL("image/jpeg", QUALITA_JPEG));
      };

      img.src = reader.result as string;
    };

    reader.readAsDataURL(file);
  });
}
