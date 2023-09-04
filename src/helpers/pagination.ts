import { QueryParamsModel } from '../models/PaginationQuery'

export const createPaginationQuery = (query: QueryParamsModel): QueryParamsModel => {
        const resultQuery: QueryParamsModel = {
            searchNameTerm: typeof query.searchNameTerm === 'string' ? query.searchNameTerm : null,
            sortBy: typeof query.sortBy === 'string' ? query.sortBy : 'createdAt',
            sortDirection: typeof query.sortDirection === 'string' ? query.sortDirection === 'asc' ? 'asc' : 'desc' : 'desc',
            pageNumber: Number.isNaN(query.pageNumber) || query.pageNumber === undefined ? 1 : +query.pageNumber,
            pageSize: Number.isNaN(query.pageSize) || query.pageSize === undefined ? 10 : +query.pageSize,
            searchEmailTerm: typeof query.searchEmailTerm === 'string' && query.searchEmailTerm !== undefined ? query.searchEmailTerm : null,
            searchLoginTerm: typeof query.searchLoginTerm === 'string' && query.searchLoginTerm !== undefined ? query.searchLoginTerm : null,
            banStatus: typeof query.banStatus === 'string' && query.banStatus !== undefined ? query.banStatus : null,
        }
        return resultQuery
}