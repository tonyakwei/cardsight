import QRCode from "qrcode";

const DOMAIN = process.env.DOMAIN || "http://localhost:5173";

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
