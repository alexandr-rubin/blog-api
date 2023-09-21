export class QueryParamsModel {
  banStatus?: string
  searchNameTerm?: string
  searchLoginTerm?: string
  searchEmailTerm?: string
  sortBy!: string
  sortDirection!: "asc" | "desc"
  pageNumber!: number
  pageSize!: number
}