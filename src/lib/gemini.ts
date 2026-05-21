import { GEMINI_API_KEY } from './aiConfig';

export type Material = 'ouro' | 'prata' | 'aco';

const GEMINI_MODEL = 'gemini-2.5-flash-image';
const GEMINI_ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;

const MATERIAL_LABEL: Record<Material, string> = {
  ouro: 'light-toned 18k gold (champagne/light yellow gold)',
  prata: 'polished silver',
  aco: 'polished stainless steel',
};

function buildPrompt(material: Material, improve = false): string {
  const label = MATERIAL_LABEL[material];
  const base = [
    `Generate a professional e-commerce catalog product photograph of this jewelry piece in ${label}.`,
    `Use a clean, light, minimalist neutral background that puts full focus on the piece — no props, no distracting elements.`,
    `Photorealistic, sharp focus on the piece with high detail on the gemstones and metal texture, soft diffused studio lighting, subtle natural shadow, square 1:1 framing.`,
    `No text, no logos, no watermarks.`,
  ];
  if (improve) {
    base.push(
      `IMPORTANT: this is a re-generation attempt because the previous output did not meet quality standards.`,
      `Produce a noticeably better result: improve clarity, lighting, composition, detail accuracy and overall realism. Avoid any artifacts or distortions.`,
    );
  }
  return base.join(' ');
}

// dataURL "data:image/png;base64,XXX" → { mimeType, base64 }
function splitDataUrl(dataUrl: string): { mimeType: string; base64: string } {
  const m = dataUrl.match(/^data:([^;]+);base64,(.+)$/);
  if (!m) throw new Error('Formato de imagem inválido (esperava data URL base64).');
  return { mimeType: m[1], base64: m[2] };
}

// Reduz a imagem para no máximo `maxDim` no maior lado e devolve novo dataURL JPEG.
export async function downscaleDataUrl(dataUrl: string, maxDim = 1024): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const ratio = Math.min(1, maxDim / Math.max(img.width, img.height));
      const w = Math.round(img.width * ratio);
      const h = Math.round(img.height * ratio);
      const canvas = document.createElement('canvas');
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext('2d')!;
      ctx.drawImage(img, 0, 0, w, h);
      resolve(canvas.toDataURL('image/jpeg', 0.92));
    };
    img.onerror = () => reject(new Error('Falha ao carregar imagem para redimensionar.'));
    img.src = dataUrl;
  });
}

interface InlineDataAny {
  mimeType?: string;
  mime_type?: string;
  data?: string;
}

interface GeminiResponse {
  candidates?: {
    content?: {
      parts?: {
        inlineData?: InlineDataAny;
        inline_data?: InlineDataAny;
        text?: string;
      }[];
    };
  }[];
  error?: { message?: string };
  promptFeedback?: { blockReason?: string };
}

/**
 * Chama a Gemini API e devolve a imagem gerada como dataURL ("data:image/png;base64,...").
 */
export async function generateImage(
  sourceDataUrl: string,
  material: Material,
  improve = false,
): Promise<string> {
  const apiKey = GEMINI_API_KEY;
  if (!apiKey) throw new Error('API key da Gemini não configurada.');

  const { mimeType, base64 } = splitDataUrl(sourceDataUrl);
  const prompt = buildPrompt(material, improve);

  const body = {
    contents: [
      {
        role: 'user',
        parts: [
          { inline_data: { mime_type: mimeType, data: base64 } },
          { text: prompt },
        ],
      },
    ],
  };

  const res = await fetch(`${GEMINI_ENDPOINT}?key=${encodeURIComponent(apiKey)}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  const json: GeminiResponse = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new Error(json.error?.message ?? `Gemini retornou status ${res.status}.`);
  }

  if (json.promptFeedback?.blockReason) {
    throw new Error(`Gemini bloqueou o prompt: ${json.promptFeedback.blockReason}`);
  }

  const parts = json.candidates?.[0]?.content?.parts ?? [];
  for (const part of parts) {
    const inline = part.inlineData ?? part.inline_data;
    const data = inline?.data;
    const mt = inline?.mimeType ?? inline?.mime_type ?? 'image/png';
    if (data) {
      return `data:${mt};base64,${data}`;
    }
  }

  const txt = parts.find((p) => p.text)?.text;
  throw new Error(`Gemini não retornou imagem. ${txt ? `Texto: ${txt}` : ''}`.trim());
}
