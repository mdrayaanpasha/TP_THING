"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const messages_controller_1 = __importDefault(require("../controller/messages.controller"));
const messageRouter = (0, express_1.Router)();
messageRouter.get('/getAllMessages/:to', messages_controller_1.default.GetAllMessages);
exports.default = messageRouter;
