"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const therapist_controller_1 = __importDefault(require("../controller/therapist.controller"));
const TherapistRouter = (0, express_1.Router)();
TherapistRouter.get('/sessions/upcoming', therapist_controller_1.default.UpcomingEvents);
exports.default = TherapistRouter;
