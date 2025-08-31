export class TRBaseApiPaginationResponse {
	public offset: number;
	public limit: number;
	public size: number;
	public _links: {
		next?: string | null;
		prev?: string | null;
	};
}

export type TTRCustomField = boolean | string | number | number[] | any[];

export interface ITRPagination {
	limit: number;
	offset: number;
}

export interface ITRApiOptions {
	filters?: any;
	pagination?: ITRPagination;
}

export class TRApiOptions implements ITRApiOptions {
	public filters?: any;
	public pagination?: ITRPagination;
}
