// The one guardrail the data cannot enforce for itself.
//
// CLAUDE.md §16.9a ends by naming this as the remaining exposure, and it is not
// a lesser one now that the weight-based calculator is gone:
//
//   "The library's N/A is enforced on the data by a test; it is NOT enforced on
//    model output. With the calculator gone this is the remaining exposure."
//
// Every static surface — the library, the compound page, the dosing reference —
// renders "No human dose established." for the 98 entries that have no
// published figure, and src/lib/library.test.ts walks the whole catalogue to
// prove it. The AI routes were the hole: /api/protocol-plan asked the model for
// "research-reported amounts" with no exclusion, and /api/chat had no
// equivalent rule at all. A model asked for an amount will produce one, and for
// a research-tier peptide the only place it can come from is a rodent study or
// a forum.
//
// This module names the peptides that must never carry a number and states the
// rule in the imperative, so both prompts carry the same wording. It cannot
// make a model obey — nothing can — but an explicit prohibition with the list
// attached is the difference between a guardrail and a hope.
//
// Peptide Cortex is a seller. Publishing an invented dose for something you
// also sell is the fact pattern §16.9a says is closest to the FDA's test for
// intended use.

import { COMPOUND_LIST } from '@/lib/catalog'
import { NO_DOSE_LINE, doseState } from '@/lib/dosing'

/** The names, as the model will see them, that carry no published human dose. */
export function noDoseNames(): string[] {
  return COMPOUND_LIST.filter((entry) => doseState(entry) !== 'published')
    .map((entry) => entry.name)
    .sort((a, b) => a.localeCompare(b))
}

/**
 * The block appended to every AI system prompt that could emit an amount.
 *
 * The list is included in full rather than summarised. "Peptides without an
 * established dose" is a category a model will happily reason its way out of;
 * a name on a list is harder to argue with.
 */
export function doseGuardrail(): string {
  const names = noDoseNames()

  return `
ABSOLUTE RULE — AMOUNTS AND DOSES

There are ${COMPOUND_LIST.length} entries in this library. ${names.length} of them have NO
published human dose. For those, the only permitted output in any amount,
dose, quantity or volume field is exactly:

  ${NO_DOSE_LINE}

For these peptides you MUST NOT output a number in any amount field, and MUST
NOT derive one from animal studies, body weight, allometric scaling, community
or forum protocols, a similar peptide, or your own general knowledge. If asked
directly for a dose for one of them, say that no human dose is established and
say why: it has no approval and no published human dose-finding study.

You MAY describe what the literature contains instead — that a rodent study
used a given mg/kg, or that a discontinued trial ran a given range — but it
must be labelled as not a dose, and it must never appear in an amount field.

Peptides with NO published human dose:
${names.join(', ')}

For every other entry, give the published figure as the library states it and
name its source (an FDA label, a regional label, product prescribing
information, or a named human trial). Never present a figure without its
source. A figure without a source is indistinguishable from a recommendation.
`.trim()
}
