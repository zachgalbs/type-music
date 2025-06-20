interface ActionButtonsProps {
  onReset: () => void
  onSearchOpen: () => void
}

export default function ActionButtons({ onReset, onSearchOpen }: ActionButtonsProps) {
  return (
    <div className="flex justify-center space-x-4">
      <button
        onClick={onReset}
        className="bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-lg font-medium transition-colors"
      >
        Reset Test
      </button>
      <button
        onClick={onSearchOpen}
        className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium transition-colors"
      >
        Search New Song
      </button>
    </div>
  )
}