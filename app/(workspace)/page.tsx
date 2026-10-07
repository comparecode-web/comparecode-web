import { HomePage } from "@/components/home/HomePage";
import { JsonLd } from "@/components/seo/JsonLd";
import { homeMetadata, softwareApplicationJsonLd } from "@/config/seo";

export const metadata = homeMetadata;

export default function Home() {
  return (
    <>
      <JsonLd data={softwareApplicationJsonLd} />
      <HomePage />
    </>
  );
}
