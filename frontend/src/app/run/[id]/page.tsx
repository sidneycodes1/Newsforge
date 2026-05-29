import RunDetailScreen from "@frontend/components/run/RunDetailScreen";

export default function RunPage({ params }: { params: { id: string } }) {
  return (
    <div className="min-h-screen overflow-x-hidden">
      <RunDetailScreen id={params.id} />
    </div>
  );
}
