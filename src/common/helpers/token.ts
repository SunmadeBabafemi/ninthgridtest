import jwt from "jsonwebtoken";
import Token from "../interfaces/token.interface";
import * as bcrypt from "bcrypt";
import envConfig from "../../../env.config";

export const createToken = (user: string | any): string => {
	const id = typeof user === "string" ? user : user.id;
	return jwt.sign({ id: id }, envConfig.ACCESS_SECRET as jwt.Secret, {
		expiresIn: "1y",
	});
};

export const verifyToken = (
	token: string
): Promise<jwt.VerifyErrors | Token> => {
	return new Promise((resolve, reject) => {
		jwt.verify(token, envConfig.ACCESS_SECRET as jwt.Secret, (err, payload) => {
			if (err) return reject(err);

			resolve(payload as Token);
		});
	});
};

export const hashPassword = async (password: string): Promise<string> => {
	try {
		let hashedPassword = bcrypt.hashSync(password, bcrypt.genSaltSync(8));
		return hashedPassword;
	} catch (error: any) {
		console.log("🚀 ~ hashPassword ~ error:", error);
		return error.toString();
	}
};

export const comparePassword = async (
	input_password: string,
	stored_password: string
) => {
	try {
		const isCorrect = bcrypt.compareSync(input_password, stored_password);
		return isCorrect;
	} catch (error: any) {
		console.log("🚀 ~ error:", error);
		return false;
	}
};
