import { UserEntity } from "../../db/entites/user.entity";
import { UserModel } from "../../db/models";
import { Request } from "express";

export interface RequestExt extends Request {
	user_mongo?: InstanceType<typeof UserModel>;
	user_mysql?: UserEntity;
}

export interface GoogleUser {
	firstName: string;
	lastName: string;
	email: string;
	phoneNumber?: string;
	picture?: string;
}
