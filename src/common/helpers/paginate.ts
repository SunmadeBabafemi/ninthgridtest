import knex from "../../db/knex";

export interface PaginatePayload {
	table_name: string;
	limit: number;
	page: number;
	filter?: any;
}

export interface PaginateMongoPayload {
	limit: number;
	page: number;
	data?: any;
	selectedFields?: any[];
	sortFilter?: any[];
	populate?: string;
	populateObj?: any;
	populateObj1?: any;
	populateObj2?: any;
}

export const paginateRecordsMySQL = async (payload: PaginatePayload) => {
	try {
		let { table_name, limit = 10, page = 1, filter = {} } = payload;
		const maxLimit = Math.min(limit, 100);
		const offset = (page - 1) * maxLimit;

		const baseQuery = knex(table_name);

		if (filter && Object.keys(filter).length > 0) {
			baseQuery.where(function () {
				Object.entries(filter).forEach(([column, value]) => {
					console.log("🚀 ~ Object.entries ~ [column, value]:", [
						column,
						value,
					]);
					this.orWhereILike(column, `%${value}%`);
				});
			});
		}

		const countQuery = baseQuery.clone();

		const [{ total }] = await countQuery.count("* as total");

		const data = await baseQuery
			.clone()
			.select("*")
			.orderBy("created_at", "desc")
			.limit(maxLimit)
			.offset(offset);

		const totalCount = Number(total);

		return {
			data,
			pagination: {
				pageSize: maxLimit,
				totalCount,
				pageCount: Math.ceil(totalCount / maxLimit),
				currentPage: page,
				hasNext: page * maxLimit < totalCount,
			},
		};
	} catch (error) {
		console.error("🚀 ~ paginateRecordsMySQL ~ error:", error);
		throw error;
	}
};

export const paginateRecordsMongoDB = async (
	model: any,
	payload: PaginateMongoPayload
) => {
	try {
		const {
			limit: specifiedLimit = 10,
			page,
			data = {},
			selectedFields,
			sortFilter = [["created_at", -1]],
			populate,
			populateObj,
			populateObj1,
			populateObj2,
		} = payload;
		const limit = Math.min(specifiedLimit, 100); // restrict limit to 100
		const offset = 0 + (Math.abs(page || 1) - 1) * limit;

		const modelData = await model.find({ ...data }).countDocuments();

		const result = await model
			.find({ ...data })
			.populate(populate ? populate : "")
			.populate(populateObj ? populateObj : "")
			.populate(populateObj ? populateObj : "")
			.populate(populateObj1 ? populateObj1 : "")
			.populate(populateObj2 ? populateObj2 : "")
			.select(selectedFields ? selectedFields : "")
			.skip(offset)
			.limit(limit)
			.sort(sortFilter);

		const altNoResult: any[] = [];
		return {
			data: Number(modelData) > 0 ? result : altNoResult,
			pagination: {
				pageSize: limit, //number of content yousee per page
				totalCount: modelData, //Total number of records
				pageCount: Math.ceil(modelData / limit), //How many pages will be available
				currentPage: +page, //if you're on page 1 or 18...
				hasNext: page * limit < modelData,
			},
		};
	} catch (err) {
		console.log(err);
	}
};
