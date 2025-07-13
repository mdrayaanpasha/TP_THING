"use strict";
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
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const edge_1 = require("@prisma/client/edge");
const extension_accelerate_1 = require("@prisma/extension-accelerate");
const prisma = new edge_1.PrismaClient().$extends((0, extension_accelerate_1.withAccelerate)());
const JWT_SECRET = process.env.JWT_SECRET || "your_jwt_secret";
class MessagesController {
    GetAllMessages(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const authHeader = req.headers.authorization;
                if (!(authHeader === null || authHeader === void 0 ? void 0 : authHeader.startsWith("Bearer "))) {
                    return res.status(401).json({ error: "Unauthorized" });
                }
                const token = authHeader.split(" ")[1];
                const decoded = jsonwebtoken_1.default.verify(token, JWT_SECRET);
                const fromId = decoded.userId;
                const toId = parseInt(req.params.to, 10);
                if (!fromId || isNaN(toId)) {
                    return res.status(400).json({ error: "Invalid user ID(s)" });
                }
                const messages = yield prisma.message.findMany({
                    where: {
                        OR: [
                            { fromId, toId },
                            { fromId: toId, toId: fromId }
                        ]
                    },
                    orderBy: { createdAt: 'asc' }
                });
                res.status(200).json(messages);
            }
            catch (err) {
                console.error("❌ Error fetching messages", err);
                res.status(500).json({ error: "Internal server error" });
            }
        });
    }
}
exports.default = new MessagesController();
