interface StatsBarProps {
  wpm: number
  accuracy: number
  time: number
}

export default function StatsBar({ wpm }: StatsBarProps) {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
      <div className="text-center">
        <p className="text-sm text-gray-600 mb-1">Words Per Minute</p>
        <p className="text-3xl font-semibold text-blue-600">{wpm}</p>
      </div>
    </div>
  )
}