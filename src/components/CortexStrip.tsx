export default function CortexStrip() {
  const letters = [
    { letter: 'C', label: 'Cognitive\nCore' },
    { letter: 'O', label: 'Optimization\nEngine' },
    { letter: 'R', label: 'Reasoning\nLayer' },
    { letter: 'T', label: 'Tracking\nIntelligence' },
    { letter: 'E', label: 'Evidence\nBased' },
    { letter: 'X', label: 'Execution\nEngine', teal: true },
  ] as { letter: string; label: string; teal?: boolean }[]

  return (
    <div style={{ background: '#1A1915', display: 'flex' }}>
      {letters.map(({ letter, label, teal }, i) => (
        <div
          key={letter}
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            padding: '16px 8px',
            borderRight: i < 5 ? '0.5px solid rgba(176,170,160,0.12)' : 'none',
          }}
        >
          <span style={{
            fontSize: 72,
            fontWeight: 300,
            fontFamily: "'Cormorant Garamond', Georgia, serif",
            color: teal ? '#1A8A9E' : 'rgba(250,250,248,0.55)',
            lineHeight: 1,
            letterSpacing: '-0.01em',
          }}>{letter}</span>
          <span style={{
            fontSize: 7,
            fontWeight: 400,
            fontFamily: "'Gill Sans', 'Gill Sans MT', Calibri, sans-serif",
            letterSpacing: '0.18em',
            textTransform: 'uppercase' as const,
            color: teal ? '#1A8A9E' : 'rgba(26,138,158,0.7)',
            marginTop: 6,
            textAlign: 'center' as const,
            lineHeight: 1.4,
            whiteSpace: 'pre-line' as const,
          }}>{label}</span>
        </div>
      ))}
    </div>
  )
}
