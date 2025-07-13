"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const user_controller_1 = require("../controller/user.controller");
const UserRouter = (0, express_1.Router)();
UserRouter.post("/register", user_controller_1.UserAuth.register);
UserRouter.post("/login", user_controller_1.UserAuth.login);
exports.default = UserRouter;
