const CLOUD_NAME = 'dlosqtpjn'
const UPLOAD_PRESET = 'uyh9pdge'
const ENDPOINT = `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`

export async function uploadFotoCloudinary(uri: string): Promise<string> {
  if (uri.startsWith('http')) return uri
  const form = new FormData()
  form.append('file', { uri, type: 'image/jpeg', name: 'foto.jpg' } as any)
  form.append('upload_preset', UPLOAD_PRESET)
  const res = await fetch(ENDPOINT, { method: 'POST', body: form })
  if (!res.ok) throw new Error('Falha no upload da foto')
  const json = await res.json()
  return json.secure_url as string
}

export async function uploadFotosCloudinary(uris: string[]): Promise<string[]> {
  return Promise.all(uris.map(uploadFotoCloudinary))
}
