"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const therapy_controller_1 = __importDefault(require("../controller/therapy.controller"));
const TherapyRouter = (0, express_1.Router)();
// GET all therapists
TherapyRouter.get("/therapists", therapy_controller_1.default.getAllTheraphist);
// GET single therapist by ID
TherapyRouter.get("/therapists/:id", therapy_controller_1.default.getTheraphyById);
// POST book a therapy session
TherapyRouter.post("/book", therapy_controller_1.default.bookATheraphy);
// GET all sessions for a user
TherapyRouter.get("/sessions", therapy_controller_1.default.getUserTherapies);
// GET create fictional theraphist.
TherapyRouter.get("/create-fictional-therapist", therapy_controller_1.default.createMockTherapists);
// DELETE a therapy session
TherapyRouter.delete("/sessions/:sessionId", therapy_controller_1.default.cancelTherapy);
exports.default = TherapyRouter;
