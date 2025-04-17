import { OtpPurposeOptions } from "../../common/enums";
import { UserEntity } from "../../db/entites/user.entity";

export interface CreateUserDto {
	first_name: string;
	last_name: string;
	email: string;
	phone_number: string;
	bvn: string;
	nin: string;
	password: string;
	is_verified?: boolean;
}

export interface UserLoginDto {
	user?: UserEntity;
	email: string;
	password: string;
}

export interface ForgotPasswordDto {
	email: string;
}

export interface ResetPasswordDto {
	new_password: string;
}

export interface validateOTPDto {
	otp: string;
	purpose: OtpPurposeOptions;
}

export interface SendVerificationCodeDto {
	purpose: OtpPurposeOptions;
}
