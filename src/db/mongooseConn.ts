import mongoose from "mongoose";
import envConfig from "../../env.config";

export const connectMongo = async () => {
	await mongoose
		.connect(envConfig.MONGO_URI, {})
		.then(() => {
			console.log("MongoDB connected");
		})
		.catch((err) => {
			console.error("MongoDB connection error:", err);
		});
	mongoose.connection.on("error", (err) => {
		console.error("MongoDB connection error:", err);
	});
	mongoose.connection.on("disconnected", () => {
		console.log("MongoDB disconnected");
	});
};
