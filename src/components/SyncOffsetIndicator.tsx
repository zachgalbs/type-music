interface SyncOffsetIndicatorProps {
  offset: number
}

export default function SyncOffsetIndicator({ offset }: SyncOffsetIndicatorProps) {
  if (offset === 0) return null

  const formatOffset = (value: number) => {
    const sign = value >= 0 ? '+' : ''
    return `${sign}${value.toFixed(1)}s`
  }

  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 bg-gray-800 text-white px-4 py-2 rounded-lg shadow-lg z-50 animate-pulse">
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium">Sync Offset:</span>
        <span className={`text-lg font-bold ${offset > 0 ? 'text-green-400' : 'text-orange-400'}`}>
          {formatOffset(offset)}
        </span>
      </div>
      <div className="text-xs text-gray-400 mt-1">
        Press [ or ] to adjust • Shift for ±1s
      </div>
    </div>
  )
}
