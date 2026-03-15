/**
 * Pure helper functions for admin order pagination and filtering.
 * These extract the core logic from the API route for testability.
 */

export interface OrderSummary {
  orderCode: string;
  status: string;
  createdAt: Date;
}

export interface PaginationResult<T> {
  orders: T[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

const DEFAULT_PAGE_SIZE = 20;

/**
 * Paginate and sort orders by createdAt descending.
 */
export function paginateOrders<T extends { createdAt: Date }>(
  orders: T[],
  page: number,
  pageSize: number = DEFAULT_PAGE_SIZE
): PaginationResult<T> {
  const safePage = Math.max(1, page);
  const safePageSize = Math.max(1, pageSize);

  const sorted = [...orders].sort(
    (a, b) => b.createdAt.getTime() - a.createdAt.getTime()
  );

  const totalCount = sorted.length;
  const totalPages = Math.ceil(totalCount / safePageSize) || 0;
  const start = (safePage - 1) * safePageSize;
  const sliced = sorted.slice(start, start + safePageSize);

  return {
    orders: sliced,
    totalCount,
    page: safePage,
    pageSize: safePageSize,
    totalPages,
  };
}

/**
 * Filter orders by search text (orderCode contains) and status.
 */
export function filterOrders<T extends OrderSummary>(
  orders: T[],
  search: string,
  status: string
): T[] {
  return orders.filter((order) => {
    if (search && !order.orderCode.includes(search)) {
      return false;
    }
    if (status && status !== "All" && order.status !== status) {
      return false;
    }
    return true;
  });
}
