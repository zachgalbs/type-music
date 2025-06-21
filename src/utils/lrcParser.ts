export interface LyricLine {
  time: number; // seconds
  text: string;
}

export interface LrcParserOptions {
  removeAdLibs?: boolean;
}

/**
 * Removes ad-libs (content within parentheses) from lyric text
 */
export function cleanAdLibs(text: string): string {
  // Remove content within parentheses, including nested parentheses
  let cleaned = text
  let hasParentheses = true
  
  // Keep removing parentheses until none are left (handles nested cases)
  while (hasParentheses) {
    const before = cleaned
    // Remove innermost parentheses first
    cleaned = cleaned.replace(/\([^()]*\)/g, '')
    hasParentheses = cleaned !== before
  }
  
  // Clean up extra whitespace
  cleaned = cleaned
    .replace(/\s+/g, ' ') // Multiple spaces -> single space
    .replace(/\s+([,.!?;:])/g, '$1') // Remove space before punctuation
    .replace(/([,.!?;:])\s*([,.!?;:])/g, '$1$2') // Remove space between punctuation
    .trim()
  
  return cleaned
}

export function parseLRC(lrcText: string, options: LrcParserOptions = {}): LyricLine[] {
  const lines = lrcText.split('\n')
  const lyricLines: LyricLine[] = []

  for (const line of lines) {
    const match = line.match(/\[(\d{2}):(\d{2})\.(\d{2})\](.*)/)
    if (match) {
      const minutes = parseInt(match[1], 10)
      const seconds = parseInt(match[2], 10)
      const hundredths = parseInt(match[3], 10)
      let text = match[4].trim()
      
      // Apply ad-lib removal if requested
      if (options.removeAdLibs) {
        text = cleanAdLibs(text)
      }
      
      // Only add non-empty lines after cleaning
      if (text.length > 0) {
        const totalSeconds = minutes * 60 + seconds + hundredths / 100
        lyricLines.push({ time: totalSeconds, text })
      }
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