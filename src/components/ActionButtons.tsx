import type { ChangeEvent } from 'react'

interface ActionButtonsProps {
  onReset: () => void
  onSearchOpen: () => void
  onRefreshLyrics: () => void
  isLoadingLyrics?: boolean
  removeAdLibs: boolean
  onAdLibToggle: (enabled: boolean) => void
  syncOffset: number
  onSyncOffsetChange: (value: number) => void
}

export default function ActionButtons({
  onReset,
  onSearchOpen,
  onRefreshLyrics,
  isLoadingLyrics,
  removeAdLibs,
  onAdLibToggle,
  syncOffset,
  onSyncOffsetChange
}: ActionButtonsProps) {
  const clampOffset = (value: number) => Math.min(3, Math.max(-3, value))
  const roundOffset = (value: number) => Math.round(value * 10) / 10

  const handleSliderChange = (event: ChangeEvent<HTMLInputElement>) => {
    const rawValue = parseFloat(event.target.value)
    if (!Number.isNaN(rawValue)) {
      onSyncOffsetChange(roundOffset(clampOffset(rawValue)))
    }
  }

  const handleNudge = (delta: number) => {
    const nextValue = clampOffset(syncOffset + delta)
    onSyncOffsetChange(roundOffset(nextValue))
  }

  return (
    <div className="space-y-4">
      {/* Main Controls */}
      <div className="flex justify-center space-x-4">
        <button
          onClick={onReset}
          className="bg-red-900 hover:bg-red-800 text-gray-100 px-6 py-2 rounded-lg font-medium transition-colors border border-red-800"
        >
          Reset Test
        </button>
        <button
          onClick={onRefreshLyrics}
          disabled={isLoadingLyrics}
          className="bg-green-900 hover:bg-green-800 disabled:bg-gray-800 text-gray-100 px-6 py-2 rounded-lg font-medium transition-colors border border-green-800"
        >
          {isLoadingLyrics ? 'Loading...' : 'Refresh Lyrics'}
        </button>
        <button
          onClick={onSearchOpen}
          className="bg-blue-900 hover:bg-blue-800 text-gray-100 px-6 py-2 rounded-lg font-medium transition-colors border border-blue-800"
        >
          Search New Song
        </button>
      </div>

      {/* Settings */}
      <div className="flex justify-center">
        <label className="flex items-center space-x-3 text-gray-300 cursor-pointer">
          <input
            type="checkbox"
            checked={removeAdLibs}
            onChange={(event) => onAdLibToggle(event.target.checked)}
            className="w-4 h-4 bg-gray-700 border-gray-600 rounded focus:ring-blue-500 focus:ring-2"
          />
          <span className="text-sm font-medium">Remove ad-libs (parentheses content)</span>
        </label>
      </div>

      {/* Sync Offset */}
      <div className="bg-gray-900 border border-gray-800 rounded-lg p-4 space-y-3">
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-300">Lyric sync delay</span>
          <span className={`font-semibold ${syncOffset >= 0 ? 'text-green-300' : 'text-orange-300'}`}>
            {`${syncOffset >= 0 ? '+' : ''}${syncOffset.toFixed(1)}s`}
          </span>
        </div>
        <input
          type="range"
          min={-3}
          max={3}
          step={0.1}
          value={syncOffset}
          onChange={handleSliderChange}
          className="w-full accent-blue-500"
        />
        <div className="flex items-center justify-between text-xs text-gray-400">
          <button
            type="button"
            onClick={() => handleNudge(-0.1)}
            className="px-2 py-1 bg-gray-800 hover:bg-gray-700 rounded border border-gray-700 text-gray-300 transition-colors"
          >
            -0.1s
          </button>
          <button
            type="button"
            onClick={() => onSyncOffsetChange(0)}
            className="px-2 py-1 bg-gray-800 hover:bg-gray-700 rounded border border-gray-700 text-gray-300 transition-colors"
          >
            Reset
          </button>
          <button
            type="button"
            onClick={() => handleNudge(0.1)}
            className="px-2 py-1 bg-gray-800 hover:bg-gray-700 rounded border border-gray-700 text-gray-300 transition-colors"
          >
            +0.1s
          </button>
        </div>
      </div>
    </div>
  )
}
