import { Router } from "express";
import { UserAuth } from "../controller/user.controller";

const UserRouter = Router();


UserRouter.post("/register", UserAuth.register);
UserRouter.post("/login", UserAuth.login);


export default UserRouter;