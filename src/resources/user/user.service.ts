import {
	comparePassword,
	createToken,
	hashPassword,
	verifyToken,
} from "../../common/helpers/token";
import { CreateUserDto, UserLoginDto } from "./user.dto";
import {
	DatabaseChoice,
	OtpPurposeOptions,
	StatusMessages,
} from "../../common/enums";
import ResponseData from "../../common/interfaces/responseData.interface";
import { HttpCodes } from "../../common/constants/httpcode";
import { UserModel, OtpModel, FileModel } from "../../db/models";
import { v4 as uuid } from "uuid";
import { Knex } from "knex";
import envConfig from "../../../env.config";
import { verificationCode } from "../../common/helpers";
import { tableNames } from "../../common/constants";

class UserService {
	constructor(private readonly knex: Knex) {}

	public async createUser(createUserDto: CreateUserDto): Promise<ResponseData> {
		let responseData: ResponseData;
		try {
			switch (envConfig.DATABASE_CHOICE) {
				case DatabaseChoice.MONGODB:
					responseData = await this.createUserMongoDB(createUserDto);
					break;
				default:
					responseData = await this.createUserMySQL(createUserDto);
					break;
			}
			return responseData;
		} catch (error: any) {
			console.error("🚀 ~ UserService ~ error:", error);
			responseData = {
				status: StatusMessages.error,
				code: HttpCodes.HTTP_SERVER_ERROR,
				message: error.toString(),
			};
			return responseData;
		}
	}
	private async createUserMySQL(
		createUserDto: CreateUserDto
	): Promise<ResponseData> {
		let responseData: ResponseData = {
			status: StatusMessages.success,
			code: HttpCodes.HTTP_OK,
			message: "User Created Successfully, awaiting verification",
		};
		try {
			const userExist = await this.knex(tableNames.users)
				.select(["email", "phone_number"])
				.where("email", createUserDto.email.toLowerCase())
				.orWhere("phone_number", createUserDto.phone_number)
				.first();

			if (userExist) {
				responseData = {
					status: StatusMessages.error,
					code: HttpCodes.HTTP_BAD_REQUEST,
					message: "User With These Details Already Exists",
				};
				return responseData;
			}
			const user_id = uuid();
			const hashedPassword = await hashPassword(createUserDto.password);
			const accessToken = createToken(user_id);
			await this.knex(tableNames.users)
				.insert({
					id: user_id,
					first_name: createUserDto.first_name.toLowerCase(),
					last_name: createUserDto.last_name.toLowerCase(),
					email: createUserDto.email.toLowerCase(),
					phone_number: createUserDto.phone_number,
					access_token: accessToken,
					password: hashedPassword,
				})
				.then((created) => {
					console.log("🚀 ~USER CREATED SUCCESSFULLY:", created);
				});

			const user = await this.knex("users")
				.where("id", user_id)
				.select("*")
				.first();
			const otpSend = await this.sendVerificationCodeMySQL(
				user_id,
				OtpPurposeOptions.ACCOUNT_VALIDATION
			);
			responseData.data = {
				user,
				otp: otpSend.data,
			};

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

	private async createUserMongoDB(
		createUserDto: CreateUserDto
	): Promise<ResponseData> {
		let responseData: ResponseData = {
			status: StatusMessages.success,
			code: HttpCodes.HTTP_OK,
			message: "User Created Successfully, awaiting verification",
		};
		try {
			const userExist = await UserModel.findOne({
				$or: [
					{ email: createUserDto.email.toLowerCase() },
					{ phone_number: createUserDto.phone_number },
				],
			});

			if (userExist) {
				responseData = {
					status: StatusMessages.error,
					code: HttpCodes.HTTP_BAD_REQUEST,
					message: "User With These Details Already Exists",
				};
				return responseData;
			}

			const hashedPassword = await hashPassword(createUserDto.password);
			const createdUser = await UserModel.create({
				first_name: createUserDto.first_name.toLowerCase(),
				last_name: createUserDto.last_name.toLowerCase(),
				email: createUserDto.email.toLowerCase(),
				phone_number: createUserDto.phone_number,
				password: hashedPassword,
			});
			const accessToken = createToken(createdUser._id);
			const newUser = await UserModel.findByIdAndUpdate(
				createdUser._id,
				{
					access_token: accessToken,
				},
				{ new: true }
			);
			const otpSend = await this.sendVerificationCodeMongoDB(
				String(createdUser._id),
				OtpPurposeOptions.ACCOUNT_VALIDATION
			);
			responseData.data = {
				user: newUser,
				otp: otpSend.data,
			};
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

	public async validateUser(
		user_id: string,
		otp: string
	): Promise<ResponseData> {
		let responseData: ResponseData;
		try {
			switch (envConfig.DATABASE_CHOICE) {
				case DatabaseChoice.MONGODB:
					responseData = await this.validateUserMongoDB(user_id, otp);
					break;
				default:
					responseData = await this.validateUserMySQL(user_id, otp);
					break;
			}
			return responseData;
		} catch (error: any) {
			console.error("🚀 ~ UserService ~ error:", error);
			responseData = {
				status: StatusMessages.error,
				code: HttpCodes.HTTP_SERVER_ERROR,
				message: error.toString(),
			};
			return responseData;
		}
	}

	private async validateUserMongoDB(
		user_id: string,
		otp: string
	): Promise<ResponseData> {
		let responseData: ResponseData = {
			status: StatusMessages.success,
			code: HttpCodes.HTTP_OK,
			message: "user validated Successfully",
		};
		try {
			const otpModel = await OtpModel.findOne({
				code: otp,
			});
			if (!otpModel) {
				responseData = {
					status: StatusMessages.error,
					code: HttpCodes.HTTP_BAD_REQUEST,
					message: "Invalid OTP",
				};
				return responseData;
			}
			const isValid =
				otpModel && otpModel.token && (await verifyToken(otpModel.token));
			if (!isValid) {
				responseData = {
					status: StatusMessages.error,
					code: HttpCodes.HTTP_BAD_REQUEST,
					message: "Invalid OTP",
				};
				return responseData;
			}
			const user = await UserModel.findByIdAndUpdate(
				user_id,
				{
					is_verified: true,
				},
				{ new: true }
			);
			await OtpModel.deleteOne({ _id: otpModel._id });
			responseData.data = user;
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

	private async validateUserMySQL(
		user_id: string,
		otp: string
	): Promise<ResponseData> {
		let responseData: ResponseData = {
			status: StatusMessages.success,
			code: HttpCodes.HTTP_OK,
			message: "user validated Successfully",
		};
		try {
			const otpModel = await this.knex(tableNames.otps)
				.select(["id", "code", "token"])
				.where("code", otp)
				.first();
			if (!otpModel) {
				responseData = {
					status: StatusMessages.error,
					code: HttpCodes.HTTP_BAD_REQUEST,
					message: "Invalid OTP",
				};
				return responseData;
			}
			const isValid =
				otpModel && otpModel.token && (await verifyToken(otpModel.token));
			if (!isValid) {
				responseData = {
					status: StatusMessages.error,
					code: HttpCodes.HTTP_BAD_REQUEST,
					message: "Invalid OTP",
				};
				return responseData;
			}
			let user: any;
			await this.knex(tableNames.users)
				.update({ is_verified: true })
				.where("id", user_id)
				.then(async () => {
					user = await this.knex(tableNames.users)
						.where("id", user_id)
						.select("*")
						.first();
				})
				.catch((er) => {
					console.log("🚀 ~USER UPDATED ERROR:", er);
					responseData = {
						status: StatusMessages.error,
						code: HttpCodes.HTTP_BAD_REQUEST,
						message: "Unable to verify user",
					};
				});
			await this.knex(tableNames.otps).delete().where("id", otpModel.id);
			responseData.data = user;
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
	public async userLogin(payload: UserLoginDto): Promise<ResponseData> {
		let responseData: ResponseData;
		try {
			switch (envConfig.DATABASE_CHOICE) {
				case DatabaseChoice.MONGODB:
					responseData = await this.userLoginMongoDB(payload);
					break;
				default:
					responseData = await this.userLoginMySql(payload);
					break;
			}
			return responseData;
		} catch (error: any) {
			console.error("🚀 ~ userLogin ~ error:", error);
			responseData = {
				status: StatusMessages.error,
				code: HttpCodes.HTTP_SERVER_ERROR,
				message: error.toString(),
			};
			return responseData;
		}
	}

	private async userLoginMySql(payload: UserLoginDto): Promise<ResponseData> {
		let responseData: ResponseData = {
			status: StatusMessages.error,
			code: HttpCodes.HTTP_BAD_REQUEST,
			message: "Unable to login at the moment",
		};
		try {
			const { email, password } = payload;
			const userExists = await this.knex("users")
				.where("email", email.toLowerCase())
				.select("*")
				.first();

			if (!userExists) {
				responseData.message = "User Not Found";
				return responseData;
			}
			const isPasswordCorrect = await comparePassword(
				password,
				userExists.password
			);
			if (isPasswordCorrect !== true) {
				responseData.message = "Incorrect Password";
				return responseData;
			}

			const accessToken = createToken(userExists);

			await this.knex("users")
				.where("id", userExists.id)
				.update({ access_token: accessToken });
			const loggedInUser = await this.knex("users")
				.where("id", userExists.id)
				.select("*")
				.first();
			responseData.data = loggedInUser;
			responseData.message = "user logged in successfully";
			responseData.status = StatusMessages.success;
			responseData.code = HttpCodes.HTTP_OK;

			return responseData;
		} catch (error: any) {
			console.log("🚀 ~ UserService ~ createUserWallet ~ error:", error);
			responseData = {
				status: StatusMessages.error,
				code: HttpCodes.HTTP_SERVER_ERROR,
				message: error.toString(),
			};
			return responseData;
		}
	}

	private async userLoginMongoDB(payload: UserLoginDto): Promise<ResponseData> {
		let responseData: ResponseData = {
			status: StatusMessages.error,
			code: HttpCodes.HTTP_BAD_REQUEST,
			message: "Unable To Login At The Moment",
		};
		try {
			const { email, password } = payload;
			const userExists = await UserModel.findOne({
				email: email.toLowerCase(),
			});

			if (!userExists) {
				responseData.message = "User Not Found";
				return responseData;
			}
			const isPasswordCorrect =
				userExists &&
				userExists.password &&
				(await comparePassword(password, userExists.password));
			if (isPasswordCorrect !== true) {
				responseData.message = "Incorrect Password";
				return responseData;
			}

			const accessToken = createToken(userExists);
			const loggedInUser = await UserModel.findByIdAndUpdate(
				userExists._id,
				{
					access_token: accessToken,
				},
				{ new: true }
			);
			responseData.data = loggedInUser;
			responseData.message = "user logged in successfully";
			responseData.status = StatusMessages.success;
			responseData.code = HttpCodes.HTTP_OK;

			return responseData;
		} catch (error: any) {
			console.log("🚀 ~ UserService ~ userLoginMongoDB ~ error:", error);
			responseData = {
				status: StatusMessages.error,
				code: HttpCodes.HTTP_SERVER_ERROR,
				message: error.toString(),
			};
			return responseData;
		}
	}
	public async sendVerificationCode(
		user_id: string,
		purpose: OtpPurposeOptions
	) {
		let responseData: ResponseData;
		try {
			switch (envConfig.DATABASE_CHOICE) {
				case DatabaseChoice.MONGODB:
					responseData = await this.sendVerificationCodeMongoDB(
						user_id,
						purpose
					);
					break;
				default:
					responseData = await this.sendVerificationCodeMySQL(user_id, purpose);
					break;
			}
			return responseData;
		} catch (error: any) {
			console.error("🚀 ~ UserService ~ error:", error);
			responseData = {
				status: StatusMessages.error,
				code: HttpCodes.HTTP_SERVER_ERROR,
				message: error.toString(),
			};
			return responseData;
		}
	}

	private async sendVerificationCodeMongoDB(
		user_id: string,
		purpose: OtpPurposeOptions
	) {
		let responseData: ResponseData = {
			status: StatusMessages.success,
			code: HttpCodes.HTTP_OK,
			message: "Verification Code Sent Successfully",
		};
		try {
			const user = await UserModel.findById(user_id);
			if (!user) {
				responseData = {
					status: StatusMessages.error,
					code: HttpCodes.HTTP_BAD_REQUEST,
					message: "User Not Found",
				};
				return responseData;
			}
			const otp = await this.getUnusedOtpMongoDB();
			const token = createToken({ id: String(user._id), token: otp });
			await OtpModel.create({
				code: otp,
				otp_purpose: purpose,
				token,
				user_id: user._id,
			});
			const message = `Your verification code is ${otp}`;

			responseData.data = { otp, token };
			return responseData;
		} catch (error: any) {
			console.error("🚀 ~ UserService ~ error:", error);
			responseData = {
				status: StatusMessages.error,
				code: HttpCodes.HTTP_SERVER_ERROR,
				message: error.toString(),
			};
			return responseData;
		}
	}

	private async sendVerificationCodeMySQL(
		user_id: string,
		purpose: OtpPurposeOptions
	) {
		let responseData: ResponseData = {
			status: StatusMessages.success,
			code: HttpCodes.HTTP_OK,
			message: "Verification Code Sent Successfully",
		};
		try {
			const user = await this.knex(tableNames.users)
				.where("id", user_id)
				.select("*")
				.first();
			if (!user) {
				responseData = {
					status: StatusMessages.error,
					code: HttpCodes.HTTP_BAD_REQUEST,
					message: "User Not Found",
				};
				return responseData;
			}
			const otp = await this.getUnusedOtpMySQL();
			const token = createToken({ id: user.id, token: otp });
			await this.knex(tableNames.otps).insert({
				code: otp,
				otp_purpose: purpose,
				token,
				user_id: user.id,
			});
			const message = `Your verification code is ${otp}`;
			//run email notification if time permits here
			responseData.data = { otp, token };
			return responseData;
		} catch (error: any) {
			console.error("🚀 ~ UserService ~ error:", error);
			responseData = {
				status: StatusMessages.error,
				code: HttpCodes.HTTP_SERVER_ERROR,
				message: error.toString(),
			};
			return responseData;
		}
	}

	public async verifyOtp(otp: string, purpose: OtpPurposeOptions) {
		let responseData: ResponseData;
		try {
			switch (envConfig.DATABASE_CHOICE) {
				case DatabaseChoice.MONGODB:
					responseData = await this.verifyOtpMongoDB(otp, purpose);
					break;
				default:
					responseData = await this.verifyOtpMySQL(otp, purpose);
					break;
			}
			return responseData;
		} catch (error: any) {
			console.error("🚀 ~ UserService ~ error:", error);
			responseData = {
				status: StatusMessages.error,
				code: HttpCodes.HTTP_SERVER_ERROR,
				message: error.toString(),
			};
			return responseData;
		}
	}

	private async verifyOtpMySQL(otp: string, purpose: OtpPurposeOptions) {
		let responseData: ResponseData = {
			status: StatusMessages.success,
			code: HttpCodes.HTTP_OK,
			message: "Verification successful Mysql",
		};
		try {
			const otpModel = await this.knex(tableNames.otps)
				.select("*")
				.where("code", otp)
				.andWhere("otp_purpose", purpose)
				.first();
			if (!otpModel) {
				responseData = {
					status: StatusMessages.error,
					code: HttpCodes.HTTP_BAD_REQUEST,
					message: "Invalid OTP",
				};
				return responseData;
			}
			const isValid =
				otpModel && otpModel.token && (await verifyToken(otpModel.token));
			if (!isValid) {
				responseData = {
					status: StatusMessages.error,
					code: HttpCodes.HTTP_BAD_REQUEST,
					message: "Invalid OTP",
				};
				return responseData;
			}
			if (
				otpModel.otp_purpose === OtpPurposeOptions.ACCOUNT_VALIDATION &&
				otpModel.user_id
			) {
				switch (envConfig.DATABASE_CHOICE) {
					case DatabaseChoice.MONGODB:
						responseData = await this.validateUserMongoDB(
							otpModel.user_id,
							otp
						);
						break;
					default:
						responseData = await this.validateUserMySQL(otpModel.user_id, otp);
						break;
				}
			} else {
				responseData.data = {
					user_id: otpModel.user_id,
				};
				await this.knex(tableNames.otps).delete().where("id", otpModel.id);
				return responseData;
			}
			return responseData;
		} catch (error: any) {
			console.error("🚀 ~ UserService ~ error:", error);
			responseData = {
				status: StatusMessages.error,
				code: HttpCodes.HTTP_SERVER_ERROR,
				message: error.toString(),
			};
			return responseData;
		}
	}

	private async verifyOtpMongoDB(otp: string, purpose: OtpPurposeOptions) {
		let responseData: ResponseData = {
			status: StatusMessages.success,
			code: HttpCodes.HTTP_OK,
			message: "Verification successful",
		};
		try {
			const otpModel = await OtpModel.findOne({
				code: otp,
				otp_purpose: purpose,
			});
			if (!otpModel) {
				responseData = {
					status: StatusMessages.error,
					code: HttpCodes.HTTP_BAD_REQUEST,
					message: "Invalid OTP",
				};
				return responseData;
			}
			const isValid =
				otpModel && otpModel.token && (await verifyToken(otpModel.token));
			if (!isValid) {
				responseData = {
					status: StatusMessages.error,
					code: HttpCodes.HTTP_BAD_REQUEST,
					message: "Invalid OTP",
				};
				return responseData;
			}
			if (
				otpModel.otp_purpose === OtpPurposeOptions.ACCOUNT_VALIDATION &&
				otpModel.user_id
			) {
				return await this.validateUserMongoDB(otpModel.user_id, otp);
			} else {
				responseData.data = {
					user_id: otpModel.user_id,
				};
				await OtpModel.deleteOne({ _id: otpModel._id });
				return responseData;
			}
		} catch (error: any) {
			console.error("🚀 ~ UserService ~ error:", error);
			responseData = {
				status: StatusMessages.error,
				code: HttpCodes.HTTP_SERVER_ERROR,
				message: error.toString(),
			};
			return responseData;
		}
	}

	public async forgotPassword(email: string): Promise<ResponseData> {
		let responseData: ResponseData;
		try {
			switch (envConfig.DATABASE_CHOICE) {
				case DatabaseChoice.MONGODB:
					responseData = await this.forgotPasswordMongoDB(email);
					break;
				default:
					responseData = await this.forgotPasswordMySQL(email);
					break;
			}
			return responseData;
		} catch (error: any) {
			console.error("🚀 ~ UserService ~ error:", error);
			responseData = {
				status: StatusMessages.error,
				code: HttpCodes.HTTP_SERVER_ERROR,
				message: error.toString(),
			};
			return responseData;
		}
	}

	private async forgotPasswordMySQL(email: string): Promise<ResponseData> {
		let responseData: ResponseData = {
			status: StatusMessages.success,
			code: HttpCodes.HTTP_OK,
			message: "Verification Code Sent To Your Email Successfully",
		};
		try {
			const user = await this.knex(tableNames.users)
				.where("email", email)
				.select("*")
				.first();
			if (!user) {
				responseData = {
					status: StatusMessages.error,
					code: HttpCodes.HTTP_NOT_FOUND,
					message: "User Not Found",
				};
				return responseData;
			}
			responseData = await this.sendVerificationCodeMySQL(
				user.id,
				OtpPurposeOptions.FORGOT_PASSWORD
			);
			return responseData;
		} catch (error: any) {
			console.error("🚀 ~ UserService ~ error:", error);
			responseData = {
				status: StatusMessages.error,
				code: HttpCodes.HTTP_SERVER_ERROR,
				message: error.toString(),
			};
			return responseData;
		}
	}

	private async forgotPasswordMongoDB(email: string): Promise<ResponseData> {
		let responseData: ResponseData = {
			status: StatusMessages.success,
			code: HttpCodes.HTTP_OK,
			message: "Verification Code Sent To Your Email Successfully",
		};
		try {
			const user = await UserModel.findOne({
				email: email.toLowerCase(),
			});
			if (!user) {
				responseData = {
					status: StatusMessages.error,
					code: HttpCodes.HTTP_BAD_REQUEST,
					message: "User Not Found",
				};
				return responseData;
			}
			return await this.sendVerificationCodeMongoDB(
				user.id,
				OtpPurposeOptions.FORGOT_PASSWORD
			);
		} catch (error: any) {
			console.error("🚀 ~ UserService ~ error:", error);
			responseData = {
				status: StatusMessages.error,
				code: HttpCodes.HTTP_SERVER_ERROR,
				message: error.toString(),
			};
			return responseData;
		}
	}

	public async resetPassword(
		new_password: string,
		user_id: string
	): Promise<ResponseData> {
		let responseData: ResponseData;
		try {
			switch (envConfig.DATABASE_CHOICE) {
				case DatabaseChoice.MONGODB:
					responseData = await this.resetPasswordMongoDB(new_password, user_id);
					break;
				default:
					responseData = await this.resetPasswordMySQL(new_password, user_id);
					break;
			}
			return responseData;
		} catch (error: any) {
			console.error("🚀 ~ UserService ~ error:", error);
			responseData = {
				status: StatusMessages.error,
				code: HttpCodes.HTTP_SERVER_ERROR,
				message: error.toString(),
			};
			return responseData;
		}
	}

	private async resetPasswordMySQL(
		new_password: string,
		user_id: string
	): Promise<ResponseData> {
		let responseData: ResponseData = {
			status: StatusMessages.success,
			code: HttpCodes.HTTP_OK,
			message: "Password Reset Successfully",
		};
		try {
			const hashedPassword = await hashPassword(new_password);
			await this.knex(tableNames.users)
				.update({ password: hashedPassword })
				.where("id", user_id)
				.then((updated) => {
					console.log("🚀 ~USER UPDATED SUCCESSFULLY:", updated);
				});
			return responseData;
		} catch (error: any) {
			console.error("🚀 ~ UserService ~ error:", error);
			responseData = {
				status: StatusMessages.error,
				code: HttpCodes.HTTP_SERVER_ERROR,
				message: error.toString(),
			};
			return responseData;
		}
	}
	private async resetPasswordMongoDB(
		new_password: string,
		user_id: string
	): Promise<ResponseData> {
		let responseData: ResponseData = {
			status: StatusMessages.success,
			code: HttpCodes.HTTP_OK,
			message: "Password Reset Successfully",
		};
		try {
			const hashedPassword = await hashPassword(new_password);
			await UserModel.findByIdAndUpdate(user_id, {
				password: hashedPassword,
			});
			return responseData;
		} catch (error: any) {
			console.error("🚀 ~ UserService ~ error:", error);
			responseData = {
				status: StatusMessages.error,
				code: HttpCodes.HTTP_SERVER_ERROR,
				message: error.toString(),
			};
			return responseData;
		}
	}

	private async getUnusedOtpMySQL(): Promise<string> {
		let code = String(verificationCode());
		try {
			let unusedOtp: string;
			var existing = await this.knex(tableNames.otps).where("code", code);
			while (existing !== null && existing !== undefined) {
				code = String(verificationCode());
				existing = await this.knex(tableNames.otps).where("code", code);
			}
			unusedOtp = code;
			return unusedOtp;
		} catch (error) {
			return code;
		}
	}

	private async getUnusedOtpMongoDB(): Promise<string> {
		let code = String(verificationCode());
		try {
			let unusedOtp: string;
			var existing = await OtpModel.findOne({ code });
			while (existing !== null && existing !== undefined) {
				code = String(verificationCode());
				existing = await OtpModel.findOne({ code });
			}
			unusedOtp = code;
			return unusedOtp;
		} catch (error) {
			return code;
		}
	}
}

export default UserService;
