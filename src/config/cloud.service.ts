import { randomUUID } from "crypto";
import {
	FileMimeTypes,
	fileUploadProgressStatus,
	StatusMessages,
} from "../common/enums";
import ResponseData from "../common/interfaces/responseData.interface";
import { Storage } from "@google-cloud/storage";
import { join } from "path";
import { createReadStream, rmSync } from "fs";
import { HttpCodes } from "../common/constants/httpcode";
import redisClient from "../../redis";

class CloudService {
	private storage: Storage;
	private bucketName: string =
		process.env.GOOGLE_BUCKET_NAME || "classore-be-bucket-1";
	private bucketKey: string = join(process.cwd(), "key.json");
	private projectId: string = process.env.GCP_PROJECT_ID || "";
	constructor() {
		this.storage = new Storage({
			keyFilename: this.bucketKey,
			projectId: this.projectId,
		});
	}

	public async GCPUpload(
		file: Express.Multer.File,
		folder_: string,
		uploadId?: string
	): Promise<ResponseData> {
		let responseData: ResponseData;
		const folder = `${folder_}ninthgrid`;

		try {
			const bucket = this.storage.bucket(this.bucketName);
			const uniqueId = randomUUID();
			const extension = file.originalname.split(".").pop();
			const fileName = `${folder}/${uniqueId}.${extension}`;
			const destination = bucket.file(fileName);
			const fileStream = createReadStream(file.path);
			const uploadStream = destination.createWriteStream({
				resumable: true,
				contentType: file.mimetype,
				metadata: { cacheControl: "public, max-age=31536000" },
			});
			let uploadedBytes = 0;
			const totalSize = file.size;
			return new Promise((resolve, reject) => {
				uploadStream.on("error", (err) => {
					console.error("Upload error:", err);
					if (uploadId) {
						redisClient.set(
							`upload:${uploadId}`,
							JSON.stringify({
								status: fileUploadProgressStatus.failed,
								progress: 0,
							}),
							{ EX: 300 }
						);
					}
					reject(err);
				});

				uploadStream.on("finish", async () => {
					try {
						const publicUrl = `https://storage.googleapis.com/${this.bucketName}/${fileName}`;
						if (uploadId) {
							redisClient.set(
								`upload:${uploadId}`,
								JSON.stringify({
									status: fileUploadProgressStatus.completed,
									progress: 100,
								}),
								{ EX: 300 }
							);
						}
						try {
							rmSync(`${file.destination}/`, { recursive: true, force: true });
						} catch (errr) {
							console.error("⚠️ Failed to delete file:", errr);
						}
						responseData = {
							status: StatusMessages.success,
							code: HttpCodes.HTTP_OK,
							message: "file upload successful",
							data: publicUrl,
						};

						resolve(responseData);
					} catch (err) {
						try {
							rmSync(`${file.destination}/`, { recursive: true, force: true });
						} catch (errr) {
							console.error(
								"⚠️ Failed to delete file: in promise catch block",
								errr
							);
						}
						reject(err);
					}
				});
				fileStream.on("data", (chunk) => {
					uploadedBytes += chunk.length;
					const progress = Math.min(
						99,
						Math.round((uploadedBytes / totalSize) * 100)
					);
					if (uploadId) {
						redisClient.set(
							`upload:${uploadId}`,
							JSON.stringify({
								status:
									progress === 0
										? fileUploadProgressStatus.started
										: fileUploadProgressStatus.ongoing,
								progress,
							}),
							{ EX: 300 }
						);
					}
				});
				fileStream.pipe(uploadStream);
			});
		} catch (error: any) {
			console.log("🚀 ~ GoogleStorageService ~ error:", error);
			console.error("🚀 ~ UserService ~ error:", error);
			if (uploadId) {
				redisClient.set(
					`upload:${uploadId}`,
					JSON.stringify({
						status: fileUploadProgressStatus.started + `, ${error.toString()}`,
						progress: 0,
					}),
					{ EX: 300 }
				);
			}
			rmSync(`${file.destination}/`, { recursive: true, force: true });
			responseData = {
				status: StatusMessages.error,
				code: HttpCodes.HTTP_SERVER_ERROR,
				message: error.toString(),
			};
			return responseData;
		}
	}

	public async deleteFiles(fileNameLink: string[]): Promise<string> {
		try {
			console.log("NOW DELETING FILE TO GCLOUD STORAGE");
			const filenames: any[] = [];
			for (let i = 0; i < fileNameLink.length; i++) {
				const element = fileNameLink[i];
				const url = new URL(element);
				const pathParts = url.pathname
					.split("/")
					.filter((part) => part.length > 0);

				if (pathParts.length < 2) {
					throw new Error("Invalid URL: Bucket name or file path is missing.");
				}

				const bucketName = pathParts[0];
				const filePath = pathParts.slice(1).join("/");
				filenames.push({ filePath, bucketName });
			}
			await Promise.all(
				filenames.map(async (obj) => {
					try {
						await this.storage
							.bucket(obj.bucketName)
							.file(obj.filePath)
							.delete();
						console.log(`Deleted: ${obj.filePath}`);
					} catch (error) {
						console.error(`Failed to delete ${obj.filePath}:`, error);
					}
				})
			);
			return "file deleted successfully";
		} catch (error: any) {
			console.log("🚀 ~ GoogleStorageService ~ deleteFiles ~ error:", error);
			console.error(error);
			throw new Error(error.toString());
		}
	}
}

export default CloudService;
