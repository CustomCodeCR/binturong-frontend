/**
 * Descarga de archivos generados por la API (PDF / Excel).
 *
 * El patrón anterior (`link.click()` seguido de `URL.revokeObjectURL()` en la
 * misma vuelta del event loop, sin insertar el enlace en el DOM) aborta la
 * descarga en Chromium/Brave y no funciona en Firefox. Además, cuando la API
 * responde con un error el cliente puede devolver un objeto vacío en lugar de un
 * Blob: al pasarlo a `createObjectURL` se lanzaba un `TypeError` que se
 * reportaba como "error al exportar" sin más detalle.
 */

/** Error lanzado cuando la respuesta no contiene un archivo utilizable. */
export class EmptyDownloadError extends Error {
  constructor(message = "The server did not return a file.") {
    super(message);
    this.name = "EmptyDownloadError";
    Object.setPrototypeOf(this, EmptyDownloadError.prototype);
  }
}

/** `true` cuando el valor es un Blob con contenido. */
export function isDownloadableBlob(value: unknown): value is Blob {
  return value instanceof Blob && value.size > 0;
}

/**
 * Algunas APIs responden 200 con un JSON de error pero `Content-Type` binario.
 * En ese caso el Blob contiene texto: lo leemos para mostrar el motivo real.
 */
export async function readBlobErrorMessage(blob: Blob): Promise<string | null> {
  const type = (blob.type || "").toLowerCase();
  if (!type.includes("json") && !type.startsWith("text/")) return null;

  try {
    const text = await blob.text();
    if (!text.trim()) return null;

    try {
      const parsed = JSON.parse(text);
      return (
        parsed?.detail ??
        parsed?.message ??
        parsed?.title ??
        parsed?.error ??
        text
      );
    } catch {
      return text;
    }
  } catch {
    return null;
  }
}

/**
 * Dispara la descarga de un Blob con el nombre indicado.
 *
 * @throws {EmptyDownloadError} si la respuesta no es un archivo válido.
 */
export async function downloadBlob(
  blob: unknown,
  fileName: string,
): Promise<void> {
  if (!isDownloadableBlob(blob)) {
    throw new EmptyDownloadError();
  }

  const embeddedError = await readBlobErrorMessage(blob);
  if (embeddedError) {
    throw new EmptyDownloadError(embeddedError);
  }

  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = fileName;
  link.rel = "noopener";
  link.style.display = "none";

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  // Revocar de inmediato cancela la descarga en algunos navegadores.
  window.setTimeout(() => URL.revokeObjectURL(url), 10_000);
}

/** Mensaje legible para el toast a partir del error capturado. */
export function describeDownloadError(
  error: unknown,
  fallback: string,
): string {
  if (error instanceof EmptyDownloadError) {
    return error.message === "The server did not return a file."
      ? fallback
      : `${fallback} (${error.message})`;
  }

  const message = (error as { message?: string } | null)?.message;
  return message ? `${fallback} (${message})` : fallback;
}
