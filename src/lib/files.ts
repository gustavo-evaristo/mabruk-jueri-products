export function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

export function pickImageFromDataTransfer(dt: DataTransfer): File | null {
  // Tenta primeiro pelos items (pega arrastos de browser/área de transferência)
  if (dt.items) {
    for (const item of Array.from(dt.items)) {
      if (item.kind === 'file') {
        const f = item.getAsFile();
        if (f && f.type.startsWith('image/')) return f;
      }
    }
  }
  // Fallback: files (arrastos do finder/file explorer)
  for (const f of Array.from(dt.files ?? [])) {
    if (f.type.startsWith('image/')) return f;
  }
  return null;
}
