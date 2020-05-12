const express = require("express");
const router = express.Router();
const { check } = require("express-validator");
const { signout, signup, signin, isSignedIn } = require("./../controllers/auth");

router.post(
    "/signup", 
    [
        check("name").isLength({ min: 5}).withMessage("Name should be of minimum 5 chars"),
        check("email", "email is required").isEmail(),
        check("password", "password should be at 3 chars").isLength({ min: 3})
    ], 
    signup
);

router.post(
    "/signin", 
    [
        check("email", "Email is required").isEmail(),
        check("password", "password must be at least 3 Chars").isLength({ min: 3})
    ],
    signin
)

router.get("/signout", signout);

router.get("/test", isSignedIn, (req, res)=>{
    res.json(req.auth);
})

module.exports = router;