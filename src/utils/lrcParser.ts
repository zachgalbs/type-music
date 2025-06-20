export interface LyricLine {
  time: number; // seconds
  text: string;
}

export function parseLRC(lrcText: string): LyricLine[] {
  const lines = lrcText.split('\n')
  const lyricLines: LyricLine[] = []

  for (const line of lines) {
    const match = line.match(/\[(\d{2}):(\d{2})\.(\d{2})\](.*)/)
    if (match) {
      const minutes = parseInt(match[1], 10)
      const seconds = parseInt(match[2], 10)
      const hundredths = parseInt(match[3], 10)
      const text = match[4].trim()
      
      const totalSeconds = minutes * 60 + seconds + hundredths / 100
      lyricLines.push({ time: totalSeconds, text })
    }
  }

  return lyricLines.sort((a, b) => a.time - b.time)
}

export function getCurrentLyricIndex(lyrics: LyricLine[], currentTime: number): number {
  let currentIndex = -1
  
  for (let i = 0; i < lyrics.length; i++) {
    if (currentTime >= lyrics[i].time) {
      currentIndex = i
    } else {
      break
    }
  }
  
  return currentIndex
}

export function getNextLyricTime(lyrics: LyricLine[], currentIndex: number): number | null {
  if (currentIndex + 1 < lyrics.length) {
    return lyrics[currentIndex + 1].time
  }
  return null
}