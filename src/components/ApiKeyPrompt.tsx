import { useState } from 'react'

interface ApiKeyPromptProps {
  isOpen: boolean
  onSubmit: (apiKey: string) => void
  onCancel: () => void
}

export default function ApiKeyPrompt({ isOpen, onSubmit, onCancel }: ApiKeyPromptProps) {
  const [apiKey, setApiKey] = useState('')
  const [error, setError] = useState('')

  if (!isOpen) return null

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!apiKey.trim()) {
      setError('Please enter an API key')
      return
    }

    // Basic validation for YouTube API key format
    if (!/^[A-Za-z0-9_-]{35,45}$/.test(apiKey.trim())) {
      setError('Invalid API key format. YouTube API keys are typically 39 characters long.')
      return
    }

    onSubmit(apiKey.trim())
    setApiKey('')
    setError('')
  }

  const handleCancel = () => {
    setApiKey('')
    setError('')
    onCancel()
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-gray-800 border border-gray-700 rounded-lg p-6 w-full max-w-md mx-4">
        <h2 className="text-xl font-bold mb-4 text-gray-100">YouTube API Key Required</h2>
        
        <div className="mb-4 text-sm text-gray-300">
          <p className="mb-2">To search for YouTube videos, you need a YouTube Data API v3 key.</p>
          <p className="mb-2">Get one from the Google Cloud Console:</p>
          <ol className="list-decimal list-inside space-y-1 text-gray-400">
            <li>Go to Google Cloud Console</li>
            <li>Enable YouTube Data API v3</li>
            <li>Create credentials (API key)</li>
            <li>Copy the API key below</li>
          </ol>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="apiKey" className="block text-sm font-medium text-gray-300 mb-2">
              API Key
            </label>
            <input
              type="text"
              id="apiKey"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              className="w-full bg-gray-700 text-gray-100 p-3 rounded border border-gray-600 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter your YouTube API key..."
              required
            />
            {error && (
              <p className="mt-2 text-sm text-red-400">{error}</p>
            )}
          </div>
          
          <div className="flex space-x-4 pt-4">
            <button
              type="submit"
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-3 rounded font-medium transition-colors"
            >
              Save API Key
            </button>
            <button
              type="button"
              onClick={handleCancel}
              className="flex-1 bg-gray-600 hover:bg-gray-700 text-white py-3 rounded font-medium transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
        
        <div className="mt-4 p-3 bg-gray-900 rounded border border-gray-700">
          <p className="text-xs text-gray-400">
            Your API key will be stored locally in your browser and only used to search YouTube videos.
          </p>
        </div>
      </div>
    </div>
  )
}