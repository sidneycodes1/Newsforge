import RunDetailScreen from "@/components/run/RunDetailScreen";

export default function RunPage({ params }: { params: { id: string } }) {
  return <RunDetailScreen id={params.id} />;
}
