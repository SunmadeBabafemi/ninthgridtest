import Knex from "knex";
import knexConfig from "../../knexfile";

const environment = process.env.NODE_ENV || "development";
console.log("🚀 ~ environment:", environment);
const knex = Knex(knexConfig[environment]);
// knex
// 	.raw("SELECT 1")
// 	.then(() => console.log("MySQL Database connected successfully"))
// 	.catch((error) => {
// 		console.error(" MySQL Database connection failed:", error);
// 		process.exit(1);
// 	});

export default knex;
