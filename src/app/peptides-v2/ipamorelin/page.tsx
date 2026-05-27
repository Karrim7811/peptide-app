import CrystalField from '@/components/peptides-v2/CrystalField'

export default function IpamorelinV2Page() {
  return (
    <main
      style={{
        position: 'relative',
        minHeight: '100vh',
        width: '100%',
        overflow: 'hidden',
        background: '#EDE3D0',
      }}
    >
      <CrystalField layer="back" />

      <h1
        style={{
          position: 'fixed',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          margin: 0,
          padding: 0,
          fontFamily: '"Cormorant Garamond", Georgia, serif',
          fontWeight: 300,
          fontStyle: 'normal',
          fontSize: 'clamp(4rem, 12vw, 16rem)',
          letterSpacing: '-0.02em',
          lineHeight: 1,
          color: '#1A1915',
          whiteSpace: 'nowrap',
          zIndex: 1,
          pointerEvents: 'none',
          userSelect: 'none',
        }}
      >
        IPAMORELIN
      </h1>

      <CrystalField layer="front" />
    </main>
  )
}
