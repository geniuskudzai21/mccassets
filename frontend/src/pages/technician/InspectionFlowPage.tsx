import {
  Check,
  ChevronLeft,
  ChevronRight,
  CircleCheck,
  CircleAlert,
  CircleX,
  Circle,
  Crosshair,
  ImagePlus,
  MapPin,
  QrCode,
  Search,
  Send,
  X,
} from 'lucide-react'
import { useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Button from '../../components/ui/Button.tsx'
import { StatusBadge } from '../../components/ui/StatusBadge.tsx'
import { useAuth } from '../../hooks/useAuth.ts'
import { useQrScanner } from '../../hooks/useQrScanner.ts'
import { api, apiPost } from '../../lib/api.ts'
import { queueInspection } from '../../lib/sync.ts'
import { uploadPhotoBlob } from '../../lib/uploads.ts'
import { assetTypeLabel } from '../../types/asset.ts'
import type { AssetListResponse, AssetRow } from '../../types/asset.ts'
import type { AssetStatus } from '../../types/db.ts'
import type { InspectionRow } from '../../types/asset.ts'

const STEPS = ['Asset', 'Condition', 'Photo', 'Location', 'Review'] as const

const conditionOptions: {
  status: AssetStatus
  label: string
  icon: typeof CircleCheck
  description: string
}[] = [
  { status: 'good', label: 'Good', icon: CircleCheck, description: 'Working as expected' },
  { status: 'fair', label: 'Fair', icon: CircleAlert, description: 'Works, minor wear' },
  { status: 'poor', label: 'Poor', icon: CircleX, description: 'Failing, needs attention' },
  { status: 'disposal', label: 'Disposal', icon: Circle, description: 'Beyond economic repair' },
]

const readFile = (file: File) =>
  new Promise<string>((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = () => reject(new Error('Could not read photo'))
    reader.readAsDataURL(file)
  })

export default function InspectionFlowPage() {
  const navigate = useNavigate()
  const { user } = useAuth()

  const [step, setStep] = useState(0)
  const [scanning, setScanning] = useState(false)
  const [manualTag, setManualTag] = useState('')
  const [asset, setAsset] = useState<AssetRow | null>(null)
  const [assetError, setAssetError] = useState<string | null>(null)
  const [searching, setSearching] = useState(false)
  const [status, setStatus] = useState<AssetStatus | null>(null)
  const [notes, setNotes] = useState('')
  const [photos, setPhotos] = useState<File[]>([])
  const [previews, setPreviews] = useState<string[]>([])
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null)
  const [locationError, setLocationError] = useState<string | null>(null)
  const [capturingGps, setCapturingGps] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [submittedOffline, setSubmittedOffline] = useState(false)
  const [done, setDone] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useQrScanner(scanning, (text) => {
    void handleDetected(text)
  })

  async function handleDetected(text: string) {
    setScanning(false)
    const candidate = text.includes('/') ? (text.split('/').filter(Boolean).pop() ?? text) : text
    await lookupAsset(candidate)
  }

  async function lookupAsset(input: string) {
    setAssetError(null)
    setSearching(true)
    try {
      const q = input.trim()
      if (!q) {
        setAssetError('Enter or scan an asset tag.')
        return
      }
      const params = new URLSearchParams({ q, limit: '10' })
      const result = await api<AssetListResponse>(`/api/assets?${params.toString()}`)
      const match = result.data.find(
        (item) =>
          item.id === q ||
          item.asset_tag.toLowerCase() === q.toLowerCase() ||
          item.serial_number?.toLowerCase() === q.toLowerCase(),
      )
      if (!match) {
        setAssetError(`No asset matches “${q}”. Check the tag and try again.`)
        return
      }
      setAsset(match)
      setStep(1)
    } catch (err) {
      setAssetError(err instanceof Error ? err.message : 'Could not look up the asset.')
    } finally {
      setSearching(false)
    }
  }

  const previewsMemo = useMemo(() => previews, [previews])

  async function handleFiles(files: FileList | null) {
    if (!files) return
    const incoming = Array.from(files).slice(0, 3)
    setPhotos((existing) => [...existing, ...incoming].slice(0, 3))
    const parsed = await Promise.all(incoming.map((file) => readFile(file)))
    setPreviews((existing) => [...existing, ...parsed].slice(0, 3))
  }

  function removePhoto(index: number) {
    setPhotos((existing) => existing.filter((_, i) => i !== index))
    setPreviews((existing) => existing.filter((_, i) => i !== index))
  }

  function captureLocation() {
    if (!('geolocation' in navigator)) {
      setLocationError('GPS is not available on this device.')
      return
    }
    setCapturingGps(true)
    setLocationError(null)
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocation({ lat: position.coords.latitude, lng: position.coords.longitude })
        setCapturingGps(false)
      },
      () => {
        setLocationError('Could not get GPS position. Check permissions and retry.')
        setCapturingGps(false)
      },
      { enableHighAccuracy: true, timeout: 12000 },
    )
  }

  async function submitInspection() {
    if (!asset || !status || !user) return
    setSubmitting(true)
    setSubmitError(null)
    try {
      if (navigator.onLine) {
        const photoUrls: string[] = []
        for (const file of photos) {
          photoUrls.push(await uploadPhotoBlob(file, file.type || 'image/jpeg'))
        }
        await apiPost<{ data: InspectionRow }>('/api/inspections', {
          asset_id: asset.id,
          status,
          notes: notes.trim() || undefined,
          photo_urls: photoUrls.length > 0 ? photoUrls : undefined,
          lat: location?.lat,
          lng: location?.lng,
        })
      } else {
        throw new Error('offline')
      }
      setSubmittedOffline(false)
      setDone(true)
      setStep(4)
    } catch {
      await queueInspection({
        asset_id: asset.id,
        status,
        notes: notes.trim() || undefined,
        lat: location?.lat,
        lng: location?.lng,
        photos: photos.map((file) => ({ blob: file, contentType: file.type || 'image/jpeg' })),
      })
      setSubmittedOffline(true)
      setDone(true)
      setStep(4)
    } finally {
      setSubmitting(false)
    }
  }

  function canContinue(): boolean {
    switch (step) {
      case 0:
        return asset != null
      case 1:
        return status != null
      case 2:
        return true
      case 3:
        return location != null
      default:
        return true
    }
  }

  function goNext() {
    if (!canContinue()) return
    if (step === 3) {
      void submitInspection()
      return
    }
    setStep((current) => Math.min(current + 1, STEPS.length - 1))
  }

  if (done) {
    return (
      <div className="px-4 py-10 text-center">
        <CircleCheck className="mx-auto h-12 w-12 text-status-good" aria-hidden />
        <h2 className="mt-4 font-serif text-xl font-semibold text-ink">
          {submittedOffline ? 'Saved to this device' : 'Inspection submitted'}
        </h2>
        <p className="mt-2 text-sm text-ink-muted">
          {asset?.asset_tag} recorded as <span className="capitalize">{status}</span>.
        </p>
        {submittedOffline ? (
          <p className="mx-auto mt-3 max-w-xs rounded-md border border-council-teal/30 bg-council-teal/10 px-3 py-2 text-sm text-council-teal">
            No connection right now — it will sync automatically when you&rsquo;re back online.
          </p>
        ) : null}
        <div className="mt-6 flex flex-col gap-3">
          <Button onClick={() => navigate('/scan')}>Scan another asset</Button>
          <Button variant="outline" onClick={() => navigate('/my-inspections')}>
            View my inspections
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="px-4 py-5">
      <h2 className="font-serif text-xl font-semibold text-ink">New inspection</h2>
      <p className="mt-1 text-sm text-ink-muted">
        Step {step + 1} of {STEPS.length} — {STEPS[step]}
      </p>

      <ol className="mt-3 flex gap-1" aria-label="Progress">
        {STEPS.map((label, index) => (
          <li
            key={label}
            title={label}
            className={`h-1 flex-1 rounded-full bg-line ${index <= step ? 'bg-council-teal' : ''}`}
          />
        ))}
      </ol>

      <div className="mt-5">
        {step === 0 && (
          <section>
            <div className="flex gap-3">
              <Button onClick={() => setScanning((value) => !value)} className="min-h-12 flex-1">
                <QrCode className="h-5 w-5" aria-hidden />
                {scanning ? 'Stop scanning' : 'Scan QR code'}
              </Button>
              <Button
                variant="outline"
                className="min-h-12 flex-1"
                onClick={() => setManualTag('')}
              >
                <Search className="h-5 w-5" aria-hidden />
                Enter tag
              </Button>
            </div>

            {scanning ? (
              <div className="mt-4">
                <div id="qr-reader" />
                <p className="mt-2 text-center text-sm text-ink-muted">
                  Point the camera at the asset QR code.
                </p>
              </div>
            ) : (
              <div className="mt-4">
                <label htmlFor="manual-tag" className="block text-sm font-medium text-ink">
                  Asset tag or serial number
                </label>
                <div className="mt-1 flex gap-2">
                  <input
                    id="manual-tag"
                    value={manualTag}
                    onChange={(event) => setManualTag(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter') {
                        event.preventDefault()
                        void lookupAsset(manualTag)
                      }
                    }}
                    placeholder="e.g. MC-ICT-0001"
                    className="min-h-12 w-full rounded-md border border-line bg-paper px-3 text-sm text-ink placeholder:text-ink-muted focus:outline-none focus:ring-2 focus:ring-council-teal"
                  />
                  <Button
                    onClick={() => void lookupAsset(manualTag)}
                    disabled={searching || manualTag.trim() === ''}
                    className="min-h-12"
                  >
                    {searching ? 'Searching…' : 'Find'}
                  </Button>
                </div>
              </div>
            )}

            {assetError ? (
              <p role="alert" className="mt-3 text-sm text-status-poor">
                {assetError}
              </p>
            ) : null}

            {asset ? (
              <div className="mt-4 rounded-md border border-line bg-paper p-4 shadow-sm">
                <p className="text-sm text-ink-muted">Selected asset</p>
                <p className="mt-1 font-serif text-lg font-semibold text-ink">{asset.asset_tag}</p>
                <p className="text-sm text-ink-muted">
                  {assetTypeLabel[asset.type] ?? asset.type}
                  {asset.brand ? ` · ${asset.brand}` : ''}
                  {asset.model ? ` ${asset.model}` : ''}
                </p>
                <div className="mt-3">
                  <StatusBadge status={asset.current_status} />
                </div>
              </div>
            ) : null}
          </section>
        )}

        {step === 1 && (
          <section>
            <p className="text-sm text-ink-muted">
              How would you rate this asset&rsquo;s condition?
            </p>
            <div className="mt-3 space-y-3">
              {conditionOptions.map((option) => {
                const Icon = option.icon
                const active = status === option.status
                return (
                  <button
                    key={option.status}
                    type="button"
                    onClick={() => setStatus(option.status)}
                    aria-pressed={active}
                    className={`flex min-h-14 w-full items-center gap-3 rounded-md border px-4 py-3 text-left focus:outline-none focus:ring-2 focus:ring-council-teal ${
                      active ? 'border-council-teal bg-white' : 'border-line bg-paper'
                    }`}
                  >
                    <Icon
                      aria-hidden
                      className={`h-6 w-6 ${active ? 'text-council-teal' : 'text-ink-muted'}`}
                    />
                    <div className="flex-1">
                      <p className="font-medium text-ink">{option.label}</p>
                      <p className="text-sm text-ink-muted">{option.description}</p>
                    </div>
                    {active ? <Check className="h-5 w-5 text-council-teal" aria-hidden /> : null}
                  </button>
                )
              })}
            </div>
          </section>
        )}

        {step === 2 && (
          <section>
            <p className="text-sm text-ink-muted">
              Add up to three photos showing the asset&rsquo;s condition.
            </p>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              capture="environment"
              multiple
              className="hidden"
              onChange={(event) => {
                void handleFiles(event.target.files)
                event.target.value = ''
              }}
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="flex min-h-24 w-full flex-col items-center justify-center gap-2 rounded-md border border-dashed border-line bg-paper text-sm text-ink-muted focus:outline-none focus:ring-2 focus:ring-council-teal"
            >
              <ImagePlus className="h-7 w-7" aria-hidden />
              Tap to take or choose a photo
            </button>

            {previewsMemo.length > 0 ? (
              <ul className="mt-4 grid grid-cols-3 gap-3">
                {previewsMemo.map((preview, index) => (
                  <li key={`${preview.slice(0, 40)}-${index}`} className="relative">
                    <img
                      src={preview}
                      alt={`Photo ${index + 1}`}
                      className="aspect-square w-full rounded-md border border-line object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => removePhoto(index)}
                      aria-label={`Remove photo ${index + 1}`}
                      className="absolute -right-2 -top-2 flex h-7 w-7 items-center justify-center rounded-full border border-line bg-paper text-ink-muted shadow-sm focus:outline-none focus:ring-2 focus:ring-council-teal"
                    >
                      <X className="h-4 w-4" aria-hidden />
                    </button>
                  </li>
                ))}
              </ul>
            ) : null}
          </section>
        )}

        {step === 3 && (
          <section>
            <p className="text-sm text-ink-muted">
              Capture the current GPS position of this asset.
            </p>
            <Button
              onClick={captureLocation}
              disabled={capturingGps}
              className="mt-3 min-h-12 w-full"
            >
              <Crosshair className="h-5 w-5" aria-hidden />
              {capturingGps ? 'Locating…' : location ? 'Retake position' : 'Capture GPS'}
            </Button>

            {location ? (
              <div className="mt-4 flex items-center gap-3 rounded-md border border-line bg-paper p-4 shadow-sm">
                <MapPin className="h-6 w-6 text-council-teal" aria-hidden />
                <div>
                  <p className="text-sm font-medium text-ink">Position captured</p>
                  <p className="text-sm text-ink-muted">
                    {location.lat.toFixed(6)}, {location.lng.toFixed(6)}
                  </p>
                </div>
              </div>
            ) : null}

            {locationError ? (
              <p role="alert" className="mt-3 text-sm text-status-poor">
                {locationError}
              </p>
            ) : null}
          </section>
        )}

        {step === 4 && (
          <section>
            <p className="text-sm text-ink-muted">Review and submit this inspection.</p>
            <dl className="mt-3 space-y-3 rounded-md border border-line bg-paper p-4 shadow-sm text-sm">
              <div>
                <dt className="text-ink-muted">Asset</dt>
                <dd className="mt-0.5 font-medium text-ink">{asset?.asset_tag}</dd>
              </div>
              <div>
                <dt className="text-ink-muted">Condition</dt>
                <dd className="mt-0.5">{status ? <StatusBadge status={status} /> : '—'}</dd>
              </div>
              <div>
                <dt className="text-ink-muted">Photos</dt>
                <dd className="mt-0.5 font-medium text-ink">{photos.length} attached</dd>
              </div>
              <div>
                <dt className="text-ink-muted">Location</dt>
                <dd className="mt-0.5 font-medium text-ink">
                  {location
                    ? `${location.lat.toFixed(6)}, ${location.lng.toFixed(6)}`
                    : 'Not captured'}
                </dd>
              </div>
            </dl>

            <label htmlFor="notes" className="mt-4 block text-sm font-medium text-ink">
              Notes
            </label>
            <textarea
              id="notes"
              rows={3}
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              maxLength={1000}
              placeholder="Optional notes about the condition"
              className="mt-1 w-full rounded-md border border-line bg-paper px-3 py-2 text-sm text-ink placeholder:text-ink-muted focus:outline-none focus:ring-2 focus:ring-council-teal"
            />

            {submitError ? (
              <p role="alert" className="mt-3 text-sm text-status-poor">
                {submitError}
              </p>
            ) : null}
          </section>
        )}
      </div>

      <div className="mt-6 flex items-center justify-between gap-3">
        <Button
          variant="ghost"
          className="min-h-12"
          onClick={() =>
            step === 0 ? navigate('/') : setStep((current) => Math.max(current - 1, 0))
          }
        >
          <ChevronLeft className="h-5 w-5" aria-hidden />
          Back
        </Button>
        {step < 4 ? (
          <Button
            className="min-h-12 flex-1"
            onClick={goNext}
            disabled={!canContinue() || submitting}
          >
            {step === 3 ? 'Submit' : 'Continue'}
            {step === 3 ? (
              <Send className="h-5 w-5" aria-hidden />
            ) : (
              <ChevronRight className="h-5 w-5" aria-hidden />
            )}
          </Button>
        ) : (
          <Button
            className="min-h-12 flex-1"
            onClick={() => void submitInspection()}
            disabled={submitting}
          >
            {submitting ? 'Submitting…' : 'Submit inspection'}
          </Button>
        )}
      </div>
    </div>
  )
}
