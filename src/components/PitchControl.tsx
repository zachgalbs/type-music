import { useState, useEffect } from 'react'

interface PitchControlProps {
  onPitchChange: (factor: number) => void
  onVolumeChange: (volume: number) => void
  disabled?: boolean
}

export default function PitchControl({ onPitchChange, onVolumeChange, disabled = false }: PitchControlProps) {
  const [pitchFactor, setPitchFactor] = useState(0.8)
  const [volume, setVolume] = useState(1.0)

  useEffect(() => {
    onPitchChange(pitchFactor)
  }, [pitchFactor, onPitchChange])

  useEffect(() => {
    onVolumeChange(volume)
  }, [volume, onVolumeChange])

  const handlePitchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(e.target.value)
    setPitchFactor(value)
  }

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(e.target.value)
    setVolume(value)
  }

  const resetPitch = () => {
    setPitchFactor(1.0)
  }

  const presetLower = () => {
    setPitchFactor(0.8)
  }

  return (
    <div className="bg-gray-800 rounded-lg p-4 space-y-4">
      <h3 className="text-lg font-semibold text-white mb-3">Audio Controls</h3>
      
      <div className="space-y-3">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Pitch Factor: {pitchFactor.toFixed(2)}x
          </label>
          <input
            type="range"
            min="0.5"
            max="2.0"
            step="0.1"
            value={pitchFactor}
            onChange={handlePitchChange}
            disabled={disabled}
            className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer slider-thumb"
          />
          <div className="flex justify-between text-xs text-gray-400 mt-1">
            <span>0.5x (Lower)</span>
            <span>1.0x (Normal)</span>
            <span>2.0x (Higher)</span>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Volume: {Math.round(volume * 100)}%
          </label>
          <input
            type="range"
            min="0"
            max="1"
            step="0.1"
            value={volume}
            onChange={handleVolumeChange}
            disabled={disabled}
            className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer slider-thumb"
          />
        </div>
      </div>

      <div className="flex gap-2">
        <button
          onClick={presetLower}
          disabled={disabled}
          className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
        >
          Lower Pitch
        </button>
        <button
          onClick={resetPitch}
          disabled={disabled}
          className="px-3 py-1 bg-gray-600 text-white rounded hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
        >
          Reset
        </button>
      </div>
    </div>
  )
}