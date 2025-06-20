interface SearchModalProps {
  isOpen: boolean
  onClose: () => void
  onVideoSelect: (videoId: string) => void
}

export default function SearchModal({ isOpen, onClose }: SearchModalProps) {
  if (!isOpen) return null

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    const song = formData.get('song') as string
    const artist = formData.get('artist') as string
    
    // For now, just close the modal
    // Later we'll implement actual search functionality
    console.log('Searching for:', { song, artist })
    onClose()
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
        <h2 className="text-2xl font-bold mb-4 text-gray-900">Search for a Song</h2>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="song" className="block text-sm font-medium text-gray-700 mb-2">
              Song Title
            </label>
            <input
              type="text"
              id="song"
              name="song"
              className="w-full bg-white text-gray-900 p-3 rounded border border-gray-300 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
              placeholder="Enter song title..."
              required
            />
          </div>
          
          <div>
            <label htmlFor="artist" className="block text-sm font-medium text-gray-700 mb-2">
              Artist Name
            </label>
            <input
              type="text"
              id="artist"
              name="artist"
              className="w-full bg-white text-gray-900 p-3 rounded border border-gray-300 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
              placeholder="Enter artist name..."
            />
          </div>
          
          <div className="flex space-x-4 pt-4">
            <button
              type="submit"
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-3 rounded font-medium transition-colors"
            >
              Search
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-gray-600 hover:bg-gray-700 text-white py-3 rounded font-medium transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}