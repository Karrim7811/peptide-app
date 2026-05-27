// Five-pointed star rating rendered in brass with hollow placeholders.
// JetBrains Mono caption to the right gives the literal "n / 5" reading.

type Props = {
  rating: number
  outOf?: number
}

function Star({ filled }: { filled: boolean }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={20}
      height={20}
      aria-hidden
      className="inline-block"
    >
      <path
        d="M12 2.5l2.95 6.16 6.8.94-4.92 4.65 1.18 6.7L12 17.8l-6.01 3.15 1.18-6.7L2.25 9.6l6.8-.94L12 2.5z"
        fill={filled ? '#A88B5E' : 'none'}
        stroke="#A88B5E"
        strokeWidth={1}
        strokeLinejoin="round"
      />
    </svg>
  )
}

export default function EvidenceRating({ rating, outOf = 5 }: Props) {
  return (
    <span className="inline-flex items-center gap-2 align-middle">
      <span className="inline-flex gap-0.5">
        {Array.from({ length: outOf }, (_, i) => (
          <Star key={i} filled={i < rating} />
        ))}
      </span>
      <span className="font-mono text-xs text-apo-mute">
        {rating} / {outOf}
      </span>
    </span>
  )
}
