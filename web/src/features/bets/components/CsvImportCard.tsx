import { useState } from 'react'
import { supabase, SUPABASE_ANON_KEY, SUPABASE_URL } from '../../../lib/supabaseClient'

interface CsvImportCardProps {
  onSuccess: () => void
  onError?: (message: string) => void
}

function buildFunctionsUrl() {
  const url = new URL(SUPABASE_URL)
  const host = url.hostname.replace('supabase.', 'functions.supabase.')
  return `${url.protocol}//${host}`
}

export function CsvImportCard({ onSuccess, onError }: CsvImportCardProps) {
  const [isUploading, setIsUploading] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [summary, setSummary] = useState<Record<string, unknown> | null>(null)

  const handleUpload = async (file: File) => {
    const endpoint = `${buildFunctionsUrl()}/csv-import`
    const formData = new FormData()
    formData.append('file', file)

    setIsUploading(true)
    setMessage(null)
    setSummary(null)

    try {
      const { data } = await supabase.auth.getSession()
      const token = data.session?.access_token

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          apikey: SUPABASE_ANON_KEY,
          Authorization: `Bearer ${token ?? SUPABASE_ANON_KEY}`,
        },
        body: formData,
      })

      const payload = await response.json()
      if (!response.ok) {
        throw new Error(payload.error ?? 'Error importando CSV')
      }

      setMessage(`Importadas ${payload.imported ?? 0} apuestas`)
      setSummary(payload)
      onSuccess()
    } catch (error) {
      console.error('CSV upload error', error)
      const fallback = error instanceof Error ? error.message : 'No se pudo importar el CSV'
      setMessage(fallback)
      onError?.(fallback)
    } finally {
      setIsUploading(false)
    }
  }

  return (
    <article className="panel">
      <h2>Importar CSV</h2>
      <p className="muted">El archivo debe seguir las columnas esperadas por la función Edge.</p>
      <label className="upload">
        <input type="file" accept=".csv" onChange={(event) => {
          const file = event.target.files?.[0]
          if (file) {
            void handleUpload(file)
            event.target.value = ''
          }
        }} disabled={isUploading} />
        <span>{isUploading ? 'Subiendo…' : 'Selecciona CSV'}</span>
      </label>
      {message && <p className="muted">{message}</p>}
      {summary && (
        <dl className="import-summary">
          {Object.entries(summary).map(([key, value]) => (
            <div key={key}>
              <dt>{key}</dt>
              <dd>{String(value)}</dd>
            </div>
          ))}
        </dl>
      )}
    </article>
  )
}
