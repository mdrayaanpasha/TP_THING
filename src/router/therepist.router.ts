
import { Router } from "express";
import therapistController from "../controller/therapist.controller";

const TherapistRouter = Router();

TherapistRouter.get('/sessions/upcoming', therapistController.UpcomingEvents);

export default TherapistRouter;
