import { Schema, model } from "mongoose";

const OtpSchema = new Schema(
	{
		user_id: {
			type: String,
			trim: true,
		},
		code: {
			type: String,
			trim: true,
		},
		token: {
			type: String,
			trim: true,
		},
		otp_purpose: {
			type: String,
			trim: true,
		},
	},
	{
		collection: "OneTimePassword",
		timestamps: true,
		createdAt: "created_at",
		updatedAt: "updated_at",
	}
);

export default model("OneTimePassword", OtpSchema);
