import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
  query,
  orderBy,
} from 'firebase/firestore';
import {
  ref,
  uploadBytesResumable,
  getDownloadURL,
  deleteObject,
} from 'firebase/storage';
import { db, storage } from '../utils/firebase';

export interface SeriesData {
  id?: string;
  title: string;
  description: string;
  thumbnailUrl: string;
  createdAt?: any;
  updatedAt?: any;
}

export interface EpisodeData {
  id?: string;
  title: string;
  episodeNumber: number;
  description: string;
  videoUrl: string;
  thumbnailUrl: string;
  duration: number;
  createdAt?: any;
  updatedAt?: any;
}

/** Formats percentage integer into ASCII progress bar: Uploading Episode [██████████████░░░░] 72% */
export function formatUploadProgress(percent: number, label: string = 'Uploading Episode'): string {
  const rounded = Math.min(100, Math.max(0, Math.round(percent)));
  const totalBlocks = 18;
  const filledBlocks = Math.round((rounded / 100) * totalBlocks);
  const emptyBlocks = totalBlocks - filledBlocks;
  const progressBar = '█'.repeat(filledBlocks) + '░'.repeat(emptyBlocks);
  return `${label} [${progressBar}] ${rounded}%`;
}

// ─── Series Operations ───────────────────────────────────────────────────────

export async function createSeries(seriesId: string, data: Omit<SeriesData, 'id'>): Promise<void> {
  const docRef = doc(db, 'series', seriesId);
  await setDoc(docRef, {
    ...data,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
}

export async function updateSeries(seriesId: string, data: Partial<SeriesData>): Promise<void> {
  const docRef = doc(db, 'series', seriesId);
  await updateDoc(docRef, {
    ...data,
    updatedAt: serverTimestamp(),
  });
}

export async function deleteSeries(seriesId: string): Promise<void> {
  // First delete all episode subcollection documents and associated storage files
  const episodes = await getEpisodes(seriesId);
  for (const ep of episodes) {
    if (ep.id) await deleteEpisode(seriesId, ep.id, ep.episodeNumber);
  }

  // Delete cover thumbnail if exists
  try {
    const thumbRef = ref(storage, `thumbnails/${seriesId}/cover.jpg`);
    await deleteObject(thumbRef);
  } catch (e) {
    /* ignore missing file */
  }

  const docRef = doc(db, 'series', seriesId);
  await deleteDoc(docRef);
}

export async function getSeries(seriesId: string): Promise<SeriesData | null> {
  const docRef = doc(db, 'series', seriesId);
  const snap = await getDoc(docRef);
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() } as SeriesData;
}

export async function getSeriesList(): Promise<SeriesData[]> {
  const colRef = collection(db, 'series');
  const snap = await getDocs(colRef);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as SeriesData));
}

// ─── Episode Operations ──────────────────────────────────────────────────────

export async function createEpisode(
  seriesId: string,
  episodeId: string,
  data: Omit<EpisodeData, 'id'>
): Promise<void> {
  const docRef = doc(db, 'series', seriesId, 'episodes', episodeId);
  await setDoc(docRef, {
    ...data,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
}

export async function updateEpisode(
  seriesId: string,
  episodeId: string,
  data: Partial<EpisodeData>
): Promise<void> {
  const docRef = doc(db, 'series', seriesId, 'episodes', episodeId);
  await updateDoc(docRef, {
    ...data,
    updatedAt: serverTimestamp(),
  });
}

export async function deleteEpisode(
  seriesId: string,
  episodeId: string,
  episodeNumber: number
): Promise<void> {
  const numStr = String(episodeNumber).padStart(3, '0');
  
  // Clean up Storage files to prevent orphaned files
  try {
    const videoRef = ref(storage, `videos/${seriesId}/episode-${numStr}.mp4`);
    await deleteObject(videoRef);
  } catch (e) { /* ignore */ }

  try {
    const thumbRef = ref(storage, `thumbnails/${seriesId}/episode-${numStr}.jpg`);
    await deleteObject(thumbRef);
  } catch (e) { /* ignore */ }

  const docRef = doc(db, 'series', seriesId, 'episodes', episodeId);
  await deleteDoc(docRef);
}

export async function getEpisode(seriesId: string, episodeId: string): Promise<EpisodeData | null> {
  const docRef = doc(db, 'series', seriesId, 'episodes', episodeId);
  const snap = await getDoc(docRef);
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() } as EpisodeData;
}

export async function getEpisodes(seriesId: string): Promise<EpisodeData[]> {
  const colRef = collection(db, 'series', seriesId, 'episodes');
  const q = query(colRef, orderBy('episodeNumber', 'asc'));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as EpisodeData));
}

// ─── Storage Upload Operations ───────────────────────────────────────────────

export function uploadVideo(
  seriesId: string,
  episodeNumber: number,
  file: File,
  onProgress?: (percent: number, formatted: string) => void
): Promise<string> {
  return new Promise((resolve, reject) => {
    if (file.type !== 'video/mp4' && !file.name.endsWith('.mp4')) {
      return reject(new Error('Invalid video format. Only MP4 files are supported.'));
    }

    const numStr = String(episodeNumber).padStart(3, '0');
    const storagePath = `videos/${seriesId}/episode-${numStr}.mp4`;
    const storageRef = ref(storage, storagePath);
    const uploadTask = uploadBytesResumable(storageRef, file, {
      contentType: 'video/mp4',
      cacheControl: 'public, max-age=31536000',
    });

    uploadTask.on(
      'state_changed',
      (snapshot) => {
        const pct = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
        const formatted = formatUploadProgress(pct, `Uploading Episode ${episodeNumber}`);
        onProgress?.(pct, formatted);
      },
      (error) => {
        reject(new Error(error.message || 'The video upload failed. Please try again.'));
      },
      async () => {
        try {
          const downloadUrl = await getDownloadURL(uploadTask.snapshot.ref);
          resolve(downloadUrl);
        } catch (e: any) {
          reject(new Error(e?.message || 'Failed to retrieve video download URL.'));
        }
      }
    );
  });
}

export function uploadThumbnail(
  seriesId: string,
  episodeNumber: number | 'cover',
  file: File,
  onProgress?: (percent: number) => void
): Promise<string> {
  return new Promise((resolve, reject) => {
    const filename = episodeNumber === 'cover' ? 'cover.jpg' : `episode-${String(episodeNumber).padStart(3, '0')}.jpg`;
    const storagePath = `thumbnails/${seriesId}/${filename}`;
    const storageRef = ref(storage, storagePath);
    const uploadTask = uploadBytesResumable(storageRef, file, {
      contentType: file.type || 'image/jpeg',
      cacheControl: 'public, max-age=31536000',
    });

    uploadTask.on(
      'state_changed',
      (snapshot) => {
        const pct = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
        onProgress?.(pct);
      },
      (error) => {
        reject(new Error(error.message || 'Thumbnail upload failed. Please try again.'));
      },
      async () => {
        try {
          const downloadUrl = await getDownloadURL(uploadTask.snapshot.ref);
          resolve(downloadUrl);
        } catch (e: any) {
          reject(new Error(e?.message || 'Failed to retrieve thumbnail URL.'));
        }
      }
    );
  });
}
