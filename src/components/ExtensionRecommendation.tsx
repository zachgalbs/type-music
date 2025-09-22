export default function ExtensionRecommendation() {
  const extensionUrl = 'https://chromewebstore.google.com/detail/global-speed/jpbjcnkcffbooppibceonlgknpkniiff'

  const steps = [
    {
      title: 'Install the extension',
      detail: 'Open the Chrome Web Store listing and add "Global Speed" to your browser.'
    },
    {
      title: 'Open extension settings',
      detail: 'Click the puzzle-piece icon, choose Global Speed, then select Settings (⚙️).'
    },
    {
      title: 'Enable pitch preservation',
      detail: 'In the Options panel, turn on "Speed changes pitch".'
    },
    {
      title: 'Head back here',
      detail: 'Play any track in Type Music and use the extension controls to match your preferred tempo.'
    }
  ]

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100">
      <div className="mx-auto flex min-h-screen w-full max-w-xl flex-col gap-10 px-6 py-12">
        <header className="space-y-2 text-center">
          <h1 className="text-2xl font-semibold">Quick setup for Global Speed</h1>
          <p className="text-sm text-gray-400">
            A browser extension keeps YouTube playback flexible without changing this site.
          </p>
        </header>

        <nav className="space-y-4">
          {steps.map((step, index) => (
            <div
              key={step.title}
              className="rounded-lg border border-gray-800 bg-gray-900/60 px-5 py-4 shadow-sm"
            >
              <div className="flex items-start gap-4">
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-500/10 text-sm font-semibold text-blue-300">
                  {index + 1}
                </span>
                <div className="space-y-1">
                  <h2 className="text-base font-medium text-gray-100">{step.title}</h2>
                  <p className="text-sm text-gray-400">{step.detail}</p>
                </div>
              </div>
            </div>
          ))}
        </nav>

        <div className="rounded-lg border border-gray-800 bg-gray-900/60 px-5 py-4 text-center text-sm text-gray-300">
          <p className="mb-3">Need the extension?</p>
          <a
            href={extensionUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-md bg-blue-600 px-4 py-2 font-medium text-white transition-colors hover:bg-blue-500"
          >
            Open Global Speed in Chrome Web Store
          </a>
        </div>
      </div>
    </div>
  )
}
