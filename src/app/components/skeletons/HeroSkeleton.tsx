const HeroSkeleton = () => {
    return (
      <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 mt-8">
        <div className="relative w-full h-[328px] overflow-hidden rounded-2xl bg-gray-200 animate-pulse">
            <div className="absolute inset-0 bg-black/10"></div>
        </div>
      </div>
    );
};

export default HeroSkeleton;