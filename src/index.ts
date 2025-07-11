import express from 'express';
import cors from 'cors';
import { PrismaClient } from '@prisma/client';
import UserRouter from './router/user.router';
import TherapyRouter from './router/theraphy.router';
import jwt from 'jsonwebtoken';

const app = express();
const prisma = new PrismaClient();
const PORT = process.env.PORT || 4000;
const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret';

app.use(cors());
app.use(express.json());

app.get('/', (_, res) => {
    res.send('🌐 API Server up!');
});

app.use('/api/auth', UserRouter);
app.use('/api/therapy', TherapyRouter);

// Chat history route
app.get("/api/messages/getAllMessages/:to", async (req, res) => {
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
});

app.listen(PORT, () => {
    console.log(`🚀 API server running at http://localhost:${PORT}`);
});
