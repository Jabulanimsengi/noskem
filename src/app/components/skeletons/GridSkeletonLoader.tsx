import ItemCardSkeleton from "./ItemCardSkeleton";

interface GridSkeletonLoaderProps {
  count: number;
}

const GridSkeletonLoader = ({ count }: GridSkeletonLoaderProps) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
      {Array.from({ length: count }).map((_, index) => (
        <ItemCardSkeleton key={index} />
      ))}
    </div>
  );
};

export default GridSkeletonLoader;