import {
	Request,
	Response,
	NextFunction,
	Router,
	RequestHandler,
} from "express";
import Controller from "../../common/interfaces/controller.interface";
import HttpException from "../../common/exceptions/http.exception";
import validationMiddleware from "../../common/middleware/validation.middleware";
import UploadService from "./uploads.service";
import validate from "./uploads.validation";
import { responseObject } from "../../common/helpers/http.response";
import { HttpCodes } from "../../common/constants/httpcode";
import { PaginationDto, UploadFileDto } from "./uploads.dto";
import knex from "../../db/knex";
import CloudService from "../../config/cloud.service";

import { StatusMessages } from "../../common/enums";
import upload from "../../config/multer";
import redisClient from "../../../redis";
import authenticatedMiddleware from "../../common/middleware/authenticated.middleware";

class UploadController implements Controller {
	public path = "/upload";
	public router = Router();
	private cloudService: CloudService;
	private uploadService: UploadService;

	constructor() {
		this.cloudService = new CloudService();
		this.uploadService = new UploadService(knex, this.cloudService);
		this.initializeRoute();
	}

	initializeRoute(): void {
		this.router.post(
			`${this.path}/new-file`,
			authenticatedMiddleware,
			upload.single("file"),
			validationMiddleware(validate.uploadFileSchema),
			this.uploadFile as RequestHandler
		);
		this.router.get(
			`${this.path}/get-progress/:id`,
			authenticatedMiddleware,
			validationMiddleware(validate.modelIdSchema),
			this.getUploadProgress as RequestHandler
		);
		this.router.get(
			`${this.path}/get-files`,
			authenticatedMiddleware,
			validationMiddleware(validate.paginateSchema),
			this.fetchFiles as RequestHandler
		);
		this.router.delete(
			`${this.path}/delete-file/:id`,
			authenticatedMiddleware,
			validationMiddleware(validate.modelIdSchema),
			this.deleteFile as RequestHandler
		);
	}

	private uploadFile = async (
		req: Request,
		res: Response,
		next: NextFunction
	): Promise<Response | void> => {
		try {
			const file = req.file as Express.Multer.File;
			const user = req?.user;
			if (!file) {
				return responseObject(
					res,
					HttpCodes.HTTP_BAD_REQUEST,
					"error",
					"File not found",
					null
				);
			}
			const body: UploadFileDto = {
				...req.body,
				file,
				user_id: user?.id || user?._id,
			};
			const { status, code, message, data } =
				await this.uploadService.uploadFile(body);
			return responseObject(res, code, status, message, data);
		} catch (error: any) {
			next(new HttpException(HttpCodes.HTTP_BAD_REQUEST, error.toString()));
		}
	};

	private getUploadProgress = async (
		req: Request,
		res: Response,
		next: NextFunction
	): Promise<Response | void> => {
		try {
			const uploadId = req.params.id as String;
			const progressData = await redisClient.get(`upload:${uploadId}`);
			if (!progressData) {
				return responseObject(
					res,
					HttpCodes.HTTP_BAD_REQUEST,
					"error",
					"No Upload progress data found",
					null
				);
			}
			const data = JSON.parse(progressData);

			return responseObject(
				res,
				HttpCodes.HTTP_OK,
				StatusMessages.success,
				"progress fetched successfully",
				data
			);
		} catch (error: any) {
			next(new HttpException(HttpCodes.HTTP_BAD_REQUEST, error.toString()));
		}
	};

	private fetchFiles = async (
		req: Request,
		res: Response,
		next: NextFunction
	): Promise<Response | void> => {
		try {
			const user = req.user;
			const payload: PaginationDto = {
				limit: req?.query?.limit ? Number(req?.query?.limit) : 10,
				page: req?.query?.page ? Number(req?.query?.page) : 1,
			};
			const { status, code, message, data } =
				await this.uploadService.fetchFiles(payload, user);
			return responseObject(res, code, status, message, data);
		} catch (error: any) {
			next(new HttpException(HttpCodes.HTTP_BAD_REQUEST, error.toString()));
		}
	};

	private deleteFile = async (
		req: Request,
		res: Response,
		next: NextFunction
	): Promise<Response | void> => {
		try {
			const file_id = String(req.params.id);
			const { status, code, message, data } =
				await this.uploadService.deleteFile(file_id);
			return responseObject(res, code, status, message, data);
		} catch (error: any) {
			next(new HttpException(HttpCodes.HTTP_BAD_REQUEST, error.toString()));
		}
	};
}

export default UploadController;
