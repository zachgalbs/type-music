import { useState, useEffect } from 'react'

export default function GlobalSpeedDetector() {
  const [extensionDetected, setExtensionDetected] = useState<boolean | null>(null)
  const [showInstructions, setShowInstructions] = useState(false)
  const [manualOverride, setManualOverride] = useState(false)
  const [youtubeIframeFound, setYoutubeIframeFound] = useState(false)
  const [isVisible, setIsVisible] = useState(true)
  const [isMinimized, setIsMinimized] = useState(false)
  const [hideTimeout, setHideTimeout] = useState<number | null>(null)

  useEffect(() => {
    const detectGlobalSpeed = () => {
      let detected = false

      console.log('Running Global Speed detection...')

      // Method 1: Check for YouTube iframes and video elements
      const iframes = document.querySelectorAll('iframe[src*="youtube.com"], iframe[src*="youtu.be"]')
      const videos = document.querySelectorAll('video')
      
      console.log(`Found ${iframes.length} YouTube iframes and ${videos.length} direct video elements`)
      
      // Track if we have YouTube iframe (important for user guidance)
      setYoutubeIframeFound(iframes.length > 0)
      
      // Check direct video elements (if any)
      videos.forEach((video, index) => {
        console.log(`Video ${index}: playbackRate = ${video.playbackRate}`)
        if (video.playbackRate !== 1.0) {
          detected = true
          console.log('✓ Non-standard playback rate detected - likely Global Speed')
        }
      })

      // For YouTube iframes, we can't directly detect but can check for Global Speed indicators
      if (iframes.length > 0) {
        console.log('✓ YouTube iframe detected - checking for Global Speed indicators...')
      }

      // Method 2: Look for Global Speed context menu or UI
      const contextMenus = document.querySelectorAll('[role="menu"], .context-menu, [class*="menu"]')
      contextMenus.forEach(menu => {
        if (menu.textContent && menu.textContent.toLowerCase().includes('global speed')) {
          detected = true
          console.log('✓ Global Speed context menu detected')
        }
      })

      // Method 3: Check for Global Speed's actual DOM modifications
      const globalSpeedSelectors = [
        '[data-gs]',
        '[data-globalspeed]', 
        '[data-global-speed]',
        '.gs-controller',
        '.globalspeed-controller',
        '#globalSpeed',
        '[title*="Global Speed"]',
        '[aria-label*="Global Speed"]',
        // Global Speed often adds overlays or controllers
        '[class*="speed-overlay"]',
        '[class*="video-speed"]'
      ]
      
      globalSpeedSelectors.forEach(selector => {
        const elements = document.querySelectorAll(selector)
        if (elements.length > 0) {
          detected = true
          console.log(`✓ Global Speed element found: ${selector}`)
        }
      })

      // Since we can't reliably detect Global Speed on YouTube iframes,
      // we'll provide clear guidance instead
      if (!detected && iframes.length > 0) {
        console.log('YouTube iframe found but no Global Speed detected')
        console.log('This is normal - Global Speed works on YouTube but detection is limited')
      } else if (!detected) {
        console.log('No video elements or Global Speed indicators found')
      }

      console.log('Global Speed detection result:', detected)
      setExtensionDetected(detected)
    }

    // Initial detection
    detectGlobalSpeed()

    // Re-check periodically since extension might load after our component
    const interval = setInterval(detectGlobalSpeed, 3000)

    // Clean up
    return () => clearInterval(interval)
  }, [])

  // Consider extension "detected" if either auto-detected or manually confirmed
  const isExtensionReady = extensionDetected === true || manualOverride

  // Auto-minimize component when extension is ready
  useEffect(() => {
    if (isExtensionReady && isVisible && !isMinimized) {
      // Clear any existing timeout
      if (hideTimeout) {
        window.clearTimeout(hideTimeout)
      }
      
      // Set timeout to minimize after 3 seconds
      const timeout = window.setTimeout(() => {
        setIsMinimized(true)
      }, 3000)
      
      setHideTimeout(timeout)
    }
    
    // Cleanup on unmount
    return () => {
      if (hideTimeout) {
        window.clearTimeout(hideTimeout)
      }
    }
  }, [isExtensionReady, isVisible, isMinimized])

  // Show minimized version if hidden but extension is ready
  if (isMinimized && isExtensionReady) {
    return (
      <div className="bg-green-50 border border-green-200 rounded-lg p-2 mb-4 transition-all duration-300">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
            <span className="text-sm text-green-700 font-medium">Global Speed Ready</span>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setIsMinimized(false)}
              className="text-xs text-green-600 hover:text-green-700 underline"
            >
              Show
            </button>
            <button
              onClick={() => setIsVisible(false)}
              className="text-xs text-gray-500 hover:text-gray-700"
              title="Hide completely"
            >
              ✕
            </button>
          </div>
        </div>
      </div>
    )
  }

  // Don't render if completely hidden
  if (!isVisible) {
    return null
  }

  const extensionUrl = 'https://chromewebstore.google.com/detail/global-speed/jpbjcnkcffbooppibceonlgknpkniiff'

  return (
    <div className={`bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4 transition-all duration-500 ${
      isExtensionReady ? 'bg-green-50 border-green-200' : ''
    }`}>
      <div className="flex items-start space-x-3">
        <div className="flex-shrink-0">
          {extensionDetected === true ? (
            <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
              <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
            </div>
          ) : extensionDetected === false ? (
            <div className="w-5 h-5 bg-yellow-500 rounded-full flex items-center justify-center">
              <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
          ) : (
            <div className="w-5 h-5 bg-gray-400 rounded-full animate-pulse"></div>
          )}
        </div>
        
        <div className="flex-1">
          {isExtensionReady ? (
            <div>
              <h3 className="text-sm font-medium text-green-800">Global Speed Extension Detected!</h3>
              <p className="text-sm text-green-600 mt-1">
                Perfect! You can control playback speed and pitch using the extension's controls.
              </p>
              <button
                onClick={() => setShowInstructions(!showInstructions)}
                className="text-sm text-blue-600 hover:text-blue-700 mt-2 underline"
              >
                {showInstructions ? 'Hide' : 'Show'} how to use Global Speed
              </button>
            </div>
          ) : extensionDetected === false ? (
            <div>
              <h3 className="text-sm font-medium text-yellow-800">
                {youtubeIframeFound ? 'Global Speed Extension - Ready to Use' : 'Global Speed Extension Not Found'}
              </h3>
              <p className="text-sm text-yellow-600 mt-1">
                {youtubeIframeFound 
                  ? 'YouTube video detected! If you have Global Speed installed, you can use keyboard shortcuts to control speed.'
                  : 'Install Global Speed extension to control video speed and pitch while typing lyrics.'
                }
              </p>
              {!youtubeIframeFound && (
                <a
                  href={extensionUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center px-3 py-1 mt-2 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  Install Extension
                  <svg className="w-3 h-3 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                </a>
              )}
              <div className="mt-2">
                <button
                  onClick={() => setManualOverride(true)}
                  className="text-xs text-gray-600 hover:text-gray-700 underline"
                >
                  {youtubeIframeFound 
                    ? 'I have Global Speed installed and want to see shortcuts'
                    : 'I have Global Speed installed (manual confirm)'
                  }
                </button>
              </div>
            </div>
          ) : (
            <div>
              <h3 className="text-sm font-medium text-gray-600">Checking for Global Speed Extension...</h3>
            </div>
          )}
        </div>
      </div>

      {showInstructions && isExtensionReady && (
        <div className="mt-4 p-3 bg-white rounded border">
          <h4 className="font-medium text-gray-800 mb-2">How to Control Speed & Pitch:</h4>
          <div className="space-y-2 text-sm">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              <div><kbd className="px-1 py-0.5 bg-gray-100 rounded">S</kbd> - Decrease speed</div>
              <div><kbd className="px-1 py-0.5 bg-gray-100 rounded">D</kbd> - Increase speed</div>
              <div><kbd className="px-1 py-0.5 bg-gray-100 rounded">R</kbd> - Reset to 1x speed</div>
              <div><kbd className="px-1 py-0.5 bg-gray-100 rounded">G</kbd> - Toggle pitch preservation</div>
            </div>
            <div className="mt-2 pt-2 border-t border-gray-200">
              <p className="text-xs text-gray-600">
                💡 <strong>Recommended:</strong> Set speed to 0.8x and enable pitch preservation for easier lyric practice
              </p>
              <p className="text-xs text-gray-500 mt-1">
                Right-click on the video → Global Speed for advanced settings
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}