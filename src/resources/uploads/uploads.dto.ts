import { CloudUploadOption, OtpPurposeOptions } from "../../common/enums";
import { UserEntity } from "../../db/entites/user.entity";

export interface UploadFileDto {
	filename?: string;
	description?: string;
	upload_id?: string;
	file: Express.Multer.File;
	user_id: string;
}

export interface fileMetadataDto {
	file_name: string;
	file_description?: string;
	file_type: string;
	file_format: string;
	file_size: number;
	user_id: string;
	url: string;
	storage_cloud?: CloudUploadOption;
}

export interface PaginationDto {
	limit: number;
	page: number;
	filter?: any;
}
