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
import UserService from "./user.service";
import validate from "./user.validation";
import { responseObject } from "../../common/helpers/http.response";
import { HttpCodes } from "../../common/constants/httpcode";
// import authenticatedMiddleware from "../../common/middleware/authenticated.middleware";
import {
	CreateUserDto,
	ForgotPasswordDto,
	ResetPasswordDto,
	UserLoginDto,
	validateOTPDto,
} from "./user.dto";
import knex from "../../db/knex";
import { RequestExt } from "../../common/interfaces/expRequest.interface";
import { OtpPurposeOptions, RequestData } from "../../common/enums";

class UserController implements Controller {
	public path = "/user";
	public router = Router();
	private userService = new UserService(knex);

	constructor() {
		this.initializeRoute();
	}

	initializeRoute(): void {
		this.router.post(
			`${this.path}/signup`,
			validationMiddleware(validate.signupSchema),
			this.createUser as RequestHandler
		);

		this.router.post(
			`${this.path}/login`,
			validationMiddleware(validate.loginSchema),
			this.userLogin as RequestHandler
		);

		this.router.put(
			`${this.path}/send-verification-code`,
			validationMiddleware(
				validate.sendVerificationCodeSchema,
				RequestData.query
			),
			this.sendVerificationCode as RequestHandler
		);

		this.router.post(
			`${this.path}/validate-verification-code`,
			validationMiddleware(validate.validateOtpSchema),
			this.verifyOtp as RequestHandler
		);

		this.router.post(
			`${this.path}/forgot-password`,
			validationMiddleware(validate.forgotPasswordSchema),
			this.forgotPassword as RequestHandler
		);

		this.router.put(
			`${this.path}/reset-password/:id`,
			validationMiddleware(validate.modelIdSchema, RequestData.params),
			validationMiddleware(validate.resetPasswordSchema),
			this.resetPassword as RequestHandler
		);
	}

	private createUser = async (
		req: Request,
		res: Response,
		next: NextFunction
	): Promise<Response | void> => {
		try {
			const body: CreateUserDto = req.body;

			const { status, code, message, data } = await this.userService.createUser(
				body
			);
			return responseObject(res, code, status, message, data);
		} catch (error: any) {
			next(new HttpException(HttpCodes.HTTP_BAD_REQUEST, error.toString()));
		}
	};

	private validateUser = async (
		req: Request,
		res: Response,
		next: NextFunction
	): Promise<Response | void> => {
		try {
			const otp: string = req.body.otp;
			const user_id: string = String(req.params.id);

			const { status, code, message, data } =
				await this.userService.validateUser(user_id, otp);
			return responseObject(res, code, status, message, data);
		} catch (error: any) {
			next(new HttpException(HttpCodes.HTTP_BAD_REQUEST, error.toString()));
		}
	};

	private userLogin = async (
		req: Request,
		res: Response,
		next: NextFunction
	): Promise<Response | void> => {
		try {
			const body: UserLoginDto = req.body;

			const { status, code, message, data } = await this.userService.userLogin(
				body
			);
			return responseObject(res, code, status, message, data);
		} catch (error: any) {
			next(new HttpException(HttpCodes.HTTP_BAD_REQUEST, error.toString()));
		}
	};

	private sendVerificationCode = async (
		req: RequestExt,
		res: Response,
		next: NextFunction
	): Promise<Response | void> => {
		try {
			const purpose: OtpPurposeOptions = req.query
				?.purpose as OtpPurposeOptions;
			const user_id = req.user_mongo?._id
				? String(req?.user_mongo._id)
				: req.user_mysql?.id || "";

			const { status, code, message, data } =
				await this.userService.sendVerificationCode(user_id, purpose);
			return responseObject(res, code, status, message, data);
		} catch (error: any) {
			next(new HttpException(HttpCodes.HTTP_BAD_REQUEST, error.toString()));
		}
	};

	private verifyOtp = async (
		req: RequestExt,
		res: Response,
		next: NextFunction
	): Promise<Response | void> => {
		try {
			const body = req.body as validateOTPDto;

			const { status, code, message, data } = await this.userService.verifyOtp(
				body.otp,
				body.purpose
			);
			return responseObject(res, code, status, message, data);
		} catch (error: any) {
			next(new HttpException(HttpCodes.HTTP_BAD_REQUEST, error.toString()));
		}
	};

	private forgotPassword = async (
		req: RequestExt,
		res: Response,
		next: NextFunction
	): Promise<Response | void> => {
		try {
			const body = req.body as ForgotPasswordDto;

			const { status, code, message, data } =
				await this.userService.forgotPassword(body.email);
			return responseObject(res, code, status, message, data);
		} catch (error: any) {
			next(new HttpException(HttpCodes.HTTP_BAD_REQUEST, error.toString()));
		}
	};

	private resetPassword = async (
		req: RequestExt,
		res: Response,
		next: NextFunction
	): Promise<Response | void> => {
		try {
			const user_id = String(req.params.id);
			const body = req.body as ResetPasswordDto;

			const { status, code, message, data } =
				await this.userService.resetPassword(body.new_password, user_id);
			return responseObject(res, code, status, message, data);
		} catch (error: any) {
			next(new HttpException(HttpCodes.HTTP_BAD_REQUEST, error.toString()));
		}
	};
}

export default UserController;
