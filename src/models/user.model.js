import mongoose, {Schema} from "mongoose";
import jsonwebtoken from "jsonwebtoken";
import bcrypt from "bcrypt"

// jwt is a bearer token
// jo use bear karta hai matlab ye jo bhi bhejega usko ye data bhej dega
const userSchema = new Schema(
    {
        username: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true,
            index : true
        },
        email: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true,
        },       
        fullName: {
            type: String,
            required: true,
            unique: true,
            trim: true,
            index : true
        },
        avtar: {
            type: String, // cloudinary url
            required: true
        },
        coverimage: {
            type: String, // cloudinary url
        },
        watchHistory: [{
            type: Schema.Types.ObjectId, 
            ref : "Video"
        }],
        password: {
            type: String,
            required : [true,'Password is required']
        },
        refreshToken: {
            type: String, 
        }
    },
    {
        timestamps : true
    }
)
// data save hone se pehle we have to preform this funcitonality
// () => we do not write like it as it does not have reference of thisas it will need access of userSchema values
userSchema.pre("save", async function (next) {
    if (!this.isModified("password")) return next();
    this.password = bcrypt.hash(this.password,10)
    next()
})

userSchema.methods.isPasswordCorrect = async function (password) {
   return await bcrypt.compare(password,this.password)
}

userSchema.methods.generateAccessToken = function () {
    return jwt.sign(
        {
            _id: this._id,
            email: this.email, //this.email is coming from database email is payload key
            username: this.username,  // payload
            fullName : this.fullName
        },
        process.env.ACCESS_TOKEN_SECRET, // secret key
        {
            expiresIn : process.env.ACCESS_TOKEN_EXPIRY
        }
    )
}

userSchema.methods.generateRefreshToken = function () {
    return jwt.sign(
        {
            _id: this._id, // refresh token has less information beacause it get refreshed again and agian
        },
        process.env.REFRESH_TOKEN_SECRET, // secret key
        {
            expiresIn : process.env.REFRESH_TOKEN_EXPIRY
        }
    )    
}

export const User = mongoose.model("User",userSchema)