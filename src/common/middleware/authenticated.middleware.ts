import { Request, Response, NextFunction, RequestHandler } from "express";
import jwt, { verify } from "jsonwebtoken";
import axios from "axios";
import knex from "../../db/knex";
import { verifyToken } from "../helpers/token";
import { tableNames } from "../constants";
import Token from "../interfaces/token.interface";
import HttpException from "../exceptions/http.exception";
import envConfig from "../../../env.config";
import { DatabaseChoice } from "../enums";
import { UserModel } from "../../db/models";
import { RequestExt } from "../interfaces/expRequest.interface";

async function authenticatedMiddleware(
	req: RequestExt,
	res: Response,
	next: NextFunction
): Promise<void> {
	const bearer = req.headers.authorization;
	if (!bearer || !bearer.startsWith("Bearer ")) {
		console.log("🚀 ~ NO bearer:", bearer);
		next(new HttpException(401, "Unauthorized"));
		return;
	}

	const accessToken = bearer.split("Bearer ")[1].trim();
	try {
		const payload: Token | jwt.JsonWebTokenError = await verifyToken(
			accessToken
		);
		if (payload instanceof jwt.JsonWebTokenError) {
			console.log("🚀 ~ JWT ERROR:", payload);
			next(new HttpException(401, "Unauthorized"));
			return;
		}
		let user: any;

		if (envConfig.DATABASE_CHOICE === DatabaseChoice.MYSQL) {
			user = await knex(tableNames.users)
				.select(
					"users.id",
					"users.first_name",
					"users.last_name",
					"users.email",
					"users.phone_number",
					"users.access_token",
					"users.is_verified",
					"users.created_at",
					"users.updated_at"
				)
				.where("users.id", payload.id)
				.first();
		} else {
			user = await UserModel.findById(payload.id);
		}

		if (!user) {
			console.log("🚀 ~ USER NOT FOUND:", user);
			next(new HttpException(401, "Unauthorized"));
			return;
		}

		req.user = user as any;
		req.user_mongo = user;
		req.user_mysql = user;
		next();
	} catch (error) {
		console.error("🚀 ~ error:", error);
		next(new HttpException(401, "Unauthorized"));
	}
}

export default authenticatedMiddleware;
