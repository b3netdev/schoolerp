import express from "express";
import { alreadyExistsBy
 } from "../helper/helper.js";


const router = express.Router();

router.post('/alreadyExistsBy', alreadyExistsBy)


export default router;