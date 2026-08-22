import { createHash, randomBytes } from 'crypto';
import { mkdir, readFile, unlink, writeFile } from 'fs/promises';
import { dirname, join, resolve } from 'path';

/**
 * File storage for accreditation evidence.
 *
 * Deliberately a small seam rather than a direct S3 dependency. Most
 * installations of this product are a single university on a single box, and a
 * disk directory is the right answer there; the ones that are not need S3 or
 * R2. Both sit behind `Storage`, so nothing above this file knows which.
 *
 * What callers must not do is construct storage keys from user input. `putFile`
 * mints its own opaque key, and `LocalStorage` refuses any key that escapes its
 * root — a filename like `../../.env` reaching the filesystem is how an upload
 * endpoint becomes an arbitrary-read.
 */

export interface StoredFile {
  key: string;
  sizeBytes: number;
  mimeType: string;
  originalName: string;
}

export interface Storage {
  putFile(
    data: Buffer,
    meta: { originalName: string; mimeType: string }
  ): Promise<StoredFile>;
  getFile(key: string): Promise<Buffer>;
  deleteFile(key: string): Promise<void>;
}

/**
 * What an accreditation file may contain. Deliberately narrow: these uploads
 * are scanned scripts and papers, and nothing here executes in a browser.
 * `text/html` and `image/svg+xml` are absent on purpose — both can carry
 * script, and this content is served back to staff.
 */
export const ALLOWED_MIME_TYPES = new Set([
  'application/pdf',
  'image/jpeg',
  'image/png',
  'image/webp',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
]);

/** 25 MB. A scanned script is a few MB; anything far larger is a mistake. */
export const MAX_UPLOAD_BYTES = 25 * 1024 * 1024;

export function validateUpload(
  mimeType: string,
  sizeBytes: number
): string | null {
  if (!ALLOWED_MIME_TYPES.has(mimeType)) {
    return `Files of type ${mimeType} are not accepted. Upload a PDF, image, Word or Excel file.`;
  }
  if (sizeBytes <= 0) return 'The file is empty.';
  if (sizeBytes > MAX_UPLOAD_BYTES) {
    return `File is ${(sizeBytes / 1024 / 1024).toFixed(1)} MB. The limit is ${MAX_UPLOAD_BYTES / 1024 / 1024} MB.`;
  }
  return null;
}

const EXT_BY_MIME: Record<string, string> = {
  'application/pdf': 'pdf',
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'application/msword': 'doc',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'docx',
  'application/vnd.ms-excel': 'xls',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'xlsx',
};

/**
 * Opaque, unguessable, and derived from nothing the caller supplied. Sharded
 * two levels so a directory never accumulates tens of thousands of entries.
 */
function mintKey(mimeType: string): string {
  const id = randomBytes(16).toString('hex');
  const ext = EXT_BY_MIME[mimeType] ?? 'bin';
  return `${id.slice(0, 2)}/${id.slice(2, 4)}/${id}.${ext}`;
}

class LocalStorage implements Storage {
  constructor(private readonly root: string) {}

  private resolveWithin(key: string): string {
    const full = resolve(join(this.root, key));
    const rootResolved = resolve(this.root);
    // Containment check, not a string prefix test: `${root}-evil` starts with
    // `root` but is outside it.
    if (full !== rootResolved && !full.startsWith(rootResolved + '/')) {
      throw new Error('Refusing to access a path outside the storage root');
    }
    return full;
  }

  async putFile(
    data: Buffer,
    meta: { originalName: string; mimeType: string }
  ): Promise<StoredFile> {
    const key = mintKey(meta.mimeType);
    const full = this.resolveWithin(key);
    await mkdir(dirname(full), { recursive: true });
    await writeFile(full, data);
    return {
      key,
      sizeBytes: data.byteLength,
      mimeType: meta.mimeType,
      originalName: meta.originalName,
    };
  }

  async getFile(key: string): Promise<Buffer> {
    return readFile(this.resolveWithin(key));
  }

  async deleteFile(key: string): Promise<void> {
    await unlink(this.resolveWithin(key)).catch(() => undefined);
  }
}

let cached: Storage | null = null;

/**
 * Resolve the storage backend.
 *
 * `STORAGE_DIR` selects local disk. It must be a directory outside the
 * deployment, or a redeploy silently discards every piece of evidence a
 * customer uploaded — which is the failure they would discover during an
 * accreditation visit.
 *
 * S3/R2 is not implemented yet: add an `S3Storage implements Storage` here and
 * select on an env var. Nothing above this file changes.
 */
export function getStorage(): Storage {
  if (cached) return cached;
  const dir = process.env.STORAGE_DIR;
  if (!dir) {
    throw new Error(
      'STORAGE_DIR is not set. Point it at a persistent directory outside the ' +
        'deployment, e.g. STORAGE_DIR=/var/lib/attainly/uploads'
    );
  }
  cached = new LocalStorage(dir);
  return cached;
}

/** Integrity check, so a corrupted restore is detectable. */
export function checksum(data: Buffer): string {
  return createHash('sha256').update(data).digest('hex');
}
