export const TRIBUNAL_DURATION_MS = 6 * 60 * 1000;

export interface TribunalMeeting {
  label: string;
  teams: [string, string];
}

export interface TribunalConfig {
  title: string;
  subtitle: string;
  meetings: TribunalMeeting[];
}

export interface ArtifactImageButton {
  artifactName: string;
  label: string;
  imageUrl: string;
}

export const TRIBUNALS: TribunalConfig[] = [
  {
    title: "Tribunal 1",
    subtitle: "Two meetings at once",
    meetings: [
      { label: "Meeting A", teams: ["Politics", "Culture"] },
      { label: "Meeting B", teams: ["Science", "Spirituality"] },
    ],
  },
  {
    title: "Tribunal 2",
    subtitle: "Two meetings at once",
    meetings: [
      { label: "Meeting A", teams: ["Politics", "Spirituality"] },
      { label: "Meeting B", teams: ["Science", "Culture"] },
    ],
  },
  {
    title: "Tribunal 3",
    subtitle: "Two meetings at once",
    meetings: [
      { label: "Meeting A", teams: ["Politics", "Science"] },
      { label: "Meeting B", teams: ["Culture", "Spirituality"] },
    ],
  },
];

const ASSET_BASE = "/assets/temple-ending";

export const ARTIFACT_IMAGES: ArtifactImageButton[] = [
  {
    artifactName: "Acolyte's Abacus",
    label: "GOOD",
    imageUrl: `${ASSET_BASE}/acolytes-abacus-d-diversity-classroom.png`,
  },
  {
    artifactName: "Before-and-After Council Tablets",
    label: "GOOD",
    imageUrl: `${ASSET_BASE}/before-after-council-tablets-a-civic-deliberation.png`,
  },
  {
    artifactName: "Before-and-After Council Tablets",
    label: "BAD",
    imageUrl: `${ASSET_BASE}/before-after-council-tablets-b-filtered-anger.png`,
  },
  {
    artifactName: "Bound Hymn Books of Shared Peace",
    label: "GOOD",
    imageUrl: `${ASSET_BASE}/bound-hymn-books-a-hospital-chapel.png`,
  },
  {
    artifactName: "Bound Hymn Books of Shared Peace",
    label: "BAD",
    imageUrl: `${ASSET_BASE}/bound-hymn-books-b-institutional-quiet.png`,
  },
  {
    artifactName: "Bundle of Purple Corn Kernels",
    label: "IMAGE 1",
    imageUrl: `${ASSET_BASE}/purple-corn-a-arid-relief-fields.png`,
  },
  {
    artifactName: "Bundle of Purple Corn Kernels",
    label: "IMAGE 2",
    imageUrl: `${ASSET_BASE}/purple-corn-b-purple-bread-campaign.png`,
  },
  {
    artifactName: "Emotion Purging Potion",
    label: "GOOD",
    imageUrl: `${ASSET_BASE}/emotion-purging-potion-c-medical-study-no-brains.png`,
  },
  {
    artifactName: "Emotion Purging Potion",
    label: "BAD",
    imageUrl: `${ASSET_BASE}/emotion-purging-potion-a-courthouse-clinic.png`,
  },
  {
    artifactName: "First Authority Survey Report",
    label: "GOOD 1",
    imageUrl: `${ASSET_BASE}/first-authority-survey-report-a-relief-briefing.png`,
  },
  {
    artifactName: "First Authority Survey Report",
    label: "GOOD 2",
    imageUrl: `${ASSET_BASE}/first-authority-survey-report-c-diversity-relief-briefing.png`,
  },
  {
    artifactName: "First Authority Survey Report",
    label: "BAD",
    imageUrl: `${ASSET_BASE}/first-authority-survey-report-b-institutional-hunt.png`,
  },
  {
    artifactName: "Harmonizing Reed",
    label: "BAD",
    imageUrl: `${ASSET_BASE}/harmonizing-reed-d-grim-institution.png`,
  },
  {
    artifactName: "Ledger of Authority Decisions",
    label: "GOOD",
    imageUrl: `${ASSET_BASE}/ledger-authority-decisions-a-public-archive.png`,
  },
  {
    artifactName: "Ledger of Authority Decisions",
    label: "BAD",
    imageUrl: `${ASSET_BASE}/ledger-authority-decisions-b-strategy-room.png`,
  },
  {
    artifactName: "Master Source Data Plate",
    label: "IMAGE 1",
    imageUrl: `${ASSET_BASE}/master-source-data-plate-a-calibration-lab.png`,
  },
  {
    artifactName: "Master Source Data Plate",
    label: "IMAGE 2",
    imageUrl: `${ASSET_BASE}/master-source-data-plate-b-coordinate-room.png`,
  },
  {
    artifactName: "Rolling Pebble Computer",
    label: "IMAGE 1",
    imageUrl: `${ASSET_BASE}/rolling-pebble-computer-a-museum-exhibit.png`,
  },
  {
    artifactName: "Schematics of the Temple",
    label: "BAD",
    imageUrl: `${ASSET_BASE}/schematics-temple-b-restricted-dig.png`,
  },
  {
    artifactName: "Soul Compass",
    label: "GOOD",
    imageUrl: `${ASSET_BASE}/soul-compass-c-diverse-school-sorting.png`,
  },
  {
    artifactName: "Source-Forged Arrowhead",
    label: "IMAGE 1",
    imageUrl: `${ASSET_BASE}/source-forged-arrowhead-a-arms-control-tv.png`,
  },
  {
    artifactName: "Starline Coordinate Plate",
    label: "IMAGE 1",
    imageUrl: `${ASSET_BASE}/starline-coordinate-plate-a-observatory.png`,
  },
  {
    artifactName: "Stored Vial of Lovewater",
    label: "GOOD",
    imageUrl: `${ASSET_BASE}/stored-vial-lovewater-a-counseling-room.png`,
  },
  {
    artifactName: "Stored Vial of Lovewater",
    label: "BAD",
    imageUrl: `${ASSET_BASE}/stored-vial-lovewater-b-compatibility-center.png`,
  },
  {
    artifactName: "Tablet of Eternal Mercy",
    label: "GOOD",
    imageUrl: `${ASSET_BASE}/tablet-eternal-mercy-b-diversity-civic-care.png`,
  },
  {
    artifactName: "Thirdapy Guides for Masses",
    label: "IMAGE 1",
    imageUrl: `${ASSET_BASE}/thirdapy-guides-c-family-campaign.png`,
  },
  {
    artifactName: "Thirdapy Guides for Masses",
    label: "IMAGE 2",
    imageUrl: `${ASSET_BASE}/thirdapy-guides-d-diversity-households.png`,
  },
  {
    artifactName: "Vial of Distilled Source",
    label: "IMAGE 1",
    imageUrl: `${ASSET_BASE}/vial-distilled-source-c-arms-control-tv.png`,
  },
  {
    artifactName: "Vial of Distilled Source",
    label: "IMAGE 2",
    imageUrl: `${ASSET_BASE}/vial-distilled-source-d-science-tv.png`,
  },
];
