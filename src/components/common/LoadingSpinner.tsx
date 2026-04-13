export default function LoadingSpinner() {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="relative w-16 h-16">
        <div className="absolute top-0 left-0 w-full h-full border-4 border-dark-card rounded-full"></div>
        <div className="absolute top-0 left-0 w-full h-full border-4 border-accent-green rounded-full border-t-transparent animate-spin"></div>
      </div>
    </div>
  );
}














