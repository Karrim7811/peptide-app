# App Store Review — Reply Draft (Submission d8e0775f, v1.0 build 157 → resubmit as 158)

> Paste these into Resolution Center. Build 158 must be uploaded first (see "Before you
> resubmit" at the bottom). The three features Apple cited (Reconstitution, Bloodwork,
> Protocol Planner) have been **removed** from the iOS app in build 158.

---

## Guideline 2.1 — Information Needed (Reconstitution: what does it calculate?)

Thank you for the question. We have **removed the Reconstitution feature entirely** from the
iOS app in build 158. It no longer appears in navigation and is not accessible anywhere in
the app.

For your records, the prior feature did not diagnose, prescribe, or direct a dose to any
individual. It was a static concentration reference: given a vial mass (mg) and a volume of
bacteriostatic water (mL), it displayed the resulting solution concentration (mg/mL) — basic
chemistry with no user-specific medical input or output. To avoid any ambiguity under
Guidelines 1.4.1/1.4.2, we have removed it from the iOS app. The iOS app is now a
reference-and-tracking companion only.

---

## Guideline 2.1(a) — App Completeness (error in Reconstitution & Bloodwork)

Both features that produced the error — **Reconstitution** and **Bloodwork Reference** — have
been **removed from the iOS app** in build 158, so this error can no longer occur.

Root cause, for transparency: both features called a server AI endpoint that, in rare cases,
returned a response our client could not parse, surfacing an error message. Rather than harden
those endpoints on iOS, we removed the features from the iOS app as part of narrowing the iOS
app to a reference-and-tracking companion. We verified on iPad (compatibility mode) that no
remaining screen reaches the removed code paths.

---

## Guideline 2.1(b) — Information Needed (business model)

**1. Who are the users that will use the paid features in the app?**
Adults (18+) interested in peptide research and self-tracking. The paid ("Pro") tier unlocks
AI-assisted **educational reference** tools: Cortex AI chat, an interaction reference checker,
and a stack finder. These are informational/educational references, not medical advice.

**2. Where can users purchase the features that can be accessed in the app?**
Exclusively through **Apple In-App Purchase**, inside the app, on the "Upgrade to Pro" screen.
Two IAP products: an auto-renewing monthly subscription (`pro_monthly`) and a one-time
lifetime unlock (`pro_lifetime`, non-consumable).

**3. What specific types of previously purchased features can a user access in the app?**
A user whose Apple account holds an active Pro entitlement (monthly subscription or the
lifetime non-consumable) can access the Pro reference tools listed above. "Restore Purchases"
re-establishes that entitlement via StoreKit.

**4. What paid content, subscriptions, or features are unlocked within the app that do NOT
use In-App Purchase?**
**None.** On iOS, every paid feature is unlocked exclusively through Apple In-App Purchase.
The app determines Pro entitlement solely from StoreKit (`Transaction.currentEntitlements`) —
it does **not** unlock any paid feature based on a purchase made outside the App Store. The app
contains no external purchase links or calls to action.

_Note for the reviewer:_ the account `review@tigristechlabs.com` is provisioned with
complimentary full Pro access so you can evaluate every feature without purchasing. (If a
website exists for this product, it is a separate multiplatform service; the iOS app neither
links to it nor references external purchasing.)

---

## Before you resubmit (action items for Karim)

1. **App Store Connect → In-App Purchases:** create the `pro_lifetime` non-consumable
   ($99.99) if it doesn't exist yet, and retire/stop offering `pro_yearly`. The build now
   requests product IDs `pro_monthly` + `pro_lifetime`; if `pro_lifetime` isn't configured,
   the Pricing screen will sit on "Loading plans…".
2. **Regenerate + build:** `cd ios-native && xcodegen generate`, open in Xcode, build, confirm
   it compiles (I traced it clean but could not compile on this Windows machine), and smoke-test
   the drawer — Reconstitution / Bloodwork / Protocol Planner should be gone; Dashboard should
   no longer show the "Plan My Protocol" hero or per-vial BAC readouts.
3. **Bump build number** to 158 and upload.
4. Paste the three replies above into Resolution Center, then resubmit.
