import { useMemo, useState } from 'react'

export function TextPressureWord({ text }: { text: string }) {
  const [active, setActive] = useState<number | null>(null)
  const chars = useMemo(() => text.split(''), [text])

  return (
    <span className="text-pressure-word" onMouseLeave={() => setActive(null)}>
      {chars.map((char, index) => {
        const distance = active === null ? 99 : Math.abs(active - index)
        const level = Math.max(0, 1 - distance / 5)
        const style = {
          fontVariationSettings: `"wght" ${500 + level * 320}`,
          transform: `translateY(${-(level * 7)}px) scale(${1 + level * 0.08})`,
          opacity: 0.5 + level * 0.5,
        }
        return (
          <span
            key={`${char}-${index}`}
            className="text-pressure-char"
            style={style}
            onMouseEnter={() => setActive(index)}
          >
            {char === ' ' ? '\u00A0' : char}
          </span>
        )
      })}
    </span>
  )
}
