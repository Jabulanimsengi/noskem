const ItemCardSkeleton = () => {
    return (
      <div className="bg-surface rounded-xl shadow-lg overflow-hidden flex flex-col">
        <div className="relative w-full h-48 bg-gray-200 animate-pulse"></div>
        <div className="p-4 flex flex-col flex-grow">
          <div className="h-6 w-3/4 bg-gray-200 rounded animate-pulse mb-3"></div>
          <div className="h-4 w-1/2 bg-gray-200 rounded animate-pulse"></div>
          <div className="flex-grow"></div>
          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="flex gap-2 justify-center">
              <div className="h-9 w-1/2 bg-gray-200 rounded-lg animate-pulse"></div>
              <div className="h-9 w-1/2 bg-gray-200 rounded-lg animate-pulse"></div>
            </div>
          </div>
        </div>
      </div>
    );
  };
  
  export default ItemCardSkeleton;