// Grounds for the token-driven surfaces.
//
// Midnight, dusk and daylight are lifted verbatim from
// design_handoff_peptide_cortex/Peptide Cortex Mirror.dc.html (THEMES). Every
// text tier clears 4.5:1 against its ground — the values were tuned
// specifically to get there. Do not nudge them.
//
// Paper is the V3 site palette (design_handoff_peptide_cortex_site/README.md,
// "Design tokens") expressed as a ground, so the Mirror can speak V3 without a
// rewrite: every one of its components reads var(--ink) and friends, and the
// ground is the one place those resolve. Two of V3's inks would not pass as
// Mirror text — Ink-3 #7E878E sits at 3.0:1 on paper and Ink-4 #9AA3A9 at 2.1 —
// and the Mirror sets 9–10px mono in those tiers, so `faint` and `faintest`
// are darkened until they clear 4.5:1, and the accent teal steps from #1A8A9E
// (3.3:1) to #156F80 (4.8:1) for the same reason. src/lib/design/grounds.test.ts
// asserts the ratios for every ground.
//
// Midnight is the GLOBAL default and is what the server renders on <html>, so
// there is no flash on first paint. The Mirror scopes its own ground onto its
// root element instead (MirrorShell), with paper as ITS default: the dark
// surfaces that still read the global variables — the AI consent screen, the
// pricing page, the guides — keep midnight, and only the Mirror changes.

export const GROUNDS = ['midnight', 'dusk', 'daylight', 'paper'] as const
export type Ground = (typeof GROUNDS)[number]

/** What <html> carries, and what the surfaces outside the Mirror render on. */
export const DEFAULT_GROUND: Ground = 'midnight'

/** The Mirror's own default, and the order its switcher offers. */
export const MIRROR_GROUNDS: readonly Ground[] = ['paper', 'midnight', 'dusk', 'daylight']
export const MIRROR_DEFAULT_GROUND: Ground = 'paper'

/** The four category hue families. `go` doubles as the tension colour. */
export const HUE_FAMILIES = ['cy', 'pu', 'gr', 'go'] as const
export type HueFamily = (typeof HUE_FAMILIES)[number]

type GroundVars = Record<string, string>

interface GroundDefinition {
  hues: Record<HueFamily, string>
  vars: GroundVars
}

export const GROUND_DEFINITIONS: Record<Ground, GroundDefinition> = {
  midnight: {
    hues: { cy: '#00E5FF', pu: '#B06BE0', gr: '#22A06B', go: '#F7B731' },
    vars: {
      '--bg': '#030308',
      '--panel': '#0C0C14',
      '--panelHi': '#14141E',
      '--panelHot': '#12120A',
      '--hair': 'rgba(255,255,255,0.1)',
      '--ink': '#FFFFFF',
      '--dim': '#B8C5D6',
      '--faint': '#8A97AC',
      '--faintest': '#7A879A',
      '--accent': '#B06BE0',
      '--accentDim': 'rgba(176,107,224,0.35)',
      '--accentWash': 'rgba(124,58,237,0.06)',
      '--gold': '#F7B731',
      '--glowA': 'rgba(124,58,237,0.18)',
      '--glowB': 'rgba(0,229,255,0.16)',
      '--glowC': 'rgba(247,183,49,0.14)',
      '--dotA': 'rgba(176,107,224,0.9)',
      '--dotB': 'rgba(0,229,255,0.85)',
      '--dotC': 'rgba(247,183,49,1)',
    },
  },
  dusk: {
    hues: { cy: '#78E6F5', pu: '#AF91EB', gr: '#5FCF9B', go: '#F0BE5A' },
    vars: {
      '--bg': '#1C2430',
      '--panel': '#243040',
      '--panelHi': '#2B3848',
      '--panelHot': '#2E2E20',
      '--hair': 'rgba(255,255,255,0.12)',
      '--ink': '#F4F8FC',
      '--dim': '#B4C0CE',
      '--faint': '#A4B0BE',
      '--faintest': '#94A2B2',
      '--accent': '#AF91EB',
      '--accentDim': 'rgba(175,145,235,0.4)',
      '--accentWash': 'rgba(175,145,235,0.08)',
      '--gold': '#F0BE5A',
      '--glowA': 'rgba(150,120,215,0.2)',
      '--glowB': 'rgba(70,200,220,0.2)',
      '--glowC': 'rgba(230,175,70,0.18)',
      '--dotA': 'rgba(175,145,235,0.9)',
      '--dotB': 'rgba(120,230,245,0.9)',
      '--dotC': 'rgba(240,190,90,1)',
    },
  },
  daylight: {
    hues: { cy: '#127080', pu: '#5B3F97', gr: '#1B8055', go: '#B8860B' },
    vars: {
      '--bg': '#F7F4EE',
      '--panel': '#FFFFFF',
      '--panelHi': '#F1EDE4',
      '--panelHot': '#FBF3DF',
      '--hair': 'rgba(26,25,21,0.14)',
      '--ink': '#1A1915',
      '--dim': '#4A473F',
      '--faint': '#615C54',
      '--faintest': '#6E6960',
      '--accent': '#6B4FA8',
      '--accentDim': 'rgba(107,79,168,0.4)',
      '--accentWash': 'rgba(107,79,168,0.06)',
      '--gold': '#B8860B',
      '--glowA': 'rgba(107,79,168,0.14)',
      '--glowB': 'rgba(26,138,158,0.16)',
      '--glowC': 'rgba(184,134,11,0.14)',
      '--dotA': 'rgba(107,79,168,0.8)',
      '--dotB': 'rgba(26,138,158,0.85)',
      '--dotC': 'rgba(184,134,11,0.95)',
    },
  },
  paper: {
    hues: { cy: '#156F80', pu: '#5B3F97', gr: '#176D48', go: '#7F5C00' },
    vars: {
      '--bg': '#E6E9EB',
      '--panel': '#F4F5F6',
      '--panelHi': '#EDF0F1',
      '--panelHot': '#EDF0F1',
      '--hair': 'rgba(26,29,31,0.18)',
      '--ink': '#1A1D1F',
      '--dim': '#3B4045',
      '--faint': '#5B636A',
      '--faintest': '#5F676D',
      '--accent': '#156F80',
      '--accentDim': 'rgba(21,111,128,0.4)',
      '--accentWash': 'rgba(26,138,158,0.06)',
      '--gold': '#7F5C00',
      '--glowA': 'rgba(26,138,158,0.08)',
      '--glowB': 'rgba(91,63,151,0.06)',
      '--glowC': 'rgba(127,92,0,0.06)',
      '--dotA': 'rgba(26,29,31,0.35)',
      '--dotB': 'rgba(21,111,128,0.45)',
      '--dotC': 'rgba(127,92,0,0.6)',
    },
  },
}

export function isGround(value: unknown): value is Ground {
  return typeof value === 'string' && (GROUNDS as readonly string[]).includes(value)
}

/**
 * The hue variables for a ground, exposed as custom properties so components
 * can read `var(--hue-cy)` instead of importing the lookup and branching.
 */
function hueVars(ground: Ground): GroundVars {
  const { hues } = GROUND_DEFINITIONS[ground]
  return Object.fromEntries(
    HUE_FAMILIES.map((family) => [`--hue-${family}`, hues[family]]),
  )
}

/** Every custom property for a ground, hues included. */
export function groundVars(ground: Ground): GroundVars {
  return { ...GROUND_DEFINITIONS[ground].vars, ...hueVars(ground) }
}

/** A `style` attribute string, for server-rendering the default ground. */
export function groundStyleString(ground: Ground): string {
  return Object.entries(groundVars(ground))
    .map(([key, value]) => `${key}:${value}`)
    .join(';')
}

/**
 * Resolve a category's hue for the current ground.
 *
 * `go` is also the tension colour. Call `tensionHue` for that meaning so
 * tension styling does not silently track the Cardio/Sexual Health categories
 * if their family ever changes.
 */
export function hueFor(family: HueFamily, ground: Ground): string {
  return GROUND_DEFINITIONS[ground].hues[family]
}

export function tensionHue(ground: Ground): string {
  return GROUND_DEFINITIONS[ground].hues.go
}

/** CSS custom-property reference for a hue family. Ground-agnostic. */
export function hueVar(family: HueFamily): string {
  return `var(--hue-${family})`
}
