import { IMGBB_API_KEY } from './aiConfig';

const IMGBB_ENDPOINT = 'https://api.imgbb.com/1/upload';

interface ImgbbResponse {
  data?: { url?: string; display_url?: string };
  error?: { message?: string };
  status_txt?: string;
  status_code?: number;
}

/**
 * Sobe a imagem (dataURL ou base64 puro) para ImgBB e devolve a URL pública.
 */
export async function uploadToImgbb(imageDataUrl: string): Promise<string> {
  const apiKey = IMGBB_API_KEY;
  if (!apiKey) throw new Error('API key do ImgBB não configurada.');

  const base64 = imageDataUrl.startsWith('data:')
    ? imageDataUrl.replace(/^data:[^;]+;base64,/, '')
    : imageDataUrl;

  const form = new FormData();
  form.append('image', base64);

  const res = await fetch(`${IMGBB_ENDPOINT}?key=${encodeURIComponent(apiKey)}`, {
    method: 'POST',
    body: form,
  });

  const json: ImgbbResponse = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(json.error?.message ?? `ImgBB retornou status ${res.status}.`);
  }

  const url = json.data?.url ?? json.data?.display_url;
  if (!url) throw new Error('ImgBB respondeu sem URL.');
  return url;
}
