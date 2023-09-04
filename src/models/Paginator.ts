import { QueryParamsModel } from "./PaginationQuery"

export class Paginator<T> {
  pagesCount: number
  page: number
  pageSize: number
  totalCount: number
  items: T[]

  public static createPaginationResult = <T>(count: number, query: QueryParamsModel, items: T[]): Paginator<T> => {
    const result: Paginator<T> = {
        pagesCount: Math.ceil(count / query.pageSize),
        page: query.pageNumber,
        pageSize: query.pageSize,
        totalCount: count,
        items: items
    }

    return result
  }
}