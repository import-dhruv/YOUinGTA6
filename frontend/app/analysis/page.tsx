import { AnalysisView } from "@/components/AnalysisView";

export default async function AnalysisPage({
  searchParams,
}: {
  searchParams: Promise<{ username?: string; demo?: string }>;
}) {
  const params = await searchParams;
  return <AnalysisView username={params.username || "you"} demo={params.demo === "1"} />;
}
