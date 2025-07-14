import { Request, Response } from "express";
import jwt from 'jsonwebtoken';
import dotenv from "dotenv";
dotenv.config();
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient()

const JWT_SECRET = process.env.JWT_SECRET || "your_jwt_secret"

class MessagesController {
    async GetAllMessages(req: Request, res: Response): Promise<any> {
        try {
            const authHeader = req.headers.authorization;
            if (!authHeader?.startsWith("Bearer ")) {
                return res.status(401).json({ error: "Unauthorized" });
            }

            const token = authHeader.split(" ")[1];
            const decoded: any = jwt.verify(token, JWT_SECRET);
            const fromId = decoded.userId;
            const toId = parseInt(req.params.to, 10);

            if (!fromId || isNaN(toId)) {
                return res.status(400).json({ error: "Invalid user ID(s)" });
            }

            const messages = await prisma.message.findMany({
                where: {
                    OR: [
                        { fromId, toId },
                        { fromId: toId, toId: fromId }
                    ]
                },
                orderBy: { createdAt: 'asc' }
            });

            res.status(200).json(messages);
        } catch (err) {
            console.error("❌ Error fetching messages", err);
            res.status(500).json({ error: "Internal server error" });
        }
    }
}

export default new MessagesController()