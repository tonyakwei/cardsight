import { useParams, useNavigate } from "react-router";
import { Text, Stack, Paper, Group, Button } from "@mantine/core";

export function PrintCenter() {
  const { gameId } = useParams<{ gameId: string }>();
  const navigate = useNavigate();

  const printOptions = [
    {
      title: "Story Sheets",
      description: "Printable narrative documents per house per act, with linked mission lists.",
      path: `/admin/games/${gameId}/story-sheets/print`,
      color: "cyan",
    },
    {
      title: "Consequence Cards",
      description: "Themed consequence cards for act breaks (2-3 per page). Switchable themes: Space, Explorer.",
      path: `/admin/games/${gameId}/act-break/print`,
      color: "yellow",
    },
    {
      title: "Item Catalog Sheets",
      description: "Universal handout with all 54 card glyphs organized by color. Players find their card's glyph and write the item classification. Print one per team per act.",
      path: `/admin/games/${gameId}/print/artifact-catalog`,
      color: "orange",
    },
    {
      title: "QRian Glyph Codex",
      description: "Player-facing translation log. Glyphs appear in scrambled order with blanks underneath; players fill in the English letter as they find rosetta cards. Print one per table.",
      path: `/admin/games/${gameId}/print/glyph-codex`,
      color: "grape",
    },
    {
      title: "Welcome Placard",
      description: "Three stone-tablet welcome placards on a single letter sheet. Print, cut along the dotted lines, hand one to each team at the door.",
      path: `/admin/games/${gameId}/print/welcome-placard`,
      color: "yellow",
    },
    {
      title: "Powder of the Quiet Bed (Grid)",
      description: "10×12 flower grid for Drake's Act 2 mission. Numbered 🌸/🪻/🥀 trace QRian B-Y-E when connected; the rest are 🌺/🌼 decoys. Print one per Drake team.",
      path: `/admin/games/${gameId}/print/quiet-bed`,
      color: "pink",
    },
    {
      title: "Hanging Garden (Canopy Map)",
      description: "10×12 canopy grid for Jones's Act 2 mission. Three articulation classes — Closers/Openers/Carriers — trace QRian J-A-W when connected; mouth-neutral faces are decoys. Print one per Jones team.",
      path: `/admin/games/${gameId}/print/canopy-map`,
      color: "violet",
    },
    {
      title: "Reckoning Floor (Pebble Map)",
      description: "10×12 pebble grid for Croft's Act 2 mission. Class digits 3/5/7/9 fill the cells of T-I-M-E as sets (not sequences); decoy patterns use other digits. Print one per Croft team.",
      path: `/admin/games/${gameId}/print/reckoning-floor`,
      color: "teal",
    },
    {
      title: "Finale Pads",
      description: "Three letter-portrait pads — one per major outcome (Destroy / Recontain / Open). Lay them on the table at the Reckoning; players place cards on the pad they're advocating for and move them as the room argues.",
      path: `/admin/games/${gameId}/print/finale-pads`,
      color: "red",
    },
    {
      title: "Act 3 Cards (History + Clauses)",
      description: "3×5″ portrait cards, 3-up on letter landscape. 12 history fragments + 12 settlement clauses, themed per house (Drake / Jones / Croft). Print on cardstock; affix programmable NFC tags on the back to keep timeline verification.",
      path: `/admin/games/${gameId}/print/act3-cards`,
      color: "indigo",
    },
  ];

  return (
    <div>
      <Text size="xl" fw={700} mb="md">Print Center</Text>
      <Text size="sm" c="dimmed" mb="lg">
        Generate printable materials for your game.
      </Text>

      <Stack gap="md">
        {printOptions.map((opt) => (
          <Paper
            key={opt.title}
            p="lg"
            withBorder
            onClick={() => navigate(opt.path)}
            style={{ cursor: "pointer" }}
            className="print-option-row"
          >
            <Group justify="space-between" wrap="nowrap">
              <div>
                <Text size="md" fw={600}>{opt.title}</Text>
                <Text size="sm" c="dimmed" mt={4}>{opt.description}</Text>
              </div>
              <Button
                variant="light"
                color={opt.color}
                onClick={(e) => {
                  e.stopPropagation();
                  navigate(opt.path);
                }}
              >
                Open
              </Button>
            </Group>
          </Paper>
        ))}
      </Stack>

      <style>{`
        .print-option-row { transition: border-color 0.12s ease, background 0.12s ease; }
        .print-option-row:hover {
          border-color: var(--mantine-color-yellow-6);
          background: rgba(255, 200, 0, 0.04);
        }
      `}</style>
    </div>
  );
}
