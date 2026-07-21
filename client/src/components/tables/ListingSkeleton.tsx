import { Skeleton } from "@/components/ui/skeleton";

interface ListingSkeletonProps {
  columns?: number;
  rows?: number;
}

export function ListingSkeleton({
  columns = 4,
  rows = 6,
}: ListingSkeletonProps) {
  return (
    <div className="overflow-hidden rounded-lg border bg-white">
      <table className="w-full">
        <thead className="border-b bg-gray-50">
          <tr>
            {Array.from({ length: columns }).map((_, index) => (
              <th key={index} className="px-4 py-4">
                <Skeleton className="h-4 w-24" />
              </th>
            ))}
          </tr>
        </thead>

        <tbody>
          {Array.from({ length: rows }).map((_, rowIndex) => (
            <tr key={rowIndex} className="border-b last:border-0">
              {Array.from({ length: columns }).map((_, columnIndex) => (
                <td key={columnIndex} className="px-4 py-4">
                  <Skeleton
                    className={
                      columnIndex === 0
                        ? "h-5 w-32"
                        : columnIndex === columns - 1
                          ? "h-6 w-20 rounded-full"
                          : "h-5 w-40"
                    }
                  />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}