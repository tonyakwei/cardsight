export type FinaleHouseId = "jones" | "croft" | "drake";
export type FinaleDimension = "knowledge" | "safety" | "finality" | "access" | "governance";
export type FinaleBand = "vindicated" | "compromised" | "horrified";

export type FinaleOutcomeId =
  | "destroy_source"
  | "recontain_source"
  | "open_for_research";

export type FinaleClauseId =
  | "copy_inscriptions"
  | "publish_discovery"
  | "preserve_some_artifacts"
  | "three_witness_rule"
  | "no_private_keeping"
  | "withhold_mechanism"
  | "suppress_location"
  | "three_house_custody"
  | "no_house_takes_credit"
  | "no_judgment_without_record"
  | "leave_unmistakable_warning"
  | "no_ready_passage";

type DimensionVector = Record<FinaleDimension, number>;

export interface FinaleOutcomeDefinition {
  id: FinaleOutcomeId;
  label: string;
  description: string;
  vector: DimensionVector;
  epilogue: {
    title: string;
    decision: string;
    closing: string;
  };
}

export interface FinaleClauseDefinition {
  id: FinaleClauseId;
  label: string;
  description: string;
  vector: DimensionVector;
}

export interface FinaleHouseDefinition {
  id: FinaleHouseId;
  label: string;
  weights: DimensionVector;
  thresholds: {
    vindicatedMin: number;
    compromisedMin: number;
  };
  consequences: Record<FinaleBand, string>;
  epilogueFocus: string;
  epilogue: Record<FinaleBand, string>;
}

export interface FinaleSelection {
  outcomeId: FinaleOutcomeId | null;
  clauseIds: FinaleClauseId[];
}

export interface FinaleHouseResult {
  houseId: FinaleHouseId;
  label: string;
  score: number;
  band: FinaleBand;
  consequence: string;
}

export interface FinaleEpilogueSection {
  houseId: FinaleHouseId;
  label: string;
  heading: string;
  band: FinaleBand;
  text: string;
}

export interface FinaleEpilogue {
  title: string;
  decision: string;
  sections: FinaleEpilogueSection[];
  closing: string;
  paragraphs: string[];
}

export interface FinaleEvaluation {
  valid: boolean;
  errors: string[];
  selection: FinaleSelection;
  houseResults: FinaleHouseResult[];
  epilogue: FinaleEpilogue | null;
}

function vec(
  knowledge: number,
  safety: number,
  finality: number,
  access: number,
  governance: number,
): DimensionVector {
  return { knowledge, safety, finality, access, governance };
}

export const FINALE_MAX_CLAUSES = 5;

export const FINALE_OUTCOMES: FinaleOutcomeDefinition[] = [
  {
    id: "destroy_source",
    label: "Destroy the Source",
    description: "End the danger now by destroying the Source, even at the cost of future knowledge and access.",
    vector: vec(-2, 2, 2, -2, 0),
    epilogue: {
      title: "The Source Was Broken",
      decision: "The room chose to destroy the Source, but only under the settlement you all agreed upon.",
      closing: "In the end, the chamber did not survive. Its light was extinguished, its workings broken, and whatever hold it had once kept on the living was answered in stone and ruin.",
    },
  },
  {
    id: "recontain_source",
    label: "Recontain the Source",
    description: "Restore containment and leave the Source closed off rather than opened or annihilated.",
    vector: vec(-1, 2, 2, -2, 0),
    epilogue: {
      title: "The Chamber Was Sealed Again",
      decision: "The room chose to seal the chamber again, but only under the settlement you all agreed upon.",
      closing: "In the end, the chamber was sealed again. The Source remained beneath stone, not destroyed and not freed, but returned to locks, witness, and warning.",
    },
  },
  {
    id: "open_for_research",
    label: "Open It for Research",
    description: "Permit controlled access to the Source for study and preservation in the present generation.",
    vector: vec(2, -2, -1, 2, 0),
    epilogue: {
      title: "The Chamber Was Opened",
      decision: "The room chose to open the chamber for study, but only under the settlement you all agreed upon.",
      closing: "In the end, the chamber was opened to the living. Its danger was not ended, only inherited, and the future took it into its keeping with open eyes.",
    },
  },
];

export const FINALE_CLAUSES: FinaleClauseDefinition[] = [
  {
    id: "copy_inscriptions",
    label: "Copy the Inscriptions",
    description: "Preserve written knowledge even if the site itself is lost or closed.",
    vector: vec(2, 0, 0, 0, 0),
  },
  {
    id: "publish_discovery",
    label: "Publish the Discovery",
    description: "Reveal what happened here to the wider world.",
    vector: vec(1, -1, 0, 2, 0),
  },
  {
    id: "preserve_some_artifacts",
    label: "Preserve Some Artifacts",
    description: "Allow selected physical artifacts to be retained as part of the outcome.",
    vector: vec(1, -1, 0, 1, 0),
  },
  {
    id: "three_witness_rule",
    label: "Three-Witness Rule",
    description: "Any future contact with the chamber — return expedition, breach response, sanctioned visit — requires representatives from all three houses present.",
    vector: vec(1, 1, 0, 1, 1),
  },
  {
    id: "no_private_keeping",
    label: "No Private Keeping",
    description: "No house may carry relics away into its own vaults, estates, or shrines.",
    vector: vec(0, 2, 1, -1, 0),
  },
  {
    id: "withhold_mechanism",
    label: "Withhold the Mechanism",
    description: "Publish the cultural and historical findings, but redact the dangerous technical details of how the Source works.",
    vector: vec(-2, 1, 0, -2, 0),
  },
  {
    id: "suppress_location",
    label: "Suppress the Location",
    description: "Do not disclose the temple’s precise location in any academic, journalistic, or public document. The houses already know where it is; the world does not have to.",
    vector: vec(-1, 2, 0, -2, 0),
  },
  {
    id: "three_house_custody",
    label: "Three-House Custody",
    description: "No single house controls what survives; custody is shared.",
    vector: vec(0, 0, 0, 0, 2),
  },
  {
    id: "no_house_takes_credit",
    label: "No House Takes Credit",
    description: "No house may claim singular glory or ownership over the outcome.",
    vector: vec(0, 0, 0, -1, 2),
  },
  {
    id: "no_judgment_without_record",
    label: "No Judgment Without Record",
    description: "Before any irreversible decision is enacted, the chamber in its entirety must be fully documented — every artifact, residue, instrument, layout, and structural detail.",
    vector: vec(2, 0, 0, 0, 1),
  },
  {
    id: "leave_unmistakable_warning",
    label: "Leave an Unmistakable Warning",
    description: "Mark the danger in plain terms that future generations will understand.",
    vector: vec(1, 1, 0, 0, 0),
  },
  {
    id: "no_ready_passage",
    label: "No Ready Passage",
    description: "The settlement must leave no convenient way back into the chamber. Return is not forbidden, but it must become difficult, costly, and deliberate.",
    vector: vec(-1, 1, 1, -2, 0),
  },
];

export const FINALE_HOUSES: FinaleHouseDefinition[] = [
  {
    id: "jones",
    label: "Jones Junket",
    weights: vec(3, 0, 0, 2, 1),
    thresholds: {
      vindicatedMin: 2,
      compromisedMin: -8,
    },
    consequences: {
      vindicated: "Jones leaves believing the truth survived in meaningful form, and that history was not buried for the sake of fear.",
      compromised: "Jones accepts the settlement, but with the lasting sense that too much of the Source may have been lost or hidden.",
      horrified: "Jones leaves convinced that panic and force have erased a discovery that should have been understood.",
    },
    epilogueFocus: "What was remembered",
    epilogue: {
      vindicated: "Enough survived for the QRians to enter schoolbooks worldwide as a civilization, not a fable. Their warnings were recopied in classrooms, their star tables studied by lamplight, and in museum halls glass cases held the kitchen complaint, the clinic note, the schoolmaster's pride: small human records that gave the dead their voices back.",
      compromised: "Some truth survived, but never whole. Museum halls filled with copied walls, careful sketches, and fragments under glass, and experts knew that something immense had happened there; but year by year the blank spaces told the truer story, until scholarship gave up on mastery and settled for the knowledge that the QRians had built something the living would never fully understand.",
      horrified: "Too much was lost, and the QRians passed half into history and half into myth. Schoolbooks reduced them to a warning, museums displayed fragments like relics from a legend, and each generation inherited the same uneasy feeling: that a great civilization had once stood here, but had vanished before it could truly be known.",
    },
  },
  {
    id: "croft",
    label: "Croft Company",
    weights: vec(2, 3, 0, -1, 2),
    thresholds: {
      vindicatedMin: 10,
      compromisedMin: 6,
    },
    consequences: {
      vindicated: "Croft believes the room acted as a responsible steward: danger constrained, ownership shared, and recklessness denied.",
      compromised: "Croft can live with the settlement, but not without unease about what may still escape or be mishandled later.",
      horrified: "Croft leaves convinced the group has repeated the QRians’ mistake by trusting something that should never have been opened lightly.",
    },
    epilogueFocus: "What was guarded",
    epilogue: {
      vindicated: "Stewardship became a living custom. Years later, any descent began the same way: three signatures in the ledger, three witnesses at the gate, three sets of eyes on every crate carried back into daylight. Museums changed their rules around the chamber, and the sealed stair entered expedition training as the story of how dangerous wonders were meant to be kept from becoming private kingdoms.",
      compromised: "The safeguards survived, but only as a story people had to keep retelling. One season it was a forged transit order, another a boot-mark beyond the warning line, another a crate opened where it should not have been; and so boards multiplied, rules thickened, and every institution that dealt with the chamber learned the same hard lesson, that stewardship was never finished, only maintained.",
      horrified: "Stewardship collapsed into possession. Patrons funded private descents, crates left camp under false labels, and museum wings quietly filled with objects no one could honestly explain. In time the temple was cited less as a warning than as the case that proved even dangerous wonders could be divided, displayed, and owned.",
    },
  },
  {
    id: "drake",
    label: "Drake Delegation",
    weights: vec(0, 1, 3, -1, 0),
    thresholds: {
      vindicatedMin: 10,
      compromisedMin: 2,
    },
    consequences: {
      vindicated: "Drake believes the threat was met decisively and that the room chose a real end over deferral or symbolic compromise.",
      compromised: "Drake accepts the outcome, but worries the danger was managed rather than truly settled.",
      horrified: "Drake leaves convinced the group has left a live wound behind for some later generation to suffer.",
    },
    epilogueFocus: "What continued",
    epilogue: {
      vindicated: "Because the ending felt final, the old obsession that the Source brought never found its way back into ordinary life. Clinics never had to name it, houses never wrote rules for second descents, and families were spared the small domestic terrors of hidden stones, cold meals, and sleepless counting after midnight.",
      compromised: "The danger of the Source's obsession effect was checked, but it taught the world new habits. Expedition medicine learned the signs first — the missed meal, the midnight copying, the request for one more descent — and before long every serious house had rules about who could go below, who could return, and who was never sent alone.",
      horrified: "The danger of the Source's obsession effect was never truly contained. Universities, workhouses, and households alike learned to fear the touched: the sleepless counters, the gentle voices, the hidden stones in drawers and under beds. Clinics filled, second-descent rules spread, and a soft new etiquette grew around people everyone suspected were already beginning to change.",
    },
  },
];

export const FINALE_OUTCOME_BY_ID = Object.fromEntries(
  FINALE_OUTCOMES.map((outcome) => [outcome.id, outcome]),
) as Record<FinaleOutcomeId, FinaleOutcomeDefinition>;

export const FINALE_CLAUSE_BY_ID = Object.fromEntries(
  FINALE_CLAUSES.map((clause) => [clause.id, clause]),
) as Record<FinaleClauseId, FinaleClauseDefinition>;

export const FINALE_HOUSE_BY_ID = Object.fromEntries(
  FINALE_HOUSES.map((house) => [house.id, house]),
) as Record<FinaleHouseId, FinaleHouseDefinition>;

function dot(weights: DimensionVector, vector: DimensionVector): number {
  return (
    weights.knowledge * vector.knowledge +
    weights.safety * vector.safety +
    weights.finality * vector.finality +
    weights.access * vector.access +
    weights.governance * vector.governance
  );
}

function getBand(score: number, house: FinaleHouseDefinition): FinaleBand {
  if (score >= house.thresholds.vindicatedMin) return "vindicated";
  if (score >= house.thresholds.compromisedMin) return "compromised";
  return "horrified";
}

function buildFinaleEpilogue(
  selection: FinaleSelection,
  houseResults: FinaleHouseResult[],
): FinaleEpilogue | null {
  if (!selection.outcomeId) return null;

  const outcome = FINALE_OUTCOME_BY_ID[selection.outcomeId];
  const sections = houseResults.map((result) => {
    const house = FINALE_HOUSE_BY_ID[result.houseId];
    return {
      houseId: result.houseId,
      label: result.label,
      heading: house.epilogueFocus,
      band: result.band,
      text: house.epilogue[result.band],
    };
  });

  return {
    title: outcome.epilogue.title,
    decision: outcome.epilogue.decision,
    sections,
    closing: outcome.epilogue.closing,
    paragraphs: [
      outcome.epilogue.decision,
      ...sections.map((section) => section.text),
      outcome.epilogue.closing,
    ],
  };
}

export function evaluateFinaleSelection(
  selection: FinaleSelection,
): FinaleEvaluation {
  const errors: string[] = [];

  if (!selection.outcomeId) {
    errors.push("Choose a major outcome.");
  }

  if (selection.clauseIds.length > FINALE_MAX_CLAUSES) {
    errors.push(`Choose at most ${FINALE_MAX_CLAUSES} clauses.`);
  }

  const seen = new Set<string>();
  for (const clauseId of selection.clauseIds) {
    if (seen.has(clauseId)) {
      errors.push(`Clause selected more than once: ${FINALE_CLAUSE_BY_ID[clauseId]?.label ?? clauseId}`);
    }
    seen.add(clauseId);
  }

  const clauses = selection.clauseIds
    .map((id) => FINALE_CLAUSE_BY_ID[id])
    .filter(Boolean);

  const outcomeVector = selection.outcomeId
    ? FINALE_OUTCOME_BY_ID[selection.outcomeId].vector
    : vec(0, 0, 0, 0, 0);

  const clauseVector = clauses.reduce(
    (acc, clause) => vec(
      acc.knowledge + clause.vector.knowledge,
      acc.safety + clause.vector.safety,
      acc.finality + clause.vector.finality,
      acc.access + clause.vector.access,
      acc.governance + clause.vector.governance,
    ),
    vec(0, 0, 0, 0, 0),
  );

  const finalVector = vec(
    outcomeVector.knowledge + clauseVector.knowledge,
    outcomeVector.safety + clauseVector.safety,
    outcomeVector.finality + clauseVector.finality,
    outcomeVector.access + clauseVector.access,
    outcomeVector.governance + clauseVector.governance,
  );

  const houseResults = FINALE_HOUSES.map((house) => {
    const score = dot(house.weights, finalVector);
    const band = getBand(score, house);
    return {
      houseId: house.id,
      label: house.label,
      score,
      band,
      consequence: house.consequences[band],
    };
  });

  return {
    valid: errors.length === 0,
    errors,
    selection,
    houseResults,
    epilogue: buildFinaleEpilogue(selection, houseResults),
  };
}
