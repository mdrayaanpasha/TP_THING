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
exports.UserAuth = void 0;
const bcrypt_1 = __importDefault(require("bcrypt"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const edge_1 = require("@prisma/client/edge");
const extension_accelerate_1 = require("@prisma/extension-accelerate");
const prisma = new edge_1.PrismaClient().$extends((0, extension_accelerate_1.withAccelerate)());
const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret';
class UserAuth {
    // Register a new user
    static register(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            const { name, email, password, type, price } = req.body;
            if (!name || !email || !password || !type) {
                return res.status(400).json({ message: "Missing required fields" });
            }
            try {
                const hashedPassword = yield bcrypt_1.default.hash(password, 10);
                let user;
                if (type === "THERAPIST") {
                    let p = parseInt(price);
                    user = yield prisma.user.create({
                        data: { name, email, password: hashedPassword, type, price: p }
                    });
                }
                else {
                    user = yield prisma.user.create({
                        data: { name, email, password: hashedPassword, type }
                    });
                }
                const token = jsonwebtoken_1.default.sign({ userId: user.id, type: user.type }, JWT_SECRET, { expiresIn: '7d' });
                return res.status(201).json({ message: "User registered successfully", token });
            }
            catch (e) {
                if (e.code === 'P2002') { // Prisma unique constraint error
                    return res.status(409).json({ message: "Email already in use" });
                }
                console.log(e);
                return res.status(500).json({ message: "Server error", error: e.message });
            }
        });
    }
    // Login user and return JWT token
    static login(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            const { email, password } = req.body;
            if (!email || !password) {
                return res.status(400).json({ message: "Email and password are required" });
            }
            try {
                const user = yield prisma.user.findUnique({ where: { email } });
                if (!user) {
                    return res.status(404).json({ message: "User not found" });
                }
                const valid = yield bcrypt_1.default.compare(password, user.password);
                if (!valid) {
                    return res.status(401).json({ message: "Invalid password" });
                }
                const token = jsonwebtoken_1.default.sign({ userId: user.id, type: user.type }, JWT_SECRET, { expiresIn: '7d' });
                return res.status(200).json({ message: "Logged in successfully", token });
            }
            catch (error) {
                console.error(error);
                return res.status(500).json({ message: "Server error", error: error.message });
            }
        });
    }
    // Verify JWT token
    static verifyToken(token) {
        try {
            return jsonwebtoken_1.default.verify(token, JWT_SECRET);
        }
        catch (_a) {
            return null;
        }
    }
}
exports.UserAuth = UserAuth;
exports.default = new UserAuth();
