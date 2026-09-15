import { Html5Qrcode } from 'html5-qrcode'
import { useEffect, useRef } from 'react'

export type QrScanError = 'camera-denied' | 'camera-busy' | 'no-camera' | 'unknown'

export function useQrScanner(active: boolean, onDetect: (text: string) => void) {
  const onDetectRef = useRef(onDetect)
  const scannerRef = useRef<Html5Qrcode | null>(null)

  useEffect(() => {
    onDetectRef.current = onDetect
  }, [onDetect])

  useEffect(() => {
    if (!active) return

    const elementId = 'qr-reader'
    const scanner = new Html5Qrcode(elementId)
    scannerRef.current = scanner

    async function start() {
      try {
        await scanner.start(
          { facingMode: 'environment' },
          { fps: 10, qrbox: { width: 250, height: 250 } },
          (decodedText) => {
            onDetectRef.current(decodedText.trim())
          },
          () => {
            /* scanning in progress; ignore per-frame misses */
          },
        )
      } catch {
        /* camera unavailable or busy; manual entry remains available */
      }
    }

    void start()

    return () => {
      const current = scannerRef.current
      scannerRef.current = null
      current
        ?.stop()
        .catch(() => undefined)
        .finally(() => {
          current?.clear()
        })
    }
  }, [active])

  return scannerRef
}
