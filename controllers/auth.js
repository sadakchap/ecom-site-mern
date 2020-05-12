const User = require("../models/user");
const { validationResult } = require("express-validator");
const jwt = require("jsonwebtoken");
const expressJwt = require("express-jwt");

exports.signup = (req, res) => {

    const errors = validationResult(req);
    if(!errors.isEmpty()){

        return res.status(422).json({
            errors: errors.array()
        });
    }

    const user = new User(req.body);
    user.save((err, user) => {
        if(err){
			console.log(err)
            return res.status(400).json({
                err: "NOT ABLE TO SAVE USER IN DB"
            })
		}
		
        res.send({
            id: user._id,
            name: user.name,
            email: user.email
        })
    }) 
    
    
};

exports.signin = (req, res) => {
    const { email, password } = req.body;
    
    // check for validations error
    const errors = validationResult(req);
    if( !errors.isEmpty() ){
        return res.status(402).json({
            error: errors.array()
        })
    }

    // find user by email in db
    User.findOne({email}, (err, user) => {
        if(err || !user){
            return res.status(400).json({
                error: "USER DOESN'T EXISTS"
            })
        }
        if (!user.authenticate(password)){
            return res.status(401).json({
                error: "Email and Password doesn't match!"
            })
        }

        // create token
        const token = jwt.sign({ _id: user._id }, process.env.SECRET);
        
        // put token in user's cookie
        res.cookie("token", token, { expire: new Date() + 9999 })

        // send response to frontend
        const {_id, name, email, role} = user;
        return res.json({
            token: token,
            user: {_id, name, email, role}
        })


    })
}

exports.signout = (req, res) => {
    
    res.clearCookie("token")

    res.json({
        message: "user signout controllers"
    });
};

// protected routes
exports.isSignedIn = expressJwt({
    secret: process.env.SECRET,
    userProperty: "auth" // puts "auth" key in request obj
});


// custom middleware
exports.isAuthenticated = (req, res, next) => {
    let checker = req.profile && req.auth && req.profile._id == req.auth._id
    if(!checker){
        return res.status(403).json({
            error: "Access Denied"
        })
    }
    next();
}

exports.isAdmin = (req, res, next) => {
    // if role = 0 then normal user else if role = 1 then admin user
    if (!req.profile.role){
        return res.status(403).json({
            error: "Access Denied, You are not ADMIN!"
        });
    }
    next();
};