import { redirect } from 'next/navigation'

// SUPERSEDED — and deliberately NOT carried over in kind.
//
// This route was a weight-based dosing calculator: enter a body weight, get a
// suggested dose. That is precisely the feature Apple rejected the iOS app for
// under Guideline 1.4.2, and the same exposure applies on the web under US law
// — a dose calculation directed at an individual is materially different from
// describing the chemistry of a solution.
//
// Per the resolved product decision (CLAUDE.md §16.9) the reconstitution maths
// survives in THE MATH, reframed: it asks what volume you are preparing and
// describes what the resulting solution contains per unit on a U-100 syringe.
// It does not compute a dose for a person, and it should not be extended to.
//
// The library's own `dosage` field is still shown verbatim on every compound,
// labelled as a library reference rather than a recommendation.
//
// Redirect scheme is documented in src/app/stack/page.tsx.
export default function DosingRedirect() {
  redirect('/dashboard')
}
