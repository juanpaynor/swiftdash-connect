
'use server';

import { applyVirtualBackground } from '@/ai/flows/virtual-background';
import { PlaceHolderImages } from '@/lib/placeholder-images';

async function imageUrlToDataUri(url: string): Promise<string> {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to fetch image: ${response.statusText}`);
    }
    const blob = await response.blob();
    const buffer = Buffer.from(await blob.arrayBuffer());
    const dataUri = `data:${blob.type};base64,${buffer.toString('base64')}`;
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
  if (!photoDataUri.startsWith('data:image/')) {
    return { error: 'Invalid user photo format.' };
  }

  const backgroundImage = PlaceHolderImages.find(img => img.id === backgroundId);

  if (!backgroundImage) {
    return { error: 'Background image not found.' };
  }

  try {
    const virtualBackgroundDataUri = await imageUrlToDataUri(backgroundImage.imageUrl);
    const result = await applyVirtualBackground({
      photoDataUri,
      virtualBackgroundDataUri,
    });
    return result;
  } catch (error) {
    console.error('Error in generateVirtualBackground:', error);
    return { error: 'Failed to generate virtual background. Please try again later.' };
  }
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
