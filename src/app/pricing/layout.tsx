// The Mirror-redesign Pricing screen (`src/app/pricing/page.tsx`) is a
// full-bleed dark surface with its own nav bar and legal footer — it does not
// sit inside the old light-theme dashboard chrome (Sidebar/TopBar/
// CortexStrip) that this layout used to impose. Pass through unchanged.
export default function PricingLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
