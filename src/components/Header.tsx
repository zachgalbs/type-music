interface HeaderProps {
  currentPage?: 'practice' | 'extension'
  onNavigate?: (page: 'practice' | 'extension') => void
}

export default function Header({ currentPage = 'practice', onNavigate }: HeaderProps) {
  return (
    <header className="bg-gray-900 border-b border-gray-800 shadow-lg">
      <div className="container mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <h1 className="text-2xl font-semibold text-gray-100 text-center">
              Type to Music
            </h1>
            <p className="text-center text-gray-400 text-sm mt-1">
              Practice typing with synchronized lyrics
            </p>
          </div>
          
          {onNavigate && (
            <nav className="flex space-x-4">
              <button
                onClick={() => onNavigate('practice')}
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  currentPage === 'practice'
                    ? 'bg-gray-800 text-gray-100'
                    : 'text-gray-400 hover:text-gray-200'
                }`}
              >
                Practice
              </button>
              <button
                onClick={() => onNavigate('extension')}
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  currentPage === 'extension'
                    ? 'bg-gray-800 text-gray-100'
                    : 'text-gray-400 hover:text-gray-200'
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