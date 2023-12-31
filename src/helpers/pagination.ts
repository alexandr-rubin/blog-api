import { QueryParamsModel } from '../models/PaginationQuery'
import { UserBanStatuses } from './userBanStatuses'

export const createPaginationQuery = (query: QueryParamsModel): QueryParamsModel => {
        const resultQuery: QueryParamsModel = {
            searchNameTerm: typeof query.searchNameTerm === 'string' ? query.searchNameTerm : null,
            sortBy: typeof query.sortBy === 'string' ? query.sortBy : 'createdAt',
            sortDirection: typeof query.sortDirection === 'string' ? query.sortDirection === 'asc' ? 'asc' : 'desc' : 'desc',
            pageNumber: Number.isNaN(query.pageNumber) || query.pageNumber === undefined ? 1 : +query.pageNumber,
            pageSize: Number.isNaN(query.pageSize) || query.pageSize === undefined ? 10 : +query.pageSize,
            searchEmailTerm: typeof query.searchEmailTerm === 'string' && query.searchEmailTerm !== undefined ? query.searchEmailTerm : null,
            searchLoginTerm: typeof query.searchLoginTerm === 'string' && query.searchLoginTerm !== undefined ? query.searchLoginTerm : null,
            banStatus: typeof query.banStatus === 'string' && query.banStatus !== undefined && Object.values(UserBanStatuses).includes(query.banStatus as UserBanStatuses) ? query.banStatus : UserBanStatuses.All,
            bodySearchTerm: typeof query.bodySearchTerm === 'string' ? query.bodySearchTerm : null,
            publishedStatus: typeof query.publishedStatus === 'string' ? (query.publishedStatus === 'all' ? 'all' : query.publishedStatus === 'published' ? 'published' : 'notPublished') : 'all',
            sort: typeof query.sort === 'string' ||  Array.isArray(query.sort) ? query.sort : ['avgScores desc','sumScore desc']
        }
        return resultQuery
}