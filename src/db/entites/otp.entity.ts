export interface OtpEntity {
	id: string;
	user_id: string;
	code: string;
	token: string;
	otp_purpose?: string;
	created_at?: Date;
	updated_at?: Date;
}
