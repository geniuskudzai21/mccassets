import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { ArrowLeft } from 'lucide-react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import {
  assetFormSchema,
  assetTypes,
  toAssetPayload,
  type AssetFormValues,
} from '../schemas/asset.schema.ts'
import { useAsset, useDepartments } from '../hooks/useAssets.ts'
import Button from '../components/ui/Button.tsx'
import Select from '../components/ui/Select.tsx'
import { apiPatch, apiPost } from '../lib/api.ts'
import type { AssetRow } from '../types/asset.ts'

const inputClasses =
  'mt-1 block w-full rounded-md border border-line bg-paper px-3 py-2 text-sm text-ink placeholder:text-ink-muted focus:outline-none focus:ring-2 focus:ring-council-teal'

function toFormValues(asset: AssetRow): AssetFormValues {
  return {
    asset_tag: asset.asset_tag,
    type: asset.type,
    brand: asset.brand ?? '',
    model: asset.model ?? '',
    serial_number: asset.serial_number ?? '',
    department_id: asset.department_id ?? '',
    purchase_date: asset.purchase_date.slice(0, 10),
    purchase_cost: String(asset.purchase_cost),
    useful_life_years: asset.useful_life_years ? String(asset.useful_life_years) : '',
    building: asset.building ?? '',
    room: asset.room ?? '',
    warranty_expiry: asset.warranty_expiry ? asset.warranty_expiry.slice(0, 10) : '',
  }
}

export default function AssetFormPage() {
  const { id } = useParams<{ id: string }>()
  const isEdit = Boolean(id)
  const navigate = useNavigate()
  const { asset, loading: assetLoading } = useAsset(id)
  const { departments } = useDepartments()
  const [submitError, setSubmitError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<AssetFormValues>({
    resolver: zodResolver(assetFormSchema),
    defaultValues: {
      asset_tag: '',
      type: 'other',
      brand: '',
      model: '',
      serial_number: '',
      department_id: '',
      purchase_date: '',
      purchase_cost: '',
      useful_life_years: '',
      building: '',
      room: '',
      warranty_expiry: '',
    },
  })

  useEffect(() => {
    if (isEdit && asset) {
      reset(toFormValues(asset))
    }
  }, [isEdit, asset, reset])

  if (isEdit && assetLoading) {
    return <div className="py-16 text-center text-sm text-ink-muted">Loading asset…</div>
  }

  if (isEdit && !asset) {
    return <div className="py-16 text-center text-sm text-ink-muted">Asset not found</div>
  }

  async function onSubmit(values: AssetFormValues) {
    setSubmitError(null)
    const payload = toAssetPayload(values)
    try {
      if (isEdit) {
        await apiPatch<{ data: AssetRow }>(`/api/assets/${id}`, payload)
      } else {
        await apiPost<{ data: AssetRow }>('/api/assets', payload)
      }
      navigate(isEdit ? `/assets/${id}` : '/assets')
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Failed to save asset')
    }
  }

  const departmentOptions = [
    { value: '', label: 'No department' },
    ...departments.map((d) => ({ value: d.id, label: d.name })),
  ]

  return (
    <div className="mx-auto max-w-2xl px-6 py-8">
      <Link
        to={isEdit ? `/assets/${id}` : '/assets'}
        className="inline-flex items-center gap-2 text-sm font-medium text-council-teal hover:underline"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden />
        Back
      </Link>

      <h2 className="mt-4 font-serif text-2xl font-semibold text-ink">
        {isEdit ? 'Edit asset' : 'Add asset'}
      </h2>
      <p className="mt-1 text-sm text-ink-muted">
        {isEdit ? `Update details for ${asset?.asset_tag}.` : 'Register a new ICT asset.'}
      </p>

      <form onSubmit={handleSubmit(onSubmit)} noValidate className="mt-6 space-y-5">
        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <label htmlFor="asset_tag" className="block text-sm font-medium text-ink">
              Asset tag
            </label>
            <input
              id="asset_tag"
              className={inputClasses}
              placeholder="e.g. MC-ICT-0001"
              {...register('asset_tag')}
            />
            {errors.asset_tag ? (
              <p className="mt-1 text-sm text-status-poor">{errors.asset_tag.message}</p>
            ) : null}
          </div>

          <Select
            label="Type"
            options={assetTypes}
            error={errors.type?.message}
            {...register('type')}
          />

          <div>
            <label htmlFor="brand" className="block text-sm font-medium text-ink">
              Make
            </label>
            <input id="brand" className={inputClasses} {...register('brand')} />
            {errors.brand ? (
              <p className="mt-1 text-sm text-status-poor">{errors.brand.message}</p>
            ) : null}
          </div>

          <div>
            <label htmlFor="model" className="block text-sm font-medium text-ink">
              Model
            </label>
            <input id="model" className={inputClasses} {...register('model')} />
            {errors.model ? (
              <p className="mt-1 text-sm text-status-poor">{errors.model.message}</p>
            ) : null}
          </div>

          <div>
            <label htmlFor="serial_number" className="block text-sm font-medium text-ink">
              Serial number
            </label>
            <input id="serial_number" className={inputClasses} {...register('serial_number')} />
            {errors.serial_number ? (
              <p className="mt-1 text-sm text-status-poor">{errors.serial_number.message}</p>
            ) : null}
          </div>

          <Select
            label="Department"
            options={departmentOptions}
            error={errors.department_id?.message}
            {...register('department_id')}
          />

          <div>
            <label htmlFor="purchase_date" className="block text-sm font-medium text-ink">
              Purchase date
            </label>
            <input
              id="purchase_date"
              type="date"
              className={inputClasses}
              {...register('purchase_date')}
            />
            {errors.purchase_date ? (
              <p className="mt-1 text-sm text-status-poor">{errors.purchase_date.message}</p>
            ) : null}
          </div>

          <div>
            <label htmlFor="purchase_cost" className="block text-sm font-medium text-ink">
              Purchase cost (USD)
            </label>
            <input
              id="purchase_cost"
              type="number"
              step="0.01"
              min="0"
              className={inputClasses}
              {...register('purchase_cost')}
            />
            {errors.purchase_cost ? (
              <p className="mt-1 text-sm text-status-poor">{errors.purchase_cost.message}</p>
            ) : null}
          </div>

          <div>
            <label htmlFor="useful_life_years" className="block text-sm font-medium text-ink">
              Useful life (years)
            </label>
            <input
              id="useful_life_years"
              type="number"
              min="1"
              max="100"
              className={inputClasses}
              {...register('useful_life_years')}
            />
            {errors.useful_life_years ? (
              <p className="mt-1 text-sm text-status-poor">{errors.useful_life_years.message}</p>
            ) : null}
          </div>

          <div>
            <label htmlFor="building" className="block text-sm font-medium text-ink">
              Building
            </label>
            <input id="building" className={inputClasses} {...register('building')} />
            {errors.building ? (
              <p className="mt-1 text-sm text-status-poor">{errors.building.message}</p>
            ) : null}
          </div>

          <div>
            <label htmlFor="room" className="block text-sm font-medium text-ink">
              Room
            </label>
            <input id="room" className={inputClasses} {...register('room')} />
            {errors.room ? (
              <p className="mt-1 text-sm text-status-poor">{errors.room.message}</p>
            ) : null}
          </div>

          <div>
            <label htmlFor="warranty_expiry" className="block text-sm font-medium text-ink">
              Warranty expiry
            </label>
            <input
              id="warranty_expiry"
              type="date"
              className={inputClasses}
              {...register('warranty_expiry')}
            />
          </div>
        </div>

        {submitError ? (
          <p role="alert" className="text-sm text-status-poor">
            {submitError}
          </p>
        ) : null}

        <div className="flex gap-3">
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Saving…' : isEdit ? 'Save changes' : 'Add asset'}
          </Button>
          <Link
            to={isEdit ? `/assets/${id}` : '/assets'}
            className="inline-flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium text-council-teal hover:bg-council-teal/5 focus:outline-none focus:ring-2 focus:ring-council-teal"
          >
            Cancel
          </Link>
        </div>
      </form>
    </div>
  )
}
