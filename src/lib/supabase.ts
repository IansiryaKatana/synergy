const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined

export const hasSupabaseEnv = Boolean(supabaseUrl && supabaseAnonKey)

const headers = {
  apikey: supabaseAnonKey ?? '',
  Authorization: `Bearer ${supabaseAnonKey ?? ''}`,
  'Content-Type': 'application/json',
}

const base = `${supabaseUrl}/rest/v1`
const storageBase = `${supabaseUrl}/storage/v1`
const mediaBucket = (import.meta.env.VITE_SUPABASE_MEDIA_BUCKET as string | undefined) ?? 'media'

async function call<T>(path: string, init: RequestInit): Promise<T> {
  const response = await fetch(`${base}/${path}`, init)
  if (!response.ok) {
    const text = await response.text()
    let parsedMessage = text
    try {
      const parsed = JSON.parse(text) as {
        message?: string
        error?: string
        details?: string
        code?: string
      }
      const parts = [parsed.code, parsed.message ?? parsed.error, parsed.details].filter(Boolean)
      parsedMessage = parts.join(' | ')
    } catch {
      // keep raw response text
    }
    throw new Error(
      `Request failed (${response.status}) on /rest/v1/${path.split('?')[0]}: ${parsedMessage}`,
    )
  }
  if (response.status === 204) return null as T
  return (await response.json()) as T
}

export const supabaseRest = {
  async callFunction<T>(functionName: string, payload: Record<string, unknown>): Promise<T> {
    if (!hasSupabaseEnv || !supabaseUrl) {
      throw new Error('Missing Supabase env vars.')
    }
    const response = await fetch(`${supabaseUrl}/functions/v1/${functionName}`, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
    })
    if (!response.ok) {
      const text = await response.text()
      throw new Error(`Function call failed (${response.status}) on ${functionName}: ${text}`)
    }
    if (response.status === 204) return null as T
    return (await response.json()) as T
  },
  async select<T>(table: string, query = '*'): Promise<T[]> {
    if (!hasSupabaseEnv) return []
    return call<T[]>(`${table}?select=${encodeURIComponent(query)}`, { headers })
  },
  async selectOne<T>(table: string): Promise<T | null> {
    if (!hasSupabaseEnv) return null
    const data = await call<T[]>(`${table}?select=*`, { headers })
    return data[0] ?? null
  },
  async upsert<T>(table: string, payload: Record<string, unknown>): Promise<T> {
    return call<T>(`${table}`, {
      method: 'POST',
      headers: { ...headers, Prefer: 'resolution=merge-duplicates,return=representation' },
      body: JSON.stringify(payload),
    }).then((list: any) => (Array.isArray(list) ? list[0] : list))
  },
  async patchByIds(table: string, ids: string[], payload: Record<string, unknown>) {
    const idFilter = ids.map((x) => `"${x}"`).join(',')
    return call(`${table}?id=in.(${idFilter})`, {
      method: 'PATCH',
      headers: { ...headers, Prefer: 'return=minimal' },
      body: JSON.stringify(payload),
    })
  },
  async deleteByIds(table: string, ids: string[]) {
    const idFilter = ids.map((x) => `"${x}"`).join(',')
    return call(`${table}?id=in.(${idFilter})`, {
      method: 'DELETE',
      headers: { ...headers, Prefer: 'return=minimal' },
    })
  },
  async uploadMedia(
    file: File,
    folder = 'uploads',
    bucket = mediaBucket,
    onProgress?: (percent: number) => void,
  ) {
    if (!hasSupabaseEnv || !supabaseUrl) throw new Error('Missing Supabase env vars.')
    const ext = file.name.includes('.') ? file.name.split('.').pop() : 'bin'
    const safeName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
    const path = `${folder}/${safeName}`
    const uploadWithXhr = async (mode: 'multipart' | 'binary') => {
      await new Promise<void>((resolve, reject) => {
        const xhr = new XMLHttpRequest()
        xhr.open(mode === 'multipart' ? 'POST' : 'PUT', `${storageBase}/object/${bucket}/${path}`)
        xhr.setRequestHeader('apikey', supabaseAnonKey ?? '')
        xhr.setRequestHeader('Authorization', `Bearer ${supabaseAnonKey ?? ''}`)
        xhr.setRequestHeader('x-upsert', 'true')
        if (mode === 'binary') {
          xhr.setRequestHeader('Content-Type', 'application/octet-stream')
        }
        xhr.upload.onprogress = (event) => {
          if (!event.lengthComputable) return
          const percent = Math.round((event.loaded / event.total) * 100)
          onProgress?.(percent)
        }
        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            onProgress?.(100)
            resolve()
            return
          }
          let parsedMessage = xhr.responseText
          try {
            const parsed = JSON.parse(xhr.responseText) as { message?: string; error?: string }
            parsedMessage = parsed.message ?? parsed.error ?? xhr.responseText
          } catch {
            // keep raw text
          }
          reject(
            new Error(
              `Storage upload failed (${xhr.status}). ${parsedMessage}. Check that bucket "${bucket}" exists, is accessible, and storage policies allow upload.`,
            ),
          )
        }
        xhr.onerror = () => reject(new Error('Upload failed due to network error.'))
        if (mode === 'multipart') {
          const formData = new FormData()
          formData.append('file', file)
          xhr.send(formData)
          return
        }
        xhr.send(file)
      })
    }

    try {
      await uploadWithXhr('multipart')
    } catch (error) {
      const message = error instanceof Error ? error.message : ''
      const isUnsupportedMime =
        message.toLowerCase().includes('mime type') && message.toLowerCase().includes('not supported')
      if (!isUnsupportedMime) {
        throw error
      }
      await uploadWithXhr('binary')
    }
    const publicUrl = `${supabaseUrl}/storage/v1/object/public/${bucket}/${path}`
    return { path, publicUrl }
  },
  async listMedia(bucket = mediaBucket, limit = 100, offset = 0): Promise<Array<{ name: string }>> {
    if (!hasSupabaseEnv) return []
    const response = await fetch(`${storageBase}/object/list/${bucket}`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        prefix: '',
        limit,
        offset,
        sortBy: { column: 'name', order: 'asc' },
      }),
    })
    if (!response.ok) throw new Error(await response.text())
    return (await response.json()) as Array<{ name: string }>
  },
  getPublicMediaUrl(path: string, bucket = mediaBucket) {
    if (!supabaseUrl) return path
    return `${supabaseUrl}/storage/v1/object/public/${bucket}/${path}`
  },
}
