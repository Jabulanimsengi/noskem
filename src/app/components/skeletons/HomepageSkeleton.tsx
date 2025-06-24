import GridSkeletonLoader from "./GridSkeletonLoader";
import HeroSkeleton from "./HeroSkeleton";
import CarouselSkeleton from "./CarouselSkeleton";

export default function HomepageSkeleton() {
  return (
    <>
      <HeroSkeleton />
      <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="pt-8 mt-8">
            <CarouselSkeleton />
        </div>
        <div className="border-t pt-8 mt-8">
            <CarouselSkeleton />
        </div>
        <div className="py-16 border-t mt-8">
            <div className="text-center mb-8">
                <div className="h-10 w-1/3 bg-gray-200 rounded-lg mx-auto animate-pulse"></div>
                <div className="h-6 w-1/2 bg-gray-200 rounded-lg mx-auto mt-2 animate-pulse"></div>
            </div>
            {/* Placeholder for filters */}
            <div className="h-24 w-full bg-gray-200 rounded-xl mb-12 animate-pulse"></div>
            <GridSkeletonLoader count={8} />
        </div>
      </div>
    </>
  );
}