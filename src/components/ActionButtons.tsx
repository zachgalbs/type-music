interface ActionButtonsProps {
  onReset: () => void
  onSearchOpen: () => void
  onRefreshLyrics: () => void
  isLoadingLyrics?: boolean
}

export default function ActionButtons({ 
  onReset, 
  onSearchOpen, 
  onRefreshLyrics, 
  isLoadingLyrics
}: ActionButtonsProps) {
  return (
    <div className="space-y-4">
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