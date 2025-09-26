export default function LoadingPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
      </div>
      <p className="text-center mt-4">Loading...</p>
    </div>
  );
}
