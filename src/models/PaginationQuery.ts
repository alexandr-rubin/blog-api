export class QueryParamsModel {
  banStatus?: string
  searchNameTerm?: string
  searchLoginTerm?: string
  searchEmailTerm?: string
  sortBy!: string
  sortDirection!: string
  pageNumber!: number
  pageSize!: number
}