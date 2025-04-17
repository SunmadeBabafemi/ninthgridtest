import { OtpPurposeOptions } from "../../common/enums";
import Joi from "joi";

const modelIdSchema = Joi.object({
	id: Joi.string().required(),
});

const paginateSchema = Joi.object({
	limit: Joi.number().optional(),
	page: Joi.number().optional(),
	search: Joi.string().optional(),
});

const uploadFileSchema = Joi.object({
	filename: Joi.string().optional(),
	description: Joi.string().optional(),
	upload_id: Joi.string().optional(),
});

const loginSchema = Joi.object({
	password: Joi.string().required(),
	email: Joi.string().required(),
});

const forgotPasswordSchema = Joi.object({
	email: Joi.string().required(),
});

const resetPasswordSchema = Joi.object({
	new_password: Joi.string().required(),
});

const sendVerificationCodeSchema = Joi.object({
	purpose: Joi.string()
		.valid(
			OtpPurposeOptions.ACCOUNT_VALIDATION,
			OtpPurposeOptions.FORGOT_PASSWORD,
			OtpPurposeOptions.CHANGE_PASSWORD
		)
		.required(),
});

const validateOtpSchema = Joi.object({
	otp: Joi.string().required(),
	purpose: Joi.string()
		.valid(
			OtpPurposeOptions.ACCOUNT_VALIDATION,
			OtpPurposeOptions.FORGOT_PASSWORD,
			OtpPurposeOptions.CHANGE_PASSWORD
		)
		.required(),
});

export default {
	modelIdSchema,
	uploadFileSchema,
	loginSchema,
	forgotPasswordSchema,
	resetPasswordSchema,
	sendVerificationCodeSchema,
	validateOtpSchema,
	paginateSchema,
};
