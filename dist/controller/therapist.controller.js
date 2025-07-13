"use strict";
// routes/therapistSessions.ts
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const edge_1 = require("@prisma/client/edge");
const extension_accelerate_1 = require("@prisma/extension-accelerate");
const prisma = new edge_1.PrismaClient().$extends((0, extension_accelerate_1.withAccelerate)());
const router = (0, express_1.Router)();
const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret';
class TherapistController {
    UpcomingEvents(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            const authHeader = req.headers.authorization;
            if (!authHeader || !authHeader.startsWith('Bearer ')) {
                return res.status(401).json({ error: 'Unauthorized' });
            }
            const token = authHeader.split(' ')[1];
            let decoded;
            try {
                decoded = jsonwebtoken_1.default.verify(token, JWT_SECRET);
            }
            catch (err) {
                return res.status(401).json({ error: 'Invalid token' });
            }
            const userId = decoded.userId;
            if (!userId) {
                return res.status(400).json({ error: 'Invalid user ID in token' });
            }
            const user = yield prisma.user.findUnique({
                where: { id: userId },
                select: { type: true }
            });
            if (!user || user.type !== 'THERAPIST') {
                return res.status(403).json({ error: 'Access denied: not a therapist' });
            }
            const now = new Date();
            const twoHoursAgo = new Date(now.getTime() - 2 * 60 * 60 * 1000);
            const sessions = yield prisma.therapy.findMany({
                where: {
                    therapistId: userId,
                    date: {
                        gte: twoHoursAgo
                    }
                },
                orderBy: {
                    date: 'asc'
                },
                include: {
                    client: {
                        select: {
                            id: true,
                            name: true,
                            email: true
                        }
                    }
                }
            });
            return res.json({ sessions });
        });
    }
}
exports.default = new TherapistController();
