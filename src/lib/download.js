/**
 * Hand a generated file to the user: through the viewer's save dialog when the page runs
 * inside claude.ai (the `downloads` capability), through a plain download link otherwise.
 */

/** @type {{ save: (req: { filename: string, data: Blob }) => Promise<unknown> } | null} */
let viewerDownloads = null;
try {
  window.claude
    ?.use?.('downloads')
    ?.then((d) => (viewerDownloads = d))
    .catch(() => {});
} catch {
  /* not running inside a viewer */
}

/**
 * @param {Blob} blob
 * @param {string} filename
 * @returns {Promise<'saved' | 'declined' | 'link'>} how the file was handed over
 */
export async function deliver(blob, filename) {
  if (viewerDownloads) {
    try {
      await viewerDownloads.save({ filename, data: blob });
      return 'saved';
    } catch (e) {
      if (e?.code === 'declined' || e?.code === 'rate_limited') return 'declined';
    }
  }
  const url = URL.createObjectURL(blob);
  const a = Object.assign(document.createElement('a'), { href: url, download: filename });
  document.body.append(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 60_000);
  return 'link';
}
