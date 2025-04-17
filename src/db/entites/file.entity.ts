import { CloudUploadOption } from "../../common/enums";

export interface FileEntity {
	id: string;
	file_name?: string;
	file_description?: string;
	file_type?: string;
	file_format?: string;
	file_size?: number;
	user_id: string;
	url: string;
	deleted?: boolean;
	storage_cloud?: string;
	created_at?: Date;
	updated_at?: Date;
}
