import mongoose, { Schema, model } from "mongoose";

const UserSchema = new Schema(
	{
		first_name: {
			type: String,
			required: true,
			trim: true,
		},
		last_name: {
			type: String,
			required: true,
			trim: true,
		},
		email: {
			type: String,
			required: true,
			trim: true,
		},
		phone_number: {
			type: String,
			trim: true,
		},
		password: {
			type: String,
			trim: true,
		},
		access_token: {
			type: String,
		},
		is_verified: {
			type: Boolean,
			default: false,
		},
		profile_image: {
			type: String,
			trim: true,
		},
	},
	{
		collection: "Users",
		timestamps: true,
		createdAt: "created_at",
		updatedAt: "updated_at",
	}
);

export default model("User", UserSchema);
