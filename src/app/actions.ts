
'use server';

import { PlaceHolderImages } from '@/lib/placeholder-images';

async function imageUrlToDataUri(url: string): Promise<string> {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to fetch image: ${response.statusText}`);
    }
    const blob = await response.blob();
    const buffer = await blob.arrayBuffer();
    const base64 = btoa(
      String.fromCharCode(...new Uint8Array(buffer))
    );
    const dataUri = `data:${blob.type};base64,${base64}`;
    return dataUri;
  } catch (error) {
    console.error('Error converting image URL to data URI:', error);
    throw new Error('Could not process image URL.');
  }
}

export async function generateVirtualBackground(
  photoDataUri: string,
  backgroundId: string
): Promise<{ modifiedPhotoDataUri?: string; error?: string }> {
  // Virtual background feature removed - Gemini AI integration has been disabled
  return { error: 'Virtual background feature is currently unavailable.' };
}

export async function getSnapshotDataUri(): Promise<{ dataUri?: string; error?: string }> {
  const userImage = PlaceHolderImages.find((img) => img.id === 'user-video-feed');
  if (!userImage) {
    return { error: 'User placeholder image not found.' };
  }
  try {
    const dataUri = await imageUrlToDataUri(userImage.imageUrl);
    return { dataUri };
  } catch(e) {
    return { error: 'Could not prepare snapshot.' };
  }
}
