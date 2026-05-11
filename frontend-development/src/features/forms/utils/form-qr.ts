/** QR via layanan publik — tidak menyimpan file di server. */
export function getPublicQrImageUrl(publicUrl: string, sizePx = 180): string {
  const data = encodeURIComponent(publicUrl);
  return `https://api.qrserver.com/v1/create-qr-code/?size=${sizePx}x${sizePx}&data=${data}`;
}

const sanitizeQrFilenamePart = (value: string): string => {
  const cleaned = value
    .trim()
    .replace(/[^a-zA-Z0-9_-]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
  return cleaned.length > 0 ? cleaned : 'form';
};

export function buildPublicQrDownloadFilename(formCodeOrLinkCode: string): string {
  return `qr-form-${sanitizeQrFilenamePart(formCodeOrLinkCode)}.png`;
}

/** Unduh PNG QR (fetch → blob → anchor download), tanpa membuka tab generator. */
export async function downloadPublicQrImage(
  publicUrl: string,
  filename: string,
  sizePx = 320
): Promise<void> {
  const imageUrl = getPublicQrImageUrl(publicUrl, sizePx);
  let response: Response;
  try {
    response = await fetch(imageUrl);
  } catch {
    throw new Error('Gagal mengunduh QR code. Periksa koneksi internet Anda.');
  }
  if (!response.ok) {
    throw new Error('Gagal mengunduh QR code dari layanan generator.');
  }
  const blob = await response.blob();
  const objectUrl = URL.createObjectURL(blob);
  try {
    const anchor = document.createElement('a');
    anchor.href = objectUrl;
    anchor.download = filename;
    anchor.rel = 'noopener';
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}
