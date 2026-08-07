import type { PricingFeature } from './content'

// Ports the `feature()` mark/text style factory from `renderVals()` (prototype
// lines 245-253). Included marks are filled/ringed in the cy hue family
// (matches the prototype's hardcoded #00E5FF) regardless of which card they
// sit in — it is a generic "included" signal, not a category hue.

export default function FeatureList({ features }: { features: PricingFeature[] }) {
  return (
    <div className="flex flex-col gap-3.5">
      {features.map((f) => (
        <div key={f.label} className="flex items-start gap-2.5">
          <span
            aria-hidden
            className="mt-1 h-3.5 w-3.5 shrink-0 rounded-full"
            style={{
              border: `1px solid ${f.on ? 'var(--hue-cy)' : 'var(--hair)'}`,
              background: f.on ? 'color-mix(in srgb, var(--hue-cy) 18%, transparent)' : 'transparent',
            }}
          />
          <span className={`text-[14.5px] leading-[1.7] ${f.on ? 'text-ink' : 'text-faintest'}`}>
            {f.label}
          </span>
        </div>
      ))}
    </div>
  )
}
