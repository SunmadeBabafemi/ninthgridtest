import { responseObject } from "../helpers/http.response";
import { Request, Response, NextFunction, RequestHandler } from "express";
import Joi from "joi";

import { HttpCodes } from "../constants/httpcode";
import { RequestData } from "../enums";

function validationMiddleware(
	shema: Joi.Schema,
	requestOptions?: RequestData
): RequestHandler {
	return async (
		req: Request,
		res: Response,
		next: NextFunction
	): Promise<void> => {
		const validationOptions = {
			abortEarly: false,
			allowUnknown: true,
			stripUnknown: true,
		};
		try {
			if (requestOptions) {
				switch (requestOptions) {
					case RequestData.params:
						const params_value = await shema.validateAsync(
							req.params,
							validationOptions
						);
						req.params = params_value;
						break;
					case RequestData.query:
						const query_value = await shema.validateAsync(
							req.query,
							validationOptions
						);
						req.query = query_value;
						break;
					case RequestData.body:
						const body_value = await shema.validateAsync(
							req.body,
							validationOptions
						);
						req.body = body_value;
						break;

					default:
						const value = await shema.validateAsync(
							req.body,
							validationOptions
						);
						req.body = value;
						break;
				}
			} else {
				const value = await shema.validateAsync(req.body, validationOptions);
				req.body = value;
			}
			next();
		} catch (e: any) {
			const errors: string[] = [];
			e.details.forEach((error: Joi.ValidationErrorItem) => {
				errors.push(error.message);
			});

			responseObject(
				res,
				HttpCodes.HTTP_BAD_REQUEST,
				"error",
				"Validation error",
				errors
			);
		}
	};
}

export default validationMiddleware;
