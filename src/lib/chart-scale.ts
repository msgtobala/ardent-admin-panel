export function getNiceChartMaxValue(maxValue: number): number {
  if (maxValue <= 0) return 10

  const magnitude = 10 ** Math.floor(Math.log10(maxValue))
  const normalized = maxValue / magnitude

  let niceNormalized = 10
  if (normalized <= 1) niceNormalized = 1
  else if (normalized <= 2) niceNormalized = 2
  else if (normalized <= 5) niceNormalized = 5

  return niceNormalized * magnitude
}

export function buildChartTicks(maxValue: number, tickCount = 5): number[] {
  const niceMax = getNiceChartMaxValue(maxValue)
  const step = niceMax / (tickCount - 1)

  return Array.from({ length: tickCount }, (_, index) =>
    Math.round(niceMax - step * index),
  )
}
