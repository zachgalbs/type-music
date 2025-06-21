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
    </div>
  )
}