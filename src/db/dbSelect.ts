import envConfig from "../../env.config";
import { DatabaseChoice } from "../common/enums";
import knex from "./knex";
import { connectMongo } from "./mongooseConn";

export const dbSelect = async () => {
	switch (envConfig.DATABASE_CHOICE) {
		case DatabaseChoice.MYSQL:
			return await knex
				.raw("SELECT 1")
				.then(() => console.log("MySQL Database connected successfully"))
				.catch((error) => {
					console.error("MySQL Database connection failed:", error);
					process.exit(1);
				});

		default:
			return await connectMongo();
			break;
	}
};
