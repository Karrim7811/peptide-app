import { redirect } from 'next/navigation'

// SUPERSEDED BY THE MIRROR (/dashboard). This is the one place the redirect
// scheme is documented; the other eleven routes reference it.
//
// Each of these routes was checked against a working replacement before being
// redirected — an earlier attempt at this step was reverted because the Mirror
// was still read-only, and redirecting would have deleted the app's only data
// entry rather than replacing it.
//
//   ROUTE             REPLACEMENT                                  TARGET
//   /stack            StackControl on the compound view            /dashboard
//   /inventory        StackControl (vial size + remaining)         /dashboard
//   /log              LogDoseButton + the Ledger                   ?ledger=1
//   /cycle            CycleControl + the CYCLE tab                 ?tab=cycle
//   /sites            ROTATION tab + site picker when logging      ?tab=rotation
//   /reconstitution   THE MATH                                     /dashboard
//   /checker          InteractionCheck on the compound view        /dashboard
//   /bloodwork        BloodworkOverlay                             ?bloodwork=1
//   /reminders        RemindersTool                                /dashboard
//   /notes            NotesTool                                    /dashboard
//   /side-effects     SideEffectsTool                              /dashboard
//   /dosing           see the note in that file — NOT carried over /dashboard
//
// `math` and `record` are per-compound tabs with nothing to show without one,
// so routes replaced by those land on the field instead of a deep link.
export default function StackRedirect() {
  redirect('/dashboard')
}
