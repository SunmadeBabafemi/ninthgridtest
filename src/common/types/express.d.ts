import { User } from "../../db/entites/user.entity";

declare global {
	namespace Express {
		export interface Request {
			user: User;
		}
	}
}
