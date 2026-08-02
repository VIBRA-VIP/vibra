import { api } from '@/services/api';

export type UploadMediaType =
  | 'AVATAR'
  | 'BANNER'
  | 'GALLERY'
  | 'CHAT_IMAGE'
  | 'ID_DOCUMENT'
  | 'VIDEO';

export type UploadMediaResult = {
  url: string;
  key: string;
  mediaId: string;
  type: UploadMediaType;
};

export async function uploadMediaFile(
  file: File,
  type: UploadMediaType = 'GALLERY',
): Promise<UploadMediaResult> {
  const form = new FormData();
  form.append('file', file);
  form.append('type', type);
  const { data } = await api.post<UploadMediaResult>('/api/media/upload', form);
  return data;
}

/** Resolve stored media path for <img src>. */
export function mediaSrc(url: string | null | undefined): string {
  if (!url) return '';
  if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('blob:')) {
    return url;
  }
  const base = (import.meta.env.VITE_API_URL || '').trim().replace(/\/$/, '');
  if (
    typeof window !== 'undefined' &&
    window.location.protocol === 'https:' &&
    base.startsWith('http:')
  ) {
    return url.startsWith('/') ? url : `/${url}`;
  }
  if (!base) return url.startsWith('/') ? url : `/${url}`;
  return `${base}${url.startsWith('/') ? url : `/${url}`}`;
}
