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

export interface FinaleEvaluation {
  valid: boolean;
  errors: string[];
  selection: FinaleSelection;
  houseResults: FinaleHouseResult[];
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
  },
  {
    id: "recontain_source",
    label: "Recontain the Source",
    description: "Restore containment and leave the Source closed off rather than opened or annihilated.",
    vector: vec(-1, 2, 2, -2, 0),
  },
  {
    id: "open_for_research",
    label: "Open It for Research",
    description: "Permit controlled access to the Source for study and preservation in the present generation.",
    vector: vec(2, -2, -1, 2, 0),
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
    description: "Keep the temple’s location secret even if some truth escapes.",
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
  },
];

export const FINALE_OUTCOME_BY_ID = Object.fromEntries(
  FINALE_OUTCOMES.map((outcome) => [outcome.id, outcome]),
) as Record<FinaleOutcomeId, FinaleOutcomeDefinition>;

export const FINALE_CLAUSE_BY_ID = Object.fromEntries(
  FINALE_CLAUSES.map((clause) => [clause.id, clause]),
) as Record<FinaleClauseId, FinaleClauseDefinition>;

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
  };
}
