const LARGHEZZA_MASSIMA = 1200;
const QUALITA_JPEG = 0.8;

// Ridisegna il file su un <canvas> a larghezza massima 1200px e lo
// riesporta come JPEG all'80% di qualità, prima di convertirlo in
// data URL base64. Il caricamento file → Image è asincrono: bisogna
// attendere l'evento onload dell'Image prima di disegnare sul canvas.
export function comprimiImmagine(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onerror = () => reject(new Error("Impossibile leggere il file"));

    reader.onload = () => {
      const img = new Image();

      img.onerror = () => reject(new Error("Il file selezionato non è un'immagine valida"));

      img.onload = () => {
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
