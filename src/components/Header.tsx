interface HeaderProps {
  currentPage?: 'practice' | 'extension'
  onNavigate?: (page: 'practice' | 'extension') => void
}

export default function Header({ currentPage = 'practice', onNavigate }: HeaderProps) {
  return (
    <header className="bg-white border-b border-gray-200 shadow-sm">
      <div className="container mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <h1 className="text-2xl font-semibold text-gray-900 text-center">
              Type to Music
            </h1>
            <p className="text-center text-gray-600 text-sm mt-1">
              Practice typing with synchronized lyrics
            </p>
          </div>
          
          {onNavigate && (
            <nav className="flex space-x-4">
              <button
                onClick={() => onNavigate('practice')}
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  currentPage === 'practice'
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Practice
              </button>
              <button
                onClick={() => onNavigate('extension')}
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  currentPage === 'extension'
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Speed Control
              </button>
            </nav>
          )}
        </div>
      </div>
    </header>
  )
}