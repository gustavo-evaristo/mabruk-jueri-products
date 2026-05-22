import { useRef, useState } from 'react';
import { downscaleDataUrl, generateImage } from '../lib/gemini';
import { readFileAsDataUrl } from '../lib/files';

type VariantMaterial = 'ouro' | 'prata';
type VariantStatus = 'pending' | 'done' | 'error';

const MAX_CONCURRENT = 2;
const MAX_RETRIES = 4;

let inflight = 0;
const queue: (() => void)[] = [];

function acquireSlot(): Promise<void> {
  return new Promise((resolve) => {
    const run = () => {
      inflight++;
      resolve();
    };
    if (inflight < MAX_CONCURRENT) run();
    else queue.push(run);
  });
}

function releaseSlot() {
  inflight--;
  const next = queue.shift();
  if (next) next();
}

function isTransientError(err: unknown): boolean {
  const msg = (err instanceof Error ? err.message : String(err)).toLowerCase();
  return (
    msg.includes('high demand') ||
    msg.includes('overload') ||
    msg.includes('rate') ||
    msg.includes('quota') ||
    msg.includes('unavailable') ||
    msg.includes('try again') ||
    msg.includes('status 429') ||
    msg.includes('status 500') ||
    msg.includes('status 502') ||
    msg.includes('status 503') ||
    msg.includes('status 504')
  );
}

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

async function generateImageWithRetry(
  source: string,
  material: VariantMaterial,
  improve: boolean,
): Promise<string> {
  await acquireSlot();
  try {
    let lastErr: unknown;
    for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
      try {
        return await generateImage(source, material, improve);
      } catch (err) {
        lastErr = err;
        if (attempt === MAX_RETRIES || !isTransientError(err)) throw err;
        const backoff = Math.min(15000, 1500 * Math.pow(2, attempt)) + Math.random() * 500;
        await sleep(backoff);
      }
    }
    throw lastErr;
  } finally {
    releaseSlot();
  }
}

interface Variant {
  status: VariantStatus;
  url: string | null;
  error: string | null;
}

interface ImageItem {
  id: string;
  name: string;
  source: string;
  downscaled: string;
  ouro: Variant;
  prata: Variant;
}

const ACCEPTED_MIMES = ['image/jpeg', 'image/png', 'image/webp'];
const ACCEPTED_EXT_RE = /\.(jpe?g|png|webp)$/i;

function makeId() {
  return Math.random().toString(36).slice(2, 10);
}

function fileIsAccepted(f: File) {
  if (ACCEPTED_MIMES.includes(f.type)) return true;
  return ACCEPTED_EXT_RE.test(f.name);
}

function emptyVariant(): Variant {
  return { status: 'pending', url: null, error: null };
}

function downloadDataUrl(dataUrl: string, filename: string) {
  const a = document.createElement('a');
  a.href = dataUrl;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
}

function sanitizeBaseName(name: string) {
  return name.replace(/\.[^.]+$/, '').replace(/[^\w.-]+/g, '_') || 'imagem';
}

function extFromDataUrl(dataUrl: string): string {
  const m = dataUrl.match(/^data:image\/([a-zA-Z0-9+]+);/);
  if (!m) return 'png';
  const mt = m[1].toLowerCase();
  if (mt === 'jpeg') return 'jpg';
  return mt;
}

export function GerarImagemPage() {
  const [items, setItems] = useState<ImageItem[]>([]);
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  function setVariant(itemId: string, material: VariantMaterial, patch: Partial<Variant>) {
    setItems((prev) =>
      prev.map((it) =>
        it.id === itemId
          ? { ...it, [material]: { ...it[material], ...patch } as Variant }
          : it,
      ),
    );
  }

  async function generateVariant(
    itemId: string,
    source: string,
    material: VariantMaterial,
    improve = false,
  ) {
    setVariant(itemId, material, { status: 'pending', error: null });
    try {
      const url = await generateImageWithRetry(source, material, improve);
      setVariant(itemId, material, { status: 'done', url, error: null });
    } catch (err) {
      setVariant(itemId, material, {
        status: 'error',
        url: null,
        error: err instanceof Error ? err.message : String(err),
      });
    }
  }

  async function addFiles(fileList: FileList | File[]) {
    const files = Array.from(fileList).filter(fileIsAccepted);
    if (files.length === 0) return;

    const prepared: ImageItem[] = [];
    for (const file of files) {
      try {
        const source = await readFileAsDataUrl(file);
        const downscaled = await downscaleDataUrl(source, 1024);
        prepared.push({
          id: makeId(),
          name: file.name,
          source,
          downscaled,
          ouro: emptyVariant(),
          prata: emptyVariant(),
        });
      } catch {
        // ignora arquivo que não pôde ser lido
      }
    }

    if (prepared.length === 0) return;
    setItems((prev) => [...prev, ...prepared]);

    for (const it of prepared) {
      generateVariant(it.id, it.downscaled, 'ouro');
      generateVariant(it.id, it.downscaled, 'prata');
    }
  }

  function onInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const fs = e.target.files;
    if (fs && fs.length > 0) addFiles(fs);
    e.target.value = '';
  }

  function onDrop(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setDragOver(false);
    const fs = e.dataTransfer.files;
    if (fs && fs.length > 0) addFiles(fs);
  }

  function regenerate(itemId: string, material: VariantMaterial) {
    const it = items.find((x) => x.id === itemId);
    if (!it) return;
    generateVariant(itemId, it.downscaled, material, true);
  }

  function downloadVariant(it: ImageItem, material: VariantMaterial) {
    const v = it[material];
    if (!v.url) return;
    const base = sanitizeBaseName(it.name);
    const ext = extFromDataUrl(v.url);
    downloadDataUrl(v.url, `${base}_${material}.${ext}`);
  }

  function removeItem(id: string) {
    setItems((prev) => prev.filter((x) => x.id !== id));
  }

  function clearAll() {
    setItems([]);
  }

  const showInlineUploader = items.length > 0;

  return (
    <div className="app">
      <div className="header">
        <h1>Gerar imagens IA · Ouro &amp; Prata</h1>
        <a className="btn-secondary" href="/" style={{ textDecoration: 'none' }}>
          Voltar
        </a>
      </div>

      <div
        className={`gi-dropzone ${dragOver ? 'drag-over' : ''} ${showInlineUploader ? 'inline' : ''}`}
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={onDrop}
        onClick={() => inputRef.current?.click()}
        role="button"
        tabIndex={0}
      >
        <input
          ref={inputRef}
          type="file"
          accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp"
          multiple
          onChange={onInputChange}
          style={{ display: 'none' }}
        />
        <div className="gi-dropzone-text">
          <strong>Arraste imagens aqui</strong>
          <span>ou clique para selecionar (jpeg, jpg, png, webp · 1 ou várias)</span>
        </div>
      </div>

      {items.length > 0 && (
        <div className="gi-list-header">
          <span>
            {items.length} {items.length === 1 ? 'imagem' : 'imagens'}
          </span>
          <button className="btn-link" onClick={clearAll}>
            limpar lista
          </button>
        </div>
      )}

      <div className="gi-list">
        {items.map((it) => (
          <div key={it.id} className="gi-row">
            <div className="gi-source">
              <img src={it.source} alt={it.name} />
              <span className="gi-source-name" title={it.name}>
                {it.name}
              </span>
              <button
                type="button"
                className="gi-remove"
                onClick={() => removeItem(it.id)}
                title="Remover"
              >
                ×
              </button>
            </div>
            <div className="gi-variants">
              <VariantCell
                label="Ouro"
                variant={it.ouro}
                onDownload={() => downloadVariant(it, 'ouro')}
                onRegenerate={() => regenerate(it.id, 'ouro')}
              />
              <VariantCell
                label="Prata"
                variant={it.prata}
                onDownload={() => downloadVariant(it, 'prata')}
                onRegenerate={() => regenerate(it.id, 'prata')}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function VariantCell({
  label,
  variant,
  onDownload,
  onRegenerate,
}: {
  label: string;
  variant: Variant;
  onDownload: () => void;
  onRegenerate: () => void;
}) {
  const tone = label.toLowerCase();
  return (
    <div className={`gi-variant ${tone}`}>
      <div className="gi-variant-label">{label}</div>
      <div className="gi-variant-body">
        {variant.status === 'pending' && (
          <div className="gi-loading">
            <div className="spinner" />
            <span>gerando…</span>
          </div>
        )}
        {variant.status === 'error' && (
          <div className="gi-error" title={variant.error ?? ''}>
            {variant.error ?? 'Erro ao gerar.'}
          </div>
        )}
        {variant.status === 'done' && variant.url && (
          <img src={variant.url} alt={label} />
        )}
      </div>
      <div className="gi-variant-actions">
        <button
          type="button"
          className="gi-icon-btn"
          disabled={variant.status !== 'done'}
          onClick={onDownload}
          title="Baixar imagem"
          aria-label="Baixar imagem"
        >
          <DownloadIcon />
        </button>
        <button
          type="button"
          className="gi-icon-btn"
          disabled={variant.status === 'pending'}
          onClick={onRegenerate}
          title="Gerar novamente"
          aria-label="Gerar novamente"
        >
          <RefreshIcon />
        </button>
      </div>
    </div>
  );
}

function DownloadIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="7 10 12 15 17 10" />
      <line x1="12" y1="15" x2="12" y2="3" />
    </svg>
  );
}

function RefreshIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <polyline points="23 4 23 10 17 10" />
      <polyline points="1 20 1 14 7 14" />
      <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10" />
      <path d="M20.49 15A9 9 0 0 1 5.64 18.36L1 14" />
    </svg>
  );
}
