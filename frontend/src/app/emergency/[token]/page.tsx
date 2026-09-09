import PublicEmergencyClient from "./EmergencyClient";

// Enable static export for dynamic route in Next.js
export function generateStaticParams() {
  return [
    { token: "preview" },
  ];
}

export default function PublicEmergencyPage({
  params,
}: {
  params: { token: string };
}) {
  return <PublicEmergencyClient initialToken={params.token} />;
}
