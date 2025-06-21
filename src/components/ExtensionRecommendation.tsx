export default function ExtensionRecommendation() {
  const extensionUrl = 'https://chromewebstore.google.com/detail/global-speed/jpbjcnkcffbooppibceonlgknpkniiff'

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      <div className="container mx-auto px-6 py-8 max-w-4xl">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Enhance Your Practice with Global Speed
            </h1>
            <p className="text-lg text-gray-600">
              Control video speed and pitch for better lyric typing practice
            </p>
          </div>

          {/* Main Content */}
          <div className="space-y-8">
            {/* Why Global Speed */}
            <div className="bg-blue-50 rounded-lg p-6">
              <h2 className="text-xl font-semibold text-blue-900 mb-4">
                🎵 Why Use Global Speed?
              </h2>
              <div className="grid md:grid-cols-2 gap-4 text-sm text-blue-800">
                <div className="space-y-2">
                  <p><strong>• Slow down videos</strong> for easier practice</p>
                  <p><strong>• Preserve pitch</strong> while changing speed</p>
                  <p><strong>• Universal control</strong> works on any video</p>
                </div>
                <div className="space-y-2">
                  <p><strong>• Keyboard shortcuts</strong> for quick adjustments</p>
                  <p><strong>• Remember settings</strong> per website</p>
                  <p><strong>• Free and open source</strong></p>
                </div>
              </div>
            </div>

            {/* Installation Steps */}
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                📥 Installation Steps
              </h2>
              <div className="space-y-4">
                <div className="flex items-start space-x-4 p-4 bg-gray-50 rounded-lg">
                  <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-semibold text-sm">
                    1
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900">Visit Chrome Web Store</h3>
                    <p className="text-gray-600 text-sm">Click the button below to open Global Speed in the Chrome Web Store</p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-4 p-4 bg-gray-50 rounded-lg">
                  <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-semibold text-sm">
                    2
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900">Add to Chrome</h3>
                    <p className="text-gray-600 text-sm">Click "Add to Chrome" and confirm the installation</p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-4 p-4 bg-gray-50 rounded-lg">
                  <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-semibold text-sm">
                    3
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900">Return to Practice</h3>
                    <p className="text-gray-600 text-sm">Come back to this app and start using keyboard shortcuts on videos</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Keyboard Shortcuts */}
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                ⌨️ Essential Keyboard Shortcuts
              </h2>
              <div className="bg-gray-50 rounded-lg p-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-700">Decrease speed</span>
                      <kbd className="px-2 py-1 bg-gray-200 rounded text-sm font-mono">S</kbd>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-700">Increase speed</span>
                      <kbd className="px-2 py-1 bg-gray-200 rounded text-sm font-mono">D</kbd>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-700">Reset to normal speed</span>
                      <kbd className="px-2 py-1 bg-gray-200 rounded text-sm font-mono">R</kbd>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-700">Toggle pitch preservation</span>
                      <kbd className="px-2 py-1 bg-gray-200 rounded text-sm font-mono">G</kbd>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-700">Show controls</span>
                      <kbd className="px-2 py-1 bg-gray-200 rounded text-sm font-mono">V</kbd>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-700">Right-click video</span>
                      <span className="text-sm text-gray-500">More options</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Recommended Settings */}
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                ⚙️ Recommended Settings for Lyric Practice
              </h2>
              <div className="bg-green-50 rounded-lg p-6">
                <div className="space-y-3 text-green-800">
                  <p><strong>• Set speed to 0.8x (80%)</strong> - Slower pace for easier typing</p>
                  <p><strong>• Enable pitch preservation</strong> - Keep vocals sounding natural</p>
                  <p><strong>• Use remember settings</strong> - Global Speed will save your preferences</p>
                  <p><strong>• Practice incrementally</strong> - Start slow, gradually increase speed</p>
                </div>
              </div>
            </div>

            {/* Call to Action */}
            <div className="text-center space-y-4">
              <a
                href={extensionUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
              >
                Install Global Speed Extension
                <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
              </a>
              
              <p className="text-sm text-gray-500">
                Free extension • Works on all websites • No account required
              </p>
            </div>

            {/* Additional Info */}
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex items-start space-x-3">
                <div className="text-yellow-600">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-yellow-800">
                    Why do I need an extension?
                  </h3>
                  <p className="text-sm text-yellow-700 mt-1">
                    Browser security prevents websites from directly controlling video speed and pitch. 
                    Extensions like Global Speed work around these limitations to give you full control 
                    over playback while maintaining security.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}