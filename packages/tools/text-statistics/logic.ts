export interface TextStatistics {
  characters: number
  words: number
  lines: number
}

export function countTextStatistics(input: string): TextStatistics {
  if (input === '') {
    return { characters: 0, words: 0, lines: 0 }
  }
  return {
    characters: Array.from(input).length,
    words: input.match(/\S+/g)?.length ?? 0,
    lines: input.split('\n').length,
  }
}
