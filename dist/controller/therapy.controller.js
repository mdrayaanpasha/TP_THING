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
const bcrypt_1 = __importDefault(require("bcrypt"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const edge_1 = require("@prisma/client/edge");
const extension_accelerate_1 = require("@prisma/extension-accelerate");
const prisma = new edge_1.PrismaClient().$extends((0, extension_accelerate_1.withAccelerate)());
const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret';
class TheraphyController {
    // Get all therapists
    getAllTheraphist(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const therapists = yield prisma.user.findMany({
                    where: {
                        type: 'THERAPIST'
                    }
                });
                return res.status(200).json({ data: therapists });
            }
            catch (error) {
                console.error(error);
                return res.status(500).json({ message: "Error in backend", error });
            }
        });
    }
    // Get therapist by ID
    getTheraphyById(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { id } = req.params;
                const therapistId = Number(id);
                if (isNaN(therapistId)) {
                    return res.status(400).json({ message: "Invalid therapist ID" });
                }
                const therapist = yield prisma.user.findFirst({
                    where: {
                        id: therapistId,
                        type: 'THERAPIST'
                    }
                });
                if (!therapist) {
                    return res.status(404).json({ message: "Therapist not found" });
                }
                return res.status(200).json({ data: therapist });
            }
            catch (error) {
                console.error(error);
                return res.status(500).json({ message: "Internal server error", error });
            }
        });
    }
    // Book a therapy session
    bookATheraphy(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { therapistId, date, title, therapyType } = req.body;
                const authHeader = req.headers.authorization;
                if (!authHeader || !authHeader.startsWith("Bearer ")) {
                    return res.status(401).json({ message: "Missing or invalid Authorization header" });
                }
                const token = authHeader.split(" ")[1];
                let decoded;
                try {
                    decoded = jsonwebtoken_1.default.verify(token, JWT_SECRET);
                }
                catch (err) {
                    return res.status(401).json({ message: "Invalid or expired token" });
                }
                const clientId = decoded.userId;
                if (!therapistId || !date) {
                    return res.status(400).json({ message: "Missing required fields" });
                }
                const parsedDate = new Date(date);
                if (isNaN(parsedDate.getTime())) {
                    return res.status(400).json({ message: "Invalid date format" });
                }
                const therapist = yield prisma.user.findUnique({
                    where: { id: therapistId },
                });
                if (!therapist || therapist.type !== 'THERAPIST') {
                    return res.status(404).json({ message: "Therapist not found" });
                }
                const existingBooking = yield prisma.therapy.findFirst({
                    where: {
                        therapistId,
                        date: parsedDate,
                    },
                });
                if (existingBooking) {
                    return res.status(409).json({ message: "Therapist already booked at this time" });
                }
                const booking = yield prisma.therapy.create({
                    data: {
                        therapistId,
                        clientId,
                        therapyType,
                        date: parsedDate,
                        title,
                    }
                });
                return res.status(201).json({ message: "Therapy session booked", data: booking });
            }
            catch (error) {
                console.error(error);
                return res.status(500).json({ message: "Failed to book therapy session", error });
            }
        });
    }
    // List all therapy sessions for a user, excluding those older than 2 hours
    getUserTherapies(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const authHeader = req.headers.authorization;
                if (!authHeader || !authHeader.startsWith('Bearer ')) {
                    return res.status(401).json({ message: 'Missing or invalid Authorization header' });
                }
                const token = authHeader.split(' ')[1];
                let decoded;
                try {
                    decoded = jsonwebtoken_1.default.verify(token, JWT_SECRET);
                }
                catch (err) {
                    return res.status(401).json({ message: 'Invalid or expired token' });
                }
                const userId = decoded.userId;
                const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000);
                const sessions = yield prisma.therapy.findMany({
                    where: {
                        clientId: userId,
                        date: {
                            gte: twoHoursAgo,
                        },
                    },
                    include: {
                        therapist: true,
                    },
                });
                return res.status(200).json({ data: sessions });
            }
            catch (error) {
                console.error(error);
                return res.status(500).json({ message: "Unable to fetch user sessions", error });
            }
        });
    }
    // Cancel a session
    cancelTherapy(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { sessionId } = req.params;
                const authHeader = req.headers.authorization;
                if (!authHeader || !authHeader.startsWith('Bearer ')) {
                    return res.status(401).json({ message: 'Missing or invalid Authorization header' });
                }
                const token = authHeader.split(' ')[1];
                let decoded;
                try {
                    decoded = jsonwebtoken_1.default.verify(token, JWT_SECRET);
                }
                catch (err) {
                    return res.status(401).json({ message: 'Invalid or expired token' });
                }
                const userId = decoded.id;
                // First fetch the session
                const session = yield prisma.therapy.findUnique({
                    where: { id: Number(sessionId) }
                });
                if (!session) {
                    return res.status(404).json({ message: "Session not found" });
                }
                const deleted = yield prisma.therapy.delete({
                    where: { id: Number(sessionId) }
                });
                return res.status(200).json({ message: "Session cancelled", data: deleted });
            }
            catch (error) {
                console.error(error);
                return res.status(500).json({ message: "Failed to cancel session", error });
            }
        });
    }
    // Create 5 fictional therapists
    createMockTherapists(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const mockTherapists = [
                    { name: "Dr. Lara Mind", email: "lara@calm.com" },
                    { name: "Dr. Neil Thoughtson", email: "neil@focus.io" },
                    { name: "Dr. Mira Chillwell", email: "mira@zenpath.org" },
                    { name: "Dr. Zen Moon", email: "zen@mindspace.ai" },
                    { name: "Dr. Felix Talkmore", email: "felix@healtalk.com" },
                ];
                const password = "secureTherapy123";
                const hashedPassword = yield bcrypt_1.default.hash(password, 10);
                const createdTherapists = yield Promise.all(mockTherapists.map(t => prisma.user.create({
                    data: {
                        name: t.name,
                        email: t.email,
                        password: hashedPassword,
                        type: "THERAPIST",
                    }
                })));
                return res.status(201).json({ message: "Mock therapists created", data: createdTherapists });
            }
            catch (error) {
                console.error(error);
                return res.status(500).json({ message: "Error creating mock therapists", error });
            }
        });
    }
}
exports.default = new TheraphyController();
