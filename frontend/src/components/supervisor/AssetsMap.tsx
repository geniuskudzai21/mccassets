import L from 'leaflet'
import { MapContainer, Marker, Popup, TileLayer } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import { STATUS_COLORS, STATUS_LABELS } from '../../lib/status.ts'
import type { LocationInfo } from './types.ts'

interface AssetsMapProps {
  assets: LocationInfo[]
}

function markerIcon(status: LocationInfo['current_status']) {
  const color = STATUS_COLORS[status]
  return L.divIcon({
    className: 'asset-map-marker',
    html: `<span style="background-color:${color};border-color:#FFFFFF"></span>`,
    iconSize: [18, 18],
    iconAnchor: [9, 9],
  })
}

export function AssetsMap({ assets }: AssetsMapProps) {
  const located = assets.filter((asset) => asset.last_lat != null && asset.last_lng != null)

  if (located.length === 0) {
    return (
      <p className="rounded-md border border-line bg-paper p-6 text-sm text-ink-muted">
        No assets have GPS coordinates yet.
      </p>
    )
  }

  const minLat = Math.min(...located.map((a) => a.last_lat as number))
  const maxLat = Math.max(...located.map((a) => a.last_lat as number))
  const minLng = Math.min(...located.map((a) => a.last_lng as number))
  const maxLng = Math.max(...located.map((a) => a.last_lng as number))

  const bounds: [[number, number], [number, number]] = [
    [minLat, minLng],
    [maxLat, maxLng],
  ]

  return (
    <MapContainer
      bounds={bounds}
      boundsOptions={{ padding: [24, 24] }}
      className="relative isolate z-0 h-[320px] w-full min-w-0 overflow-hidden rounded-md border border-line lg:h-[420px]"
      scrollWheelZoom={false}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {located.map((asset) => (
        <Marker
          key={asset.id}
          position={[asset.last_lat as number, asset.last_lng as number]}
          icon={markerIcon(asset.current_status)}
        >
          <Popup>
            <span className="font-medium text-ink">{asset.asset_tag}</span>
            <br />
            <span className="text-sm text-ink-muted">{STATUS_LABELS[asset.current_status]}</span>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  )
}
