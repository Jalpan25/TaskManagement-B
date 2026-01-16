const express=require("express");
const router=express.Router();
const auth=require("../middleware/auth.middleware")
const selfController=require("../controllers/self.controller")

router.get("/self",auth,selfController.getSelfDeatils);

// router.post("/self/:userId",auth,selfController.changeSelfDeatils);

module.exports=router;


