import { OtpPurposeOptions } from "../../common/enums";
import Joi from "joi";

const modelIdSchema = Joi.object({
	id: Joi.string().required(),
});

const signupSchema = Joi.object({
	first_name: Joi.string().required(),
	last_name: Joi.string().required(),
	password: Joi.string().required(),
	email: Joi.string().email().required(),
	phone_number: Joi.string().required(),
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
	signupSchema,
	loginSchema,
	forgotPasswordSchema,
	resetPasswordSchema,
	sendVerificationCodeSchema,
	validateOtpSchema,
};
