interface StatsBarProps {
  wpm: number
  accuracy: number
  time: number
}

export default function StatsBar({ wpm, accuracy, time }: StatsBarProps) {
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
      <div className="grid grid-cols-3 gap-4 text-center">
        <div>
          <p className="text-sm text-gray-600 mb-1">WPM</p>
          <p className="text-2xl font-semibold text-blue-600">{wpm}</p>
        </div>
        <div>
          <p className="text-sm text-gray-600 mb-1">Accuracy</p>
          <p className="text-2xl font-semibold text-green-600">{accuracy}%</p>
        </div>
        <div>
          <p className="text-sm text-gray-600 mb-1">Time</p>
          <p className="text-2xl font-semibold text-gray-700">{formatTime(time)}</p>
        </div>
      </div>
    </div>
  )
}