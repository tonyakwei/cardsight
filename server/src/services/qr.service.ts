import QRCode from "qrcode";

// QR codes always encode the production domain — printed cards must work on
// any phone, regardless of which environment generated them. Override with
// QR_DOMAIN env if needed (e.g. dedicated alt-domain for a one-off event).
const DOMAIN = process.env.QR_DOMAIN || "https://alltogethernow.land";

export async function generateQRCode(cardId: string): Promise<Buffer> {
  const url = `${DOMAIN}/c/${cardId}`;
  return QRCode.toBuffer(url, {
    type: "png",
    width: 400,
    margin: 2,
    color: {
      dark: "#000000",
      light: "#ffffff",
    },
    errorCorrectionLevel: "M",
  });
}

export async function generateMissionQRCode(missionId: string): Promise<Buffer> {
  const url = `${DOMAIN}/m/${missionId}`;
  return QRCode.toBuffer(url, {
    type: "png",
    width: 400,
    margin: 2,
    color: {
      dark: "#000000",
      light: "#00000000", // transparent background
    },
    errorCorrectionLevel: "M",
  });
}
