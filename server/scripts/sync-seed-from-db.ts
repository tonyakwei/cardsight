/**
 * sync-seed-from-db.ts
 *
 * Surgically syncs hand-edited content from the live local Postgres DB
 * into the imperative TypeScript seed file `server/prisma/seed-qrians.ts`,
 * so admin-edited text (mission/card/answer-template/story-sheet) is
 * preserved across reseeds.
 *
 * Run:
 *   pnpm --filter server sync-seed -- --house Drake --act 1
 *   pnpm --filter server sync-seed -- --all
 *   pnpm --filter server sync-seed -- --house Jones --act 2 --apply
 *
 * Default is dry-run (prints diff). Pass --apply to write changes.
 *
 * Only edits text content — never structural fields like requiredClueSets,
 * answerTemplateType, answerId, cardSetId, physicalCardId, sortOrder.
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { prisma } from "../src/lib/prisma.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SEED_PATH = path.resolve(__dirname, "../prisma/seed-qrians.ts");
const GAME_NAME = "Temple of the QRians";

// ─── Types ──────────────────────────────────────────────────────────

type Args = {
  house: string | null;
  act: number | null;
  all: boolean;
  apply: boolean;
};

type Block = {
  start: number; // inclusive offset
  end: number;   // exclusive offset (just after the closing `)`)
  body: string;  // the slice [start, end)
};

type MissionBlock = Block & { title: string; answerVar: string | null; varName: string | null };
type AnswerBlock = Block & { kind: "single" | "multiple"; varName: string };
type CardSetCreateBlock = Block & { varName: string; setName: string };
type HouseCreateBlock = Block & { varName: string; houseName: string };
type StorySheetBlock = Block & { houseVar: string; act: number };
type CardCreateBlock = Block & {
  // For createClueCard({...}) calls
  cardSetVar: string;
  act: number;
};
type MissionConsequenceBlock = Block & {
  sourceMissionVar: string;
  targetMissionVar: string | null;
  type: string;
};

type FieldEdit = {
  fieldName: string;
  oldValue: string;
  newValue: string;
  // Region inside the block where the value lives (relative to file).
  // Replacement strategy: substring replacement of the field's value literal.
};

type EntityEdit = {
  label: string;
  blockStart: number;
  blockEnd: number;
  edits: FieldEdit[];
};

// ─── CLI ────────────────────────────────────────────────────────────

function parseArgs(argv: string[]): Args {
  const args: Args = { house: null, act: null, all: false, apply: false };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--house") {
      args.house = argv[++i] ?? null;
    } else if (a === "--act") {
      const n = Number(argv[++i]);
      if (!Number.isFinite(n)) usage(`Invalid --act value`);
      args.act = n;
    } else if (a === "--all") {
      args.all = true;
    } else if (a === "--apply") {
      args.apply = true;
    } else if (a === "-h" || a === "--help") {
      usage();
    } else if (a === "--") {
      // pnpm-style separator passed through; ignore
      continue;
    } else {
      usage(`Unknown arg: ${a}`);
    }
  }
  if (!args.all && !args.house && args.act === null) {
    usage("Must specify --house, --act, or --all");
  }
  return args;
}

function usage(msg?: string): never {
  if (msg) console.error(`Error: ${msg}\n`);
  console.error(
    `Usage: sync-seed-from-db.ts [--house <name>] [--act <n>] [--all] [--apply]\n` +
      `\n` +
      `  --house <name>  Filter to one house (case-insensitive prefix match)\n` +
      `  --act <n>       Filter to one act (1, 2, or 3)\n` +
      `  --all           Sync everything\n` +
      `  --apply         Write changes (default: dry-run)\n`
  );
  process.exit(1);
}

// ─── Paren-balanced block walker ────────────────────────────────────

/**
 * Given the source and a starting offset that points at an `(`, return the
 * matching closing paren offset. Skips strings (single, double, backtick) and
 * line/block comments. Throws if unbalanced.
 */
function findMatchingParen(src: string, openOffset: number): number {
  if (src[openOffset] !== "(") {
    throw new Error(`Expected '(' at offset ${openOffset}, got '${src[openOffset]}'`);
  }
  let depth = 0;
  let i = openOffset;
  while (i < src.length) {
    const ch = src[i];
    const next = src[i + 1];
    // Skip line comments
    if (ch === "/" && next === "/") {
      const nl = src.indexOf("\n", i);
      if (nl === -1) throw new Error("Unterminated line comment");
      i = nl + 1;
      continue;
    }
    // Skip block comments
    if (ch === "/" && next === "*") {
      const end = src.indexOf("*/", i + 2);
      if (end === -1) throw new Error("Unterminated block comment");
      i = end + 2;
      continue;
    }
    // Skip strings
    if (ch === '"' || ch === "'" || ch === "`") {
      const quote = ch;
      i++;
      while (i < src.length) {
        const c = src[i];
        if (c === "\\") {
          i += 2;
          continue;
        }
        if (c === quote) {
          i++;
          break;
        }
        // Template literal — skip ${...} via depth tracking
        if (quote === "`" && c === "$" && src[i + 1] === "{") {
          // For this seed we don't expect template literals with deep nesting.
          // Simple skip: find matching '}'.
          let d = 0;
          i += 2;
          while (i < src.length) {
            if (src[i] === "{") d++;
            else if (src[i] === "}") {
              if (d === 0) {
                i++;
                break;
              }
              d--;
            }
            i++;
          }
          continue;
        }
        i++;
      }
      continue;
    }
    if (ch === "(") depth++;
    else if (ch === ")") {
      depth--;
      if (depth === 0) return i;
    }
    i++;
  }
  throw new Error(`Unbalanced parens starting at ${openOffset}`);
}

// ─── Field locator inside a block body ──────────────────────────────

/**
 * Find a top-level (well, inside the data: { ... } object) field by name.
 * Returns the absolute offsets of the value literal in the source.
 *
 * Restriction: only handles double-quoted string values, array literals,
 * and single boolean/number tokens. We use this for puzzleDescription,
 * description, etc., plus `fields: [ ... ]`, plus `hintAfterAttempts: 2`,
 * etc.
 *
 * Returns null if the field is not present in the block.
 */
function findFieldValue(
  src: string,
  blockStart: number,
  blockEnd: number,
  fieldName: string
): { valueStart: number; valueEnd: number; raw: string } | null {
  // Match field at line-ish boundary: [whitespace,{,(,;] fieldName: <value>
  // We do a regex search restricted to the block range.
  const slice = src.slice(blockStart, blockEnd);
  const re = new RegExp(`(^|[\\s,{])(${fieldName})\\s*:\\s*`, "g");
  let m: RegExpExecArray | null;
  while ((m = re.exec(slice))) {
    const valueStartRel = m.index + m[0].length;
    // Check this isn't inside a nested object's field with the same name we don't want.
    // For our purposes we accept the first match.
    const absStart = blockStart + valueStartRel;
    const valueEnd = scanValueEnd(src, absStart);
    if (valueEnd === null || valueEnd > blockEnd) return null;
    return {
      valueStart: absStart,
      valueEnd,
      raw: src.slice(absStart, valueEnd),
    };
  }
  return null;
}

/**
 * Starting at offset `start` (the first char of a JS value), scan until the
 * end of that value. Handles quoted strings, arrays, numbers, booleans, null.
 */
function scanValueEnd(src: string, start: number): number | null {
  let i = start;
  // Skip whitespace
  while (i < src.length && /\s/.test(src[i])) i++;
  const ch = src[i];
  if (ch === '"' || ch === "'" || ch === "`") {
    const quote = ch;
    i++;
    while (i < src.length) {
      const c = src[i];
      if (c === "\\") {
        i += 2;
        continue;
      }
      if (c === quote) return i + 1;
      i++;
    }
    return null;
  }
  if (ch === "[" || ch === "{") {
    const open = ch;
    const close = ch === "[" ? "]" : "}";
    let depth = 0;
    while (i < src.length) {
      const c = src[i];
      const n = src[i + 1];
      if (c === "/" && n === "/") {
        const nl = src.indexOf("\n", i);
        i = nl === -1 ? src.length : nl + 1;
        continue;
      }
      if (c === "/" && n === "*") {
        const e = src.indexOf("*/", i + 2);
        i = e === -1 ? src.length : e + 2;
        continue;
      }
      if (c === '"' || c === "'" || c === "`") {
        const q = c;
        i++;
        while (i < src.length) {
          if (src[i] === "\\") {
            i += 2;
            continue;
          }
          if (src[i] === q) {
            i++;
            break;
          }
          i++;
        }
        continue;
      }
      if (c === open) depth++;
      else if (c === close) {
        depth--;
        if (depth === 0) return i + 1;
      }
      i++;
    }
    return null;
  }
  // Bare token: number, boolean, null, identifier (e.g. ansFooBar.id)
  while (i < src.length && /[A-Za-z0-9_.\-+]/.test(src[i])) i++;
  return i;
}

// ─── Concatenated string-literal join ───────────────────────────────

/**
 * Some seed string literals span multiple lines and are written as
 *   "foo "
 *   + "bar"
 * or by using `\n`. The seed file uses single `"..."` (with `\n` escapes)
 * for almost everything — but to be safe, we collapse adjacent string
 * literals joined by `+`.
 *
 * NOTE: The current seed-qrians.ts uses single double-quoted strings only,
 * so this is mostly defensive. We support a single double-quoted string
 * value.
 */
function decodeJsString(src: string, start: number, end: number): string {
  const raw = src.slice(start, end).trim();
  if (!(raw.startsWith('"') && raw.endsWith('"'))) {
    // Try template literal or single-quoted
    if (raw.startsWith('`') && raw.endsWith('`')) {
      // Template literal — JSON.parse won't work; do a minimal decode
      // (no ${} interpolation expected)
      return raw.slice(1, -1).replace(/\\n/g, "\n").replace(/\\`/g, "`").replace(/\\\\/g, "\\");
    }
    if (raw.startsWith("'") && raw.endsWith("'")) {
      const inner = raw.slice(1, -1);
      return inner
        .replace(/\\n/g, "\n")
        .replace(/\\'/g, "'")
        .replace(/\\\\/g, "\\");
    }
    throw new Error(`Not a recognized string literal: ${raw.slice(0, 40)}...`);
  }
  // Use JSON.parse to decode escapes
  return JSON.parse(raw);
}

function encodeJsString(value: string): string {
  return JSON.stringify(value);
}

// ─── Seed parsing ───────────────────────────────────────────────────

type SeedIndex = {
  src: string;
  missionsByTitle: Map<string, MissionBlock>;
  missionVarByTitle: Map<string, string>; // mission title → var name (when `const m_X = ...` was found)
  answersByVar: Map<string, AnswerBlock>;
  cardSetByVar: Map<string, CardSetCreateBlock>;
  cardSetVarByName: Map<string, string>;
  houseByVar: Map<string, HouseCreateBlock>;
  houseVarByName: Map<string, string>;
  storySheetByHouseAct: Map<string, StorySheetBlock>;
  cardsBySetActOrdered: Map<string, CardCreateBlock[]>; // key = `${cardSetVar}|${act}`
  // key = `${sourceVar}|${targetVar ?? "null"}|${type}`
  missionConsequencesByKey: Map<string, MissionConsequenceBlock>;
};

function parseSeed(src: string): SeedIndex {
  const missionsByTitle = new Map<string, MissionBlock>();
  const missionVarByTitle = new Map<string, string>();
  const answersByVar = new Map<string, AnswerBlock>();
  const cardSetByVar = new Map<string, CardSetCreateBlock>();
  const cardSetVarByName = new Map<string, string>();
  const houseByVar = new Map<string, HouseCreateBlock>();
  const houseVarByName = new Map<string, string>();
  const storySheetByHouseAct = new Map<string, StorySheetBlock>();
  const cardsBySetActOrdered = new Map<string, CardCreateBlock[]>();
  const missionConsequencesByKey = new Map<string, MissionConsequenceBlock>();

  // Find every prisma.X.create( ... ) and createClueCard( ... ) call.
  // For each, locate the matching ')' via paren walker.
  const callPattern =
    /(prisma\.(mission|singleAnswer|multipleAnswer|cardSet|house|storySheet|card|missionConsequence)\.create\s*\(|createClueCard\s*\()/g;

  let match: RegExpExecArray | null;
  while ((match = callPattern.exec(src))) {
    const callKind = match[2] ?? "createClueCard";
    // Find the '(' position
    let parenStart = match.index + match[0].length - 1;
    if (src[parenStart] !== "(") {
      // Skip back/forward to '('
      while (parenStart < src.length && src[parenStart] !== "(") parenStart++;
    }
    const parenEnd = findMatchingParen(src, parenStart);
    const blockStart = match.index;
    const blockEnd = parenEnd + 1;
    const body = src.slice(blockStart, blockEnd);

    if (callKind === "mission") {
      const title = readStringField(src, blockStart, blockEnd, "title");
      const answerVar = readIdentField(src, blockStart, blockEnd, "answerId");
      const varName = readPrecedingConstName(src, blockStart);
      if (title) {
        missionsByTitle.set(title, {
          start: blockStart,
          end: blockEnd,
          body,
          title,
          answerVar,
          varName,
        });
        if (varName) {
          missionVarByTitle.set(title, varName);
        }
      }
    } else if (callKind === "singleAnswer" || callKind === "multipleAnswer") {
      // Find the `const ansFoo = await ...` to extract var name
      const varName = readPrecedingConstName(src, blockStart);
      if (varName) {
        answersByVar.set(varName, {
          start: blockStart,
          end: blockEnd,
          body,
          kind: callKind === "singleAnswer" ? "single" : "multiple",
          varName,
        });
      }
    } else if (callKind === "cardSet") {
      const varName = readPrecedingConstName(src, blockStart);
      const setName = readStringField(src, blockStart, blockEnd, "name");
      if (varName && setName) {
        const blk: CardSetCreateBlock = {
          start: blockStart,
          end: blockEnd,
          body,
          varName,
          setName,
        };
        cardSetByVar.set(varName, blk);
        cardSetVarByName.set(setName, varName);
      }
    } else if (callKind === "house") {
      const varName = readPrecedingConstName(src, blockStart);
      const houseName = readStringField(src, blockStart, blockEnd, "name");
      if (varName && houseName) {
        const blk: HouseCreateBlock = {
          start: blockStart,
          end: blockEnd,
          body,
          varName,
          houseName,
        };
        houseByVar.set(varName, blk);
        houseVarByName.set(houseName, varName);
      }
    } else if (callKind === "storySheet") {
      const houseExpr = readIdentField(src, blockStart, blockEnd, "houseId");
      // houseExpr looks like "drake.id" — strip ".id"
      const houseVar = houseExpr ? houseExpr.replace(/\.id$/, "") : null;
      const actStr = readNumberField(src, blockStart, blockEnd, "act");
      if (houseVar && actStr !== null) {
        storySheetByHouseAct.set(`${houseVar}|${actStr}`, {
          start: blockStart,
          end: blockEnd,
          body,
          houseVar,
          act: actStr,
        });
      }
    } else if (callKind === "createClueCard") {
      const cardSetExpr = readIdentField(src, blockStart, blockEnd, "cardSetId");
      const cardSetVar = cardSetExpr ? cardSetExpr.replace(/\.id$/, "") : null;
      const actStr = readNumberField(src, blockStart, blockEnd, "act");
      if (cardSetVar && actStr !== null) {
        const key = `${cardSetVar}|${actStr}`;
        const list = cardsBySetActOrdered.get(key) ?? [];
        list.push({
          start: blockStart,
          end: blockEnd,
          body,
          cardSetVar,
          act: actStr,
        });
        cardsBySetActOrdered.set(key, list);
      }
    } else if (callKind === "card") {
      // Direct prisma.card.create — these are Act 3 history/reference cards.
      // We don't sync these via this script (they're array-driven in seed).
    } else if (callKind === "missionConsequence") {
      const sourceExpr = readIdentField(src, blockStart, blockEnd, "sourceMissionId");
      const targetExpr = readIdentField(src, blockStart, blockEnd, "targetMissionId");
      const type = readStringField(src, blockStart, blockEnd, "type");
      const sourceVar = sourceExpr ? sourceExpr.replace(/\.id$/, "") : null;
      const targetVar = targetExpr ? targetExpr.replace(/\.id$/, "") : null;
      if (sourceVar && type) {
        const key = `${sourceVar}|${targetVar ?? "null"}|${type}`;
        if (missionConsequencesByKey.has(key)) {
          // Multiple consequences could share (source, target, type) with
          // different triggerOnFailure/Success flags. We don't have a
          // disambiguator from the DB side beyond type+target, so skip dupes
          // with a warning rather than silently overwriting.
          console.warn(
            `[warn] duplicate missionConsequence anchor: ${key} — only the first will be synced`
          );
        } else {
          missionConsequencesByKey.set(key, {
            start: blockStart,
            end: blockEnd,
            body,
            sourceMissionVar: sourceVar,
            targetMissionVar: targetVar,
            type,
          });
        }
      }
    }
  }

  return {
    src,
    missionsByTitle,
    missionVarByTitle,
    answersByVar,
    cardSetByVar,
    cardSetVarByName,
    houseByVar,
    houseVarByName,
    storySheetByHouseAct,
    cardsBySetActOrdered,
    missionConsequencesByKey,
  };
}

function readStringField(
  src: string,
  start: number,
  end: number,
  name: string
): string | null {
  const f = findFieldValue(src, start, end, name);
  if (!f) return null;
  try {
    return decodeJsString(src, f.valueStart, f.valueEnd);
  } catch {
    return null;
  }
}

function readNumberField(
  src: string,
  start: number,
  end: number,
  name: string
): number | null {
  const f = findFieldValue(src, start, end, name);
  if (!f) return null;
  const n = Number(f.raw.trim());
  return Number.isFinite(n) ? n : null;
}

function readIdentField(
  src: string,
  start: number,
  end: number,
  name: string
): string | null {
  const f = findFieldValue(src, start, end, name);
  if (!f) return null;
  return f.raw.trim();
}

/** Walk backward from offset to find `const FOO = ` declaration name. */
function readPrecedingConstName(src: string, offset: number): string | null {
  // Look backward for `const <name> = await prisma...` on same logical line.
  // Scan back up to 200 chars.
  const startScan = Math.max(0, offset - 200);
  const region = src.slice(startScan, offset);
  const m = /const\s+([A-Za-z_][A-Za-z0-9_]*)\s*=\s*await\s*$/m.exec(region);
  if (m) return m[1];
  // Try without trailing whitespace anchor
  const m2 = /const\s+([A-Za-z_][A-Za-z0-9_]*)\s*=\s*await\s+/g;
  let found: string | null = null;
  let mm: RegExpExecArray | null;
  while ((mm = m2.exec(region))) found = mm[1];
  return found;
}

// ─── Diff helpers ───────────────────────────────────────────────────

function trunc(s: string, n = 200): string {
  if (s.length <= n) return s;
  return s.slice(0, n) + `… [${s.length - n} more chars]`;
}

function printFieldDiff(field: string, oldVal: string, newVal: string) {
  if (oldVal === newVal) return;
  const oldShown = trunc(oldVal);
  const newShown = trunc(newVal);
  console.log(`  ${field}:`);
  console.log(`    - ${JSON.stringify(oldShown)}`);
  console.log(`    + ${JSON.stringify(newShown)}`);
}

function printArrayDiff(field: string, oldVal: unknown, newVal: unknown) {
  const o = JSON.stringify(oldVal);
  const n = JSON.stringify(newVal);
  if (o === n) return;
  console.log(`  ${field}:`);
  console.log(`    - ${trunc(o, 300)}`);
  console.log(`    + ${trunc(n, 300)}`);
}

// ─── Replacement plan ───────────────────────────────────────────────

type Replacement = {
  start: number;
  end: number;
  newText: string;
  // For logging only
  context: string;
};

function planFieldReplacement(
  src: string,
  blockStart: number,
  blockEnd: number,
  fieldName: string,
  newRawValue: string,
  context: string
): Replacement | null {
  const f = findFieldValue(src, blockStart, blockEnd, fieldName);
  if (!f) return null;
  return {
    start: f.valueStart,
    end: f.valueEnd,
    newText: newRawValue,
    context: `${context}.${fieldName}`,
  };
}

// ─── Main sync logic ────────────────────────────────────────────────

async function main() {
  const args = parseArgs(process.argv.slice(2));

  const game = await prisma.game.findFirst({ where: { name: GAME_NAME } });
  if (!game) {
    console.error(`No game named "${GAME_NAME}" found in DB.`);
    process.exit(1);
  }

  // House filter
  let scopedHouses: { id: string; name: string }[] = [];
  if (args.house) {
    const all = await prisma.house.findMany({ where: { gameId: game.id } });
    const needle = args.house.toLowerCase();
    scopedHouses = all.filter((h) => h.name.toLowerCase().startsWith(needle));
    if (scopedHouses.length === 0) {
      console.error(`No house matching "${args.house}" — found: ${all.map((h) => h.name).join(", ")}`);
      process.exit(1);
    }
  } else {
    scopedHouses = await prisma.house.findMany({ where: { gameId: game.id } });
  }
  const scopedHouseIds = new Set(scopedHouses.map((h) => h.id));
  const acts = args.act ? [args.act] : [1, 2, 3];

  console.log(
    `Scope: game="${game.name}", houses=[${scopedHouses
      .map((h) => h.name)
      .join(", ")}], acts=[${acts.join(",")}]`
  );

  // Read seed
  const src = fs.readFileSync(SEED_PATH, "utf8");
  const seed = parseSeed(src);

  const replacements: Replacement[] = [];
  let missionsChanged = 0;
  let cardsChanged = 0;
  let answersChanged = 0;
  let sheetsChanged = 0;

  // ─── Missions ────────────────────────────────────────────────────
  const missions = await prisma.mission.findMany({
    where: {
      gameId: game.id,
      act: { in: acts },
      ...(args.house
        ? {
            missionHouses: {
              some: { houseId: { in: [...scopedHouseIds] } },
            },
          }
        : {}),
    },
    include: { missionHouses: true },
    orderBy: [{ act: "asc" }, { sortOrder: "asc" }],
  });

  // For per-mission scope: collect cardSetIds referenced by their requiredClueSets.
  const scopedCardSetIds = new Set<string>();
  // Collect answer template ids for those missions
  const scopedAnswers: { id: string; type: string; missionTitle: string }[] = [];

  for (const m of missions) {
    const block = seed.missionsByTitle.get(m.title);
    if (!block) {
      console.warn(`[warn] mission "${m.title}" not found in seed — skipping`);
      continue;
    }
    const fieldsToSync: { name: keyof typeof m; dbVal: string }[] = [
      { name: "puzzleDescription", dbVal: m.puzzleDescription ?? "" },
      { name: "storySheetBlurb", dbVal: m.storySheetBlurb ?? "" },
      { name: "correctAnswerReveal", dbVal: m.correctAnswerReveal ?? "" },
      { name: "consequenceCompleted", dbVal: m.consequenceCompleted ?? "" },
      { name: "consequenceNotCompleted", dbVal: m.consequenceNotCompleted ?? "" },
      // Always wipe description
      { name: "description", dbVal: "" },
    ];

    const localChanges: { field: string; oldVal: string; newVal: string }[] = [];
    for (const { name, dbVal } of fieldsToSync) {
      const f = findFieldValue(src, block.start, block.end, name as string);
      if (!f) {
        // field not present — skip silently for description (some missions
        // might have non-empty desc); warn for the others
        if (name !== "description") {
          console.warn(
            `[warn] mission "${m.title}": field "${String(name)}" not present in seed, skipping`
          );
        }
        continue;
      }
      let seedVal: string;
      try {
        seedVal = decodeJsString(src, f.valueStart, f.valueEnd);
      } catch {
        console.warn(
          `[warn] mission "${m.title}": could not decode "${String(name)}" — skipping`
        );
        continue;
      }
      if (seedVal === dbVal) continue;
      localChanges.push({ field: String(name), oldVal: seedVal, newVal: dbVal });
      replacements.push({
        start: f.valueStart,
        end: f.valueEnd,
        newText: encodeJsString(dbVal),
        context: `mission(${m.title}).${String(name)}`,
      });
    }

    if (localChanges.length > 0) {
      missionsChanged++;
      console.log(`\n=== Mission "${m.title}" (act ${m.act}) ===`);
      for (const c of localChanges) {
        printFieldDiff(c.field, c.oldVal, c.newVal);
      }
    }

    // Collect scope info
    const requiredSets = (m.requiredClueSets as { cardSetId: string; count: number }[]) || [];
    for (const rs of requiredSets) scopedCardSetIds.add(rs.cardSetId);
    if (m.answerId && m.answerTemplateType) {
      scopedAnswers.push({
        id: m.answerId,
        type: m.answerTemplateType,
        missionTitle: m.title,
      });
    }
  }

  // ─── Answer templates ────────────────────────────────────────────
  // Group by id to avoid double-processing if multiple missions share an answer.
  const answerIdsSeen = new Set<string>();
  for (const sa of scopedAnswers) {
    if (answerIdsSeen.has(sa.id)) continue;
    answerIdsSeen.add(sa.id);

    const missionBlock = seed.missionsByTitle.get(sa.missionTitle);
    if (!missionBlock || !missionBlock.answerVar) {
      // Can't resolve var name without mission block
      continue;
    }
    // answerVar is like "ansFooBar.id" — strip .id
    const ansVar = missionBlock.answerVar.replace(/\.id$/, "");
    const ansBlock = seed.answersByVar.get(ansVar);
    if (!ansBlock) {
      console.warn(`[warn] answer var "${ansVar}" not found in seed — skipping`);
      continue;
    }

    if (sa.type === "single_answer") {
      const dbAns = await prisma.singleAnswer.findUnique({ where: { id: sa.id } });
      if (!dbAns) continue;
      const localChanges: { field: string; oldVal: unknown; newVal: unknown }[] = [];
      const stringFields: (keyof typeof dbAns)[] = ["correctAnswer", "hint"];
      const arrayFields: (keyof typeof dbAns)[] = ["acceptAlternatives"];
      const numberFields: (keyof typeof dbAns)[] = ["hintAfterAttempts", "maxAttempts"];
      const boolFields: (keyof typeof dbAns)[] = ["caseSensitive", "trimWhitespace", "hintEnabled"];

      for (const fname of stringFields) {
        const f = findFieldValue(src, ansBlock.start, ansBlock.end, fname as string);
        if (!f) continue;
        const seedVal = decodeJsString(src, f.valueStart, f.valueEnd);
        const dbVal = (dbAns[fname] as string | null) ?? "";
        if (seedVal === dbVal) continue;
        localChanges.push({ field: fname as string, oldVal: seedVal, newVal: dbVal });
        replacements.push({
          start: f.valueStart,
          end: f.valueEnd,
          newText: encodeJsString(dbVal),
          context: `answer(${ansVar}).${String(fname)}`,
        });
      }
      for (const fname of arrayFields) {
        const f = findFieldValue(src, ansBlock.start, ansBlock.end, fname as string);
        if (!f) continue;
        const seedRaw = src.slice(f.valueStart, f.valueEnd);
        let seedVal: unknown;
        try {
          seedVal = JSON.parse(seedRaw);
        } catch {
          continue;
        }
        const dbVal = dbAns[fname];
        if (JSON.stringify(seedVal) === JSON.stringify(dbVal)) continue;
        localChanges.push({ field: fname as string, oldVal: seedVal, newVal: dbVal });
        replacements.push({
          start: f.valueStart,
          end: f.valueEnd,
          newText: JSON.stringify(dbVal),
          context: `answer(${ansVar}).${String(fname)}`,
        });
      }
      for (const fname of numberFields) {
        const f = findFieldValue(src, ansBlock.start, ansBlock.end, fname as string);
        if (!f) continue;
        const seedRaw = src.slice(f.valueStart, f.valueEnd).trim();
        const seedVal = seedRaw === "null" ? null : Number(seedRaw);
        const dbVal = dbAns[fname] as number | null;
        if (seedVal === dbVal) continue;
        localChanges.push({ field: fname as string, oldVal: seedVal, newVal: dbVal });
        replacements.push({
          start: f.valueStart,
          end: f.valueEnd,
          newText: dbVal === null ? "null" : String(dbVal),
          context: `answer(${ansVar}).${String(fname)}`,
        });
      }
      for (const fname of boolFields) {
        const f = findFieldValue(src, ansBlock.start, ansBlock.end, fname as string);
        if (!f) continue;
        const seedVal = src.slice(f.valueStart, f.valueEnd).trim() === "true";
        const dbVal = dbAns[fname] as boolean;
        if (seedVal === dbVal) continue;
        localChanges.push({ field: fname as string, oldVal: seedVal, newVal: dbVal });
        replacements.push({
          start: f.valueStart,
          end: f.valueEnd,
          newText: String(dbVal),
          context: `answer(${ansVar}).${String(fname)}`,
        });
      }

      if (localChanges.length > 0) {
        answersChanged++;
        console.log(`\n=== Answer "${ansVar}" (single, mission "${sa.missionTitle}") ===`);
        for (const c of localChanges) {
          if (typeof c.oldVal === "string" || c.oldVal === null) {
            printFieldDiff(c.field, String(c.oldVal ?? ""), String(c.newVal ?? ""));
          } else {
            printArrayDiff(c.field, c.oldVal, c.newVal);
          }
        }
      }
    } else if (sa.type === "multiple_text") {
      const dbAns = await prisma.multipleAnswer.findUnique({ where: { id: sa.id } });
      if (!dbAns) continue;
      const localChanges: { field: string; oldVal: unknown; newVal: unknown }[] = [];
      // fields (json array)
      const fField = findFieldValue(src, ansBlock.start, ansBlock.end, "fields");
      if (fField) {
        const seedRaw = src.slice(fField.valueStart, fField.valueEnd);
        let seedVal: unknown;
        try {
          // The seed uses bare object literals (caseSensitive: false), not JSON.
          // Use eval-style via Function. Safer: this is dev tooling.
          seedVal = new Function(`return (${seedRaw})`)();
        } catch (e) {
          console.warn(`[warn] could not eval seed fields[]: ${e}`);
          seedVal = null;
        }
        const dbVal = dbAns.fields;
        if (seedVal !== null && !deepEqualKeyless(seedVal, dbVal)) {
          localChanges.push({ field: "fields", oldVal: seedVal, newVal: dbVal });
          replacements.push({
            start: fField.valueStart,
            end: fField.valueEnd,
            newText: formatFieldsArray(dbVal as unknown[]),
            context: `answer(${ansVar}).fields`,
          });
        }
      }

      // hint, hintEnabled, hintAfterAttempts, maxAttempts
      const stringFields: (keyof typeof dbAns)[] = ["hint"];
      const numberFields: (keyof typeof dbAns)[] = ["hintAfterAttempts", "maxAttempts"];
      const boolFields: (keyof typeof dbAns)[] = ["hintEnabled"];

      for (const fname of stringFields) {
        const f = findFieldValue(src, ansBlock.start, ansBlock.end, fname as string);
        if (!f) continue;
        const seedVal = decodeJsString(src, f.valueStart, f.valueEnd);
        const dbVal = (dbAns[fname] as string | null) ?? "";
        if (seedVal === dbVal) continue;
        localChanges.push({ field: fname as string, oldVal: seedVal, newVal: dbVal });
        replacements.push({
          start: f.valueStart,
          end: f.valueEnd,
          newText: encodeJsString(dbVal),
          context: `answer(${ansVar}).${String(fname)}`,
        });
      }
      for (const fname of numberFields) {
        const f = findFieldValue(src, ansBlock.start, ansBlock.end, fname as string);
        if (!f) continue;
        const seedRaw = src.slice(f.valueStart, f.valueEnd).trim();
        const seedVal = seedRaw === "null" ? null : Number(seedRaw);
        const dbVal = dbAns[fname] as number | null;
        if (seedVal === dbVal) continue;
        localChanges.push({ field: fname as string, oldVal: seedVal, newVal: dbVal });
        replacements.push({
          start: f.valueStart,
          end: f.valueEnd,
          newText: dbVal === null ? "null" : String(dbVal),
          context: `answer(${ansVar}).${String(fname)}`,
        });
      }
      for (const fname of boolFields) {
        const f = findFieldValue(src, ansBlock.start, ansBlock.end, fname as string);
        if (!f) continue;
        const seedVal = src.slice(f.valueStart, f.valueEnd).trim() === "true";
        const dbVal = dbAns[fname] as boolean;
        if (seedVal === dbVal) continue;
        localChanges.push({ field: fname as string, oldVal: seedVal, newVal: dbVal });
        replacements.push({
          start: f.valueStart,
          end: f.valueEnd,
          newText: String(dbVal),
          context: `answer(${ansVar}).${String(fname)}`,
        });
      }

      if (localChanges.length > 0) {
        answersChanged++;
        console.log(`\n=== Answer "${ansVar}" (multiple, mission "${sa.missionTitle}") ===`);
        for (const c of localChanges) {
          if (c.field === "fields") {
            printArrayDiff(c.field, c.oldVal, c.newVal);
          } else if (typeof c.oldVal === "string" || c.oldVal === null) {
            printFieldDiff(c.field, String(c.oldVal ?? ""), String(c.newVal ?? ""));
          } else {
            printArrayDiff(c.field, c.oldVal, c.newVal);
          }
        }
      }
    }
  }

  // ─── Cards ───────────────────────────────────────────────────────
  // For each scoped card set + each scoped act, fetch DB cards in order
  // and match positionally against seed createClueCard blocks.
  for (const cardSetId of scopedCardSetIds) {
    const cs = await prisma.cardSet.findUnique({ where: { id: cardSetId } });
    if (!cs) continue;
    const cardSetVar = seed.cardSetVarByName.get(cs.name);
    if (!cardSetVar) {
      console.warn(`[warn] card set "${cs.name}" not found in seed — skipping its cards`);
      continue;
    }
    for (const act of acts) {
      const dbCards = await prisma.card.findMany({
        where: { cardSetId, act, gameId: game.id, subtype: "standard" },
        orderBy: { createdAt: "asc" },
      });
      const seedCards = seed.cardsBySetActOrdered.get(`${cardSetVar}|${act}`) ?? [];

      if (dbCards.length === 0 && seedCards.length === 0) continue;
      if (dbCards.length !== seedCards.length) {
        console.warn(
          `[warn] card count mismatch for set "${cs.name}" act ${act}: db=${dbCards.length} seed=${seedCards.length} — skipping`
        );
        continue;
      }

      for (let i = 0; i < dbCards.length; i++) {
        const dbCard = dbCards[i];
        const seedCard = seedCards[i];
        const localChanges: { field: string; oldVal: string; newVal: string }[] = [];

        for (const fname of ["description", "clueContent"] as const) {
          const f = findFieldValue(src, seedCard.start, seedCard.end, fname);
          const dbVal = (dbCard[fname] as string | null) ?? "";
          if (!f) {
            if (dbVal === "") continue; // nothing to sync, no-op
            // field not in seed — skip with warning if DB has content
            console.warn(
              `[warn] card (set "${cs.name}" act ${act} #${i + 1}): field "${fname}" not in seed, skipping`
            );
            continue;
          }
          const seedVal = decodeJsString(src, f.valueStart, f.valueEnd);
          if (seedVal === dbVal) continue;
          localChanges.push({ field: fname, oldVal: seedVal, newVal: dbVal });
          replacements.push({
            start: f.valueStart,
            end: f.valueEnd,
            newText: encodeJsString(dbVal),
            context: `card(set=${cs.name},act=${act},#${i + 1}).${fname}`,
          });
        }
        if (localChanges.length > 0) {
          cardsChanged++;
          console.log(
            `\n=== Card set "${cs.name}" act ${act} #${i + 1} (header: "${dbCard.header ?? ""}") ===`
          );
          for (const c of localChanges) {
            printFieldDiff(c.field, c.oldVal, c.newVal);
          }
        }
      }
    }
  }

  // ─── Story sheets ────────────────────────────────────────────────
  for (const house of scopedHouses) {
    const houseVar = seed.houseVarByName.get(house.name);
    if (!houseVar) {
      console.warn(`[warn] house "${house.name}" not in seed — skipping its story sheets`);
      continue;
    }
    for (const act of acts) {
      const dbSheet = await prisma.storySheet.findFirst({
        where: { gameId: game.id, houseId: house.id, act },
      });
      if (!dbSheet) continue;
      const seedSheet = seed.storySheetByHouseAct.get(`${houseVar}|${act}`);
      if (!seedSheet) {
        console.warn(`[warn] story sheet for ${houseVar} act ${act} not in seed — skipping`);
        continue;
      }
      const f = findFieldValue(src, seedSheet.start, seedSheet.end, "content");
      if (!f) {
        console.warn(`[warn] story sheet ${houseVar} act ${act}: no content field — skipping`);
        continue;
      }
      const seedVal = decodeJsString(src, f.valueStart, f.valueEnd);
      const dbVal = dbSheet.content ?? "";
      if (seedVal === dbVal) continue;
      sheetsChanged++;
      console.log(`\n=== Story Sheet "${house.name}" act ${act} ===`);
      printFieldDiff("content", seedVal, dbVal);
      replacements.push({
        start: f.valueStart,
        end: f.valueEnd,
        newText: encodeJsString(dbVal),
        context: `storySheet(${houseVar},act=${act}).content`,
      });
    }
  }

  // ─── Mission consequences (act-break warning/lock/redistribute) ──
  let consequencesChanged = 0;
  // DB consequences whose source mission is in scope
  const sourceMissionIds = missions.map((m) => m.id);
  if (sourceMissionIds.length > 0) {
    const dbConsequences = await prisma.missionConsequence.findMany({
      where: { sourceMissionId: { in: sourceMissionIds } },
      include: {
        sourceMission: { select: { title: true } },
        targetMission: { select: { title: true } },
      },
    });
    for (const dc of dbConsequences) {
      const sourceVar = seed.missionVarByTitle.get(dc.sourceMission.title);
      if (!sourceVar) {
        console.warn(
          `[warn] consequence on "${dc.sourceMission.title}" — source mission var unknown in seed, skipping`
        );
        continue;
      }
      let targetVar: string | null = null;
      if (dc.targetMissionId) {
        if (!dc.targetMission) {
          console.warn(
            `[warn] consequence ${dc.id}: targetMissionId set but join missing, skipping`
          );
          continue;
        }
        targetVar = seed.missionVarByTitle.get(dc.targetMission.title) ?? null;
        if (!targetVar) {
          console.warn(
            `[warn] consequence on "${dc.sourceMission.title}" → "${dc.targetMission.title}" — target mission var unknown in seed, skipping`
          );
          continue;
        }
      }
      const key = `${sourceVar}|${targetVar ?? "null"}|${dc.type}`;
      const block = seed.missionConsequencesByKey.get(key);
      if (!block) {
        console.warn(
          `[warn] no seed block for consequence anchor ${key} (source="${dc.sourceMission.title}"${dc.targetMission ? `, target="${dc.targetMission.title}"` : ""}, type=${dc.type}) — skipping`
        );
        continue;
      }
      const f = findFieldValue(src, block.start, block.end, "message");
      if (!f) {
        console.warn(`[warn] consequence ${key}: no message field — skipping`);
        continue;
      }
      const seedVal = decodeJsString(src, f.valueStart, f.valueEnd);
      const dbVal = dc.message ?? "";
      if (seedVal === dbVal) continue;
      consequencesChanged++;
      const targetLabel = dc.targetMission ? ` → "${dc.targetMission.title}"` : "";
      console.log(
        `\n=== Consequence "${dc.sourceMission.title}"${targetLabel} type=${dc.type} ===`
      );
      printFieldDiff("message", seedVal, dbVal);
      replacements.push({
        start: f.valueStart,
        end: f.valueEnd,
        newText: encodeJsString(dbVal),
        context: `missionConsequence(${key}).message`,
      });
    }
  }

  // ─── Summary ─────────────────────────────────────────────────────
  console.log(
    `\n${replacements.length === 0 ? "no changes needed." : `${missionsChanged} missions, ${cardsChanged} cards, ${answersChanged} answers, ${sheetsChanged} sheets, ${consequencesChanged} consequences would change.`}`
  );

  if (replacements.length === 0) {
    await prisma.$disconnect();
    process.exit(0);
  }

  if (!args.apply) {
    console.log(`\nRun with --apply to commit.`);
    await prisma.$disconnect();
    process.exit(0);
  }

  // Apply: sort replacements by start descending and splice
  replacements.sort((a, b) => b.start - a.start);
  // Sanity: ensure non-overlapping
  for (let i = 1; i < replacements.length; i++) {
    if (replacements[i].end > replacements[i - 1].start) {
      console.error(
        `[error] overlapping replacements: ${replacements[i].context} and ${replacements[i - 1].context}`
      );
      process.exit(1);
    }
  }
  let out = src;
  for (const r of replacements) {
    out = out.slice(0, r.start) + r.newText + out.slice(r.end);
  }
  fs.writeFileSync(SEED_PATH, out, "utf8");
  console.log(`wrote ${replacements.length} changes to seed-qrians.ts`);
  await prisma.$disconnect();
}

/** Order-insensitive deep equality for objects (arrays still order-sensitive). */
function deepEqualKeyless(a: unknown, b: unknown): boolean {
  if (a === b) return true;
  if (Array.isArray(a) && Array.isArray(b)) {
    if (a.length !== b.length) return false;
    for (let i = 0; i < a.length; i++) {
      if (!deepEqualKeyless(a[i], b[i])) return false;
    }
    return true;
  }
  if (a && b && typeof a === "object" && typeof b === "object") {
    const ao = a as Record<string, unknown>;
    const bo = b as Record<string, unknown>;
    const aKeys = Object.keys(ao);
    const bKeys = Object.keys(bo);
    if (aKeys.length !== bKeys.length) return false;
    for (const k of aKeys) {
      if (!(k in bo)) return false;
      if (!deepEqualKeyless(ao[k], bo[k])) return false;
    }
    return true;
  }
  return false;
}

/** Format a fields array for the seed's style (bare keys, double-quoted strings). */
function formatFieldsArray(arr: unknown[]): string {
  const lines: string[] = ["["];
  for (let i = 0; i < arr.length; i++) {
    const item = arr[i] as Record<string, unknown>;
    lines.push(`        {`);
    const keys = ["prompt", "correctAnswer", "acceptAlternatives", "caseSensitive", "trimWhitespace"];
    for (const k of keys) {
      if (!(k in item)) continue;
      const v = item[k];
      let rendered: string;
      if (v === null) rendered = "null";
      else if (typeof v === "string") rendered = JSON.stringify(v);
      else if (typeof v === "boolean") rendered = String(v);
      else if (Array.isArray(v)) rendered = JSON.stringify(v);
      else rendered = JSON.stringify(v);
      lines.push(`          ${k}: ${rendered},`);
    }
    lines.push(`        }${i < arr.length - 1 ? "," : ","}`);
  }
  lines.push(`      ]`);
  return lines.join("\n");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
