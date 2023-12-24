import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js"
import { User } from "../models/user.model.js"
import {uploadOnCloudinary} from "../utils/cloudinary.js"
import { ApiResponse } from "../utils/ApiResponse.js";
const registerUser = asyncHandler(async (req, res) => {
    // get user details from frontend
    const { fullName, email, username, password } = req.body
    
    //validation - not empty
    // if (fullName == "") {
    //     throw new ApiError(400,"fullname is required")
    // }
    // ek bhi field nai true return kiya to wo khaali hai
    if ([fullName, email, username, password].some((field) => field?.trim === "")) {
        throw new ApiError(400,"All field are required")
    }

    // check if user already exists: username, email
    const existedUser = await User.findOne({
        $or : [{username}, {email}]
    })
    if (existedUser) {
        throw new ApiError(409,"User with email or username already exists")
    }
    // check for images , check for avatar
    // get the file path where the avatar was temperorylily stored by multer
    const avatarLocalPath = req.files?.avatar[0]?.path?.replace(/\\/g, '/');
    // const coverImageLocalPath = req.files?.coverImage[0]?.path?.replace(/\\/g, '/');

    let coverImageLocalPath;
    if (req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0) {
        coverImageLocalPath = req.files.coverImage[0].path.replace(/\\/g, '/');
    }
    if (!avatarLocalPath) {
        throw new ApiError(400,"Avatar file is required")
    }
    // upload them to cloudinary : avatar
    const avatar = await uploadOnCloudinary(avatarLocalPath)
    const coverImage = await uploadOnCloudinary(coverImageLocalPath)
    if (!avatar) {
        throw new ApiError(400,"Avatar file isisis required")
    }
    //create user object : create entry in DB

    const user = await User.create({
        fullName,
        avatar: avatar.url,
        coverImage: coverImage?.url || "",
        email,
        password,
        username : username.toLowerCase()
    })
    
    // remove password and refresh token field from response

    const createdUser = await User.findById(user._id).select(
        // what do we not want
        "-password -refreshToken"
    )
    // check for user creation
    if(!createdUser){
        throw new ApiError(500,"Something went wrong while registering user")
    }
    // return result
    return res.status(201).json(
        new ApiResponse(200,createdUser,"User Registered Successfully")
    )

})

export {registerUser}