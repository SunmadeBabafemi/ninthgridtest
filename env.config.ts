import dotenv from "dotenv";
import { CloudUploadOption, DatabaseChoice } from "./src/common/enums";
import validateEnv from "./src/common/helpers/validateEnv";

dotenv.config();
validateEnv();

export default {
	NODE_PORT: process.env.NODE_PORT || 3000,
	NODE_ENV: process.env.NODE_ENV || 3000,
	MONGO_URI: process.env.MONGO_URI || "mongodb://localhost:27017/ninthdrid",
	ACCESS_SECRET: process.env.ACCESS_SECRET || "3000",
	ACCESS_TIME: process.env.ACCESS_TIME || "365d",

	CLOUD_UPLOAD_OPTION:
		process.env.CLOUD_UPLOAD_OPTION || CloudUploadOption.CLOUDINARY,
	DATABASE_NAME: process.env.DATABASE_NAME || CloudUploadOption.CLOUDINARY,
	DATABASE_PORT: process.env.DATABASE_PORT || CloudUploadOption.CLOUDINARY,
	DATABASE_HOST: process.env.DATABASE_HOST || CloudUploadOption.CLOUDINARY,
	DATABASE_PASSWORD:
		process.env.DATABASE_PASSWORD || CloudUploadOption.CLOUDINARY,
	DATABASE_USERNAME:
		process.env.DATABASE_USERNAME || CloudUploadOption.CLOUDINARY,
	DATABASE_URL: process.env.DATABASE_URL || CloudUploadOption.CLOUDINARY,
	DATABASE_CHOICE: process.env.DATABASE_CHOICE || DatabaseChoice.MYSQL,
	REDIS_HOST: process.env.REDIS_HOST || "",
	REDIS_PORT: process.env.REDIS_PORT || "",
	REDIS_CACHE_TTL: process.env.REDIS_CACHE_TTL || "",
	REDIS_PASSWORD: process.env.REDIS_PASSWORD || "",
	GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID || "",
	GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET || "",
	GOOGLE_BUCKET_NAME: process.env.GOOGLE_BUCKET_NAME || "",
	GOOGLE_BUCKET_KEY_JSON: process.env.GOOGLE_BUCKET_KEY_JSON || "",
	GCP_PROJECT_ID: process.env.GCP_PROJECT_ID || "",
	GCP_LOCATION: process.env.GCP_LOCATION || "",
};
