import { fileMetadataDto, PaginationDto, UploadFileDto } from "./uploads.dto";
import {
	CloudUploadOption,
	DatabaseChoice,
	StatusMessages,
} from "../../common/enums";
import ResponseData from "../../common/interfaces/responseData.interface";
import { HttpCodes } from "../../common/constants/httpcode";
import { FileModel } from "../../db/models";

import { v4 as uuid } from "uuid";
import { Knex } from "knex";
import envConfig from "../../../env.config";
import { tableNames } from "../../common/constants";

import CloudService from "../../config/cloud.service";
import {
	PaginateMongoPayload,
	PaginatePayload,
	paginateRecordsMongoDB,
	paginateRecordsMySQL,
} from "../../common/helpers/paginate";

class UploadService {
	constructor(
		private readonly knex: Knex,
		private readonly cloudService: CloudService
	) {}

	public async uploadFile(payload: UploadFileDto): Promise<ResponseData> {
		let responseData: ResponseData;
		try {
			const { file, filename, description, upload_id, user_id } = payload;
			let uploadProcess: ResponseData;

			const file_format = file.mimetype.split("/")[1];
			const file_type = file.mimetype.split("/")[0];
			let url: string;
			uploadProcess = await this.cloudService.GCPUpload(file, "", upload_id);
			url = uploadProcess.data;

			const metadata: fileMetadataDto = {
				file_name: filename ? filename : file.originalname,
				...(description && { file_description: description }),
				file_type,
				file_format,
				file_size: file.size,
				user_id,
				url: url,
				storage_cloud: envConfig.CLOUD_UPLOAD_OPTION as CloudUploadOption,
			};
			switch (envConfig.DATABASE_CHOICE) {
				case DatabaseChoice.MONGODB:
					responseData = await this.uploadFileMongoDB(metadata);
					break;
				default:
					responseData = await this.uploadFileMySQL(metadata);
					break;
			}
			return responseData;
		} catch (error: any) {
			console.error("🚀 ~ UserService ~ error:", error);
			responseData = {
				status: StatusMessages.error,
				code: error?.response?.statusCode || HttpCodes.HTTP_SERVER_ERROR,
				message: error.toString(),
			};
			return responseData;
		}
	}
	private async uploadFileMySQL(
		payload: fileMetadataDto
	): Promise<ResponseData> {
		let responseData: ResponseData = {
			status: StatusMessages.success,
			code: HttpCodes.HTTP_OK,
			message: "file uploaded successfully",
		};
		try {
			const file_id = uuid();
			await this.knex(tableNames.files).insert({
				id: file_id,
				file_name: payload.file_name,
				file_description: payload.file_description,
				file_type: payload.file_type,
				file_format: payload.file_format,
				file_size: payload.file_size,
				user_id: payload.user_id,
				url: payload.url,
				storage_cloud: payload.storage_cloud,
			});

			const file = await this.knex(tableNames.files)
				.where("id", file_id)
				.select("*")
				.first();

			responseData.data = file;

			return responseData;
		} catch (error: any) {
			console.error("🚀 ~ uploadFileMySQL ~ error:", error);
			responseData = {
				status: StatusMessages.error,
				code: error?.response?.statusCode || HttpCodes.HTTP_SERVER_ERROR,
				message: error.toString(),
			};
			return responseData;
		}
	}

	private async uploadFileMongoDB(
		payload: fileMetadataDto
	): Promise<ResponseData> {
		let responseData: ResponseData = {
			status: StatusMessages.success,
			code: HttpCodes.HTTP_OK,
			message: "File Uploaded Successfully",
		};
		try {
			const file = await FileModel.create({
				file_name: payload.file_name,
				file_description: payload.file_description,
				file_type: payload.file_type,
				file_format: payload.file_format,
				file_size: payload.file_size,
				storage_cloud: payload.storage_cloud,
				user_id: payload.user_id,
				url: payload.url,
			});
			responseData.data = file;
			return responseData;
		} catch (error: any) {
			console.error("🚀 ~ createUserMySQL ~ error:", error);
			responseData = {
				status: StatusMessages.error,
				code: error?.response?.statusCode || HttpCodes.HTTP_SERVER_ERROR,
				message: error.toString(),
			};
			return responseData;
		}
	}

	public async fetchFiles(paylaod: PaginationDto, user: any) {
		let responseData: ResponseData;
		try {
			switch (envConfig.DATABASE_CHOICE) {
				case DatabaseChoice.MONGODB:
					responseData = await this.fetchFilesMongoDB(paylaod, user);
					break;
				default:
					responseData = await this.fetchFilesMySql(paylaod, user);
					break;
			}
			return responseData;
		} catch (error: any) {
			console.error("🚀 ~ fetchFiles ~ error:", error);
			responseData = {
				status: StatusMessages.error,
				code: HttpCodes.HTTP_SERVER_ERROR,
				message: error.toString(),
			};
			return responseData;
		}
	}

	private async fetchFilesMySql(
		payload: PaginationDto,
		user: any
	): Promise<ResponseData> {
		let responseData: ResponseData = {
			status: StatusMessages.success,
			code: HttpCodes.HTTP_OK,
			message: "Files fetched successfully",
		};
		try {
			const { limit, page } = payload;
			const paginatePayload: PaginatePayload = {
				table_name: tableNames.files,
				limit,
				page,
				filter: {
					user_id: user.id,
				},
			};

			const records = await paginateRecordsMySQL(paginatePayload);
			responseData.data = records;
			return responseData;
		} catch (error: any) {
			console.error("🚀 ~ fetchFiles ~ error:", error);
			responseData = {
				status: StatusMessages.error,
				code: HttpCodes.HTTP_SERVER_ERROR,
				message: error.toString(),
			};
			return responseData;
		}
	}

	private async fetchFilesMongoDB(
		payload: PaginationDto,
		user: any
	): Promise<ResponseData> {
		let responseData: ResponseData = {
			status: StatusMessages.success,
			code: HttpCodes.HTTP_OK,
			message: "Files fetched successfully",
		};
		try {
			const { limit, page } = payload;
			const paginatePayload: PaginateMongoPayload = {
				limit,
				page,
				data: {
					user_id: user._id,
				},
			};

			const records = await paginateRecordsMongoDB(FileModel, paginatePayload);
			responseData.data = records;
			return responseData;
		} catch (error: any) {
			console.error("🚀 ~ fetchFiles ~ error:", error);
			responseData = {
				status: StatusMessages.error,
				code: HttpCodes.HTTP_SERVER_ERROR,
				message: error.toString(),
			};
			return responseData;
		}
	}

	public async deleteFile(file_id: string) {
		let responseData: ResponseData;
		try {
			switch (envConfig.DATABASE_CHOICE) {
				case DatabaseChoice.MONGODB:
					responseData = await this.deleteFileMyongoDB(file_id);
					break;
				default:
					responseData = await this.deleteFileMySQL(file_id);
					break;
			}
			return responseData;
		} catch (error: any) {
			console.error("🚀 ~ fetchFiles ~ error:", error);
			responseData = {
				status: StatusMessages.error,
				code: HttpCodes.HTTP_SERVER_ERROR,
				message: error.toString(),
			};
			return responseData;
		}
	}
	private async deleteFileMySQL(file_id: string): Promise<ResponseData> {
		let responseData: ResponseData = {
			status: StatusMessages.success,
			code: HttpCodes.HTTP_ACCEPTED,
			message: "File deleted successfully",
		};
		try {
			const file = await this.knex(tableNames.files)
				.where("id", file_id)
				.select("*")
				.first();
			if (!file) {
				return {
					status: StatusMessages.error,
					code: HttpCodes.HTTP_NOT_FOUND,
					message: "File Not Found",
				};
			}
			this.cloudService.deleteFiles([file.url]);
			await this.knex(tableNames.files).delete().where("id", file_id);
			return responseData;
		} catch (error: any) {
			console.error("🚀 ~ fetchFiles ~ error:", error);
			responseData = {
				status: StatusMessages.error,
				code: HttpCodes.HTTP_SERVER_ERROR,
				message: error.toString(),
			};
			return responseData;
		}
	}

	private async deleteFileMyongoDB(file_id: string): Promise<ResponseData> {
		let responseData: ResponseData = {
			status: StatusMessages.success,
			code: HttpCodes.HTTP_ACCEPTED,
			message: "File deleted successfully",
		};
		try {
			const file = await FileModel.findById(file_id);
			if (!file) {
				return {
					status: StatusMessages.error,
					code: HttpCodes.HTTP_NOT_FOUND,
					message: "File Not Found",
				};
			}
			this.cloudService.deleteFiles([file.url]);
			await FileModel.deleteOne({ id: file_id });
			return responseData;
		} catch (error: any) {
			console.error("🚀 ~ fetchFiles ~ error:", error);
			responseData = {
				status: StatusMessages.error,
				code: HttpCodes.HTTP_SERVER_ERROR,
				message: error.toString(),
			};
			return responseData;
		}
	}
}

export default UploadService;
