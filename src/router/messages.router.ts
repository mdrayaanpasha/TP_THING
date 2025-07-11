import { Router } from "express";
import messagesController from "../controller/messages.controller";

const messageRouter = Router();

messageRouter.get('/getAllMessages/:to', messagesController.GetAllMessages)

export default messageRouter;


