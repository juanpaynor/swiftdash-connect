export const streamConfig = {
  apiKey: process.env.NEXT_PUBLIC_STREAM_API_KEY!,
  apiSecret: process.env.STREAM_API_SECRET!,
}

export function validateStreamConfig() {
  if (!streamConfig.apiKey) {
    throw new Error('NEXT_PUBLIC_STREAM_API_KEY is not defined')
  }
  if (!streamConfig.apiSecret) {
    throw new Error('STREAM_API_SECRET is not defined')
  }
}
