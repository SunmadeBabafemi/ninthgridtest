export enum StatusMessages {
	success = "success",
	error = "error",
}

export enum OtpPurposeOptions {
	CHANGE_PASSWORD = "CHANGE_PASSWORD",
	FORGOT_PASSWORD = "FORGOT_PASSWORD",
	SIGNUP_COMPLETE = "SIGNUP_COMPLETE",
	PASSWORD_RESET = "PASSWORD_RESET",
	ACCOUNT_VALIDATION = "ACCOUNT_VALIDATION",
}

export enum CloudUploadOption {
	CLOUDINARY = "CLOUDINARY",
	AWS = "AWS",
	GCP = "GCP",
}

export enum DatabaseChoice {
	MYSQL = "MYSQL",
	MONGODB = "MONGODB",
}

export enum RequestData {
	params = "params",
	query = "query",
	body = "query",
}

export enum FileMimeTypes {
	image = "image",
	video = "video",
	application = "application",
}

export enum fileUploadProgressStatus {
	failed = "failed",
	started = "started",
	ongoing = "ongoing",
	completed = "completed",
}
