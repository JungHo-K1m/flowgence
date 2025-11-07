export default function LoadingPage() {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="flex flex-col items-center gap-4">
        <div
          className="animate-spin rounded-full h-16 w-16 border-4 border-t-transparent"
          style={{ borderColor: "#6366F1", borderTopColor: "transparent" }}
        />
      </div>
    </div>
  );
}
