export default function Loading() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-lavender-soft">
      <div className="flex flex-col items-center gap-4">
        <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-gray-600">Loading admin panel...</p>
      </div>
    </div>
  );
}

