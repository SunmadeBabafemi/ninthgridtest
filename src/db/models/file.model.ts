import mongoose, { Schema, model } from "mongoose";
import { CloudUploadOption } from "../../common/enums";

const FileSchema = new Schema(
	{
		file_name: {
			type: String,
			trim: true,
		},
		file_description: {
			type: String,
			trim: true,
		},
		file_type: {
			type: String,
			trim: true,
		},
		file_format: {
			type: String,
			trim: true,
		},
		file_size: {
			type: Number,
		},
		user_id: {
			type: mongoose.Types.ObjectId,
			ref: "Users",
		},
		url: {
			type: String,
			required: true,
			trim: true,
		},
		deleted: {
			type: Boolean,
			default: false,
		},
		storage_cloud: {
			type: String,
			enum: [
				CloudUploadOption.AWS,
				CloudUploadOption.CLOUDINARY,
				CloudUploadOption.GCP,
			],
			default: CloudUploadOption.CLOUDINARY,
		},
	},
	{
		collection: "Files",
		timestamps: true,
		createdAt: "created_at",
		updatedAt: "updated_at",
	}
);

export default model("File", FileSchema);
