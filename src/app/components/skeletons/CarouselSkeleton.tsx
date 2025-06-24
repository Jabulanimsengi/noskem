import ItemCardSkeleton from "./ItemCardSkeleton";

const CarouselSkeleton = () => {
    return (
        <div className="py-8">
            {/* Placeholder for the carousel title */}
            <div className="h-8 w-1/4 bg-gray-200 rounded-md mb-4 animate-pulse"></div>
            <div className="flex gap-6 overflow-hidden">
                {/* Show a few item card skeletons */}
                <div className="w-64 flex-shrink-0"><ItemCardSkeleton /></div>
                <div className="w-64 flex-shrink-0 hidden sm:block"><ItemCardSkeleton /></div>
                <div className="w-64 flex-shrink-0 hidden md:block"><ItemCardSkeleton /></div>
                <div className="w-64 flex-shrink-0 hidden lg:block"><ItemCardSkeleton /></div>
            </div>
        </div>
    );
};

export default CarouselSkeleton;