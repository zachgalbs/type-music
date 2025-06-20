interface ActionButtonsProps {
  onReset: () => void
  onSearchOpen: () => void
  onRefreshLyrics: () => void
  isLoadingLyrics?: boolean
  onPlayVideo?: () => void
  onPauseVideo?: () => void
  onStopVideo?: () => void
  playerState?: number
}

export default function ActionButtons({ 
  onReset, 
  onSearchOpen, 
  onRefreshLyrics, 
  isLoadingLyrics,
  onPlayVideo,
  onPauseVideo,
  onStopVideo,
  playerState
}: ActionButtonsProps) {
  const isPlaying = playerState === 1
  const isPaused = playerState === 2

  return (
    <div className="space-y-4">
      {/* Video Controls */}
      <div className="flex justify-center space-x-2">
        <button
          onClick={onPlayVideo}
          disabled={isPlaying}
          className="bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white px-4 py-2 rounded-lg font-medium transition-colors"
        >
          ▶️ Play
        </button>
        <button
          onClick={onPauseVideo}
          disabled={!isPlaying}
          className="bg-yellow-600 hover:bg-yellow-700 disabled:bg-gray-400 text-white px-4 py-2 rounded-lg font-medium transition-colors"
        >
          ⏸️ Pause
        </button>
        <button
          onClick={onStopVideo}
          className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg font-medium transition-colors"
        >
          ⏹️ Stop
        </button>
      </div>

      {/* Main Controls */}
      <div className="flex justify-center space-x-4">
        <button
          onClick={onReset}
          className="bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-lg font-medium transition-colors"
        >
          Reset Test
        </button>
        <button
          onClick={onRefreshLyrics}
          disabled={isLoadingLyrics}
          className="bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white px-6 py-2 rounded-lg font-medium transition-colors"
        >
          {isLoadingLyrics ? 'Loading...' : 'Refresh Lyrics'}
        </button>
        <button
          onClick={onSearchOpen}
          className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium transition-colors"
        >
          Search New Song
        </button>
      </div>
    </div>
  )
}