import envConfig from "../env.config";
import App from "./app";
import UploadController from "./resources/uploads/uploads.controller";
import UserController from "./resources/user/user.controller";

const app = new App(
	[new UserController(), new UploadController()],
	Number(envConfig.NODE_PORT)
);
app.listen();
