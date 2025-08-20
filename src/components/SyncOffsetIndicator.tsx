interface SyncOffsetIndicatorProps {
  offset: number
  onAdjust: (delta: number) => void
  onReset: () => void
}

export default function SyncOffsetIndicator({ offset, onAdjust, onReset }: SyncOffsetIndicatorProps) {
  const formatOffset = (value: number) => {
    const sign = value >= 0 ? '+' : ''
    return `${sign}${value.toFixed(1)}s`
  }
  
  return (
    <div className="fixed bottom-24 left-1/2 -translate-x-1/2 bg-gray-800 text-white px-4 py-3 rounded-lg shadow-lg z-40 border border-gray-700">
      <div className="flex items-center gap-3">
        <span className="text-sm font-medium text-gray-300">Sync Offset:</span>
        
        <div className="flex items-center gap-2">
          <button
            onClick={() => onAdjust(-1.0)}
            className="px-2 py-1 bg-gray-700 hover:bg-gray-600 rounded text-xs transition-colors"
            title="Decrease by 1s"
          >
            -1s
          </button>
          <button
            onClick={() => onAdjust(-0.1)}
            className="px-2 py-1 bg-gray-700 hover:bg-gray-600 rounded text-xs transition-colors"
            title="Decrease by 0.1s"
          >
            -0.1s
          </button>
          
          <span className={`text-lg font-bold min-w-[60px] text-center ${
            offset === 0 ? 'text-gray-400' : offset > 0 ? 'text-green-400' : 'text-orange-400'
          }`}>
            {formatOffset(offset)}
          </span>
          
          <button
            onClick={() => onAdjust(0.1)}
            className="px-2 py-1 bg-gray-700 hover:bg-gray-600 rounded text-xs transition-colors"
            title="Increase by 0.1s"
          >
            +0.1s
          </button>
          <button
            onClick={() => onAdjust(1.0)}
            className="px-2 py-1 bg-gray-700 hover:bg-gray-600 rounded text-xs transition-colors"
            title="Increase by 1s"
          >
            +1s
          </button>
          
          {offset !== 0 && (
            <button
              onClick={onReset}
              className="px-2 py-1 bg-red-900 hover:bg-red-800 rounded text-xs transition-colors ml-2"
              title="Reset to 0"
            >
              Reset
            </button>
          )}
        </div>
      </div>
      
      <div className="text-xs text-gray-400 mt-2 text-center">
        Keyboard: [ / ] to adjust • Shift for ±1s • Shift+D for debug
        <div className="mt-1">
          <span className="text-green-400">+offset</span> = delay lyrics (for intros) • <span className="text-orange-400">-offset</span> = lyrics earlier
        </div>
      </div>
    </div>
  )
}