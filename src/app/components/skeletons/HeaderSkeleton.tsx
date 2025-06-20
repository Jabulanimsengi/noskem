export default function HeaderSkeleton() {
  return (
    <header className="bg-surface shadow-md sticky top-0 z-40">
      <nav className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          
          {/* Left side placeholder */}
          <div className="flex items-center gap-8">
            <div className="h-8 w-36 bg-gray-200 rounded-md animate-pulse"></div>
          </div>
          
          {/* Center placeholder */}
          <div className="hidden lg:flex flex-1 justify-center px-8">
              <div className="h-12 w-full max-w-xl bg-gray-200 rounded-full animate-pulse"></div>
          </div>

          {/* Right side placeholder */}
          <div className="hidden lg:flex items-center gap-4">
            <div className="flex items-center gap-6">
                <div className="h-5 w-20 bg-gray-200 rounded-md animate-pulse"></div>
                <div className="h-5 w-24 bg-gray-200 rounded-md animate-pulse"></div>
            </div>
            <div className="h-10 w-40 bg-gray-200 rounded-lg animate-pulse"></div>
          </div>

          {/* Mobile menu placeholder */}
          <div className="lg:hidden">
            <div className="h-8 w-8 bg-gray-200 rounded-md animate-pulse"></div>
          </div>
        </div>
      </nav>
    </header>
  );
}