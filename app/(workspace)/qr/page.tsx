import { qrMetadata } from "@/config/seo";
import { QrGeneratorView } from "@/features/qr/components/QrGeneratorView";

export const metadata = qrMetadata;

export default function QrPage() {
  return <QrGeneratorView />;
}
