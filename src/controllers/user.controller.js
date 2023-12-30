import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js"
import { User } from "../models/user.model.js"
import {uploadOnCloudinary} from "../utils/cloudinary.js"
import { ApiResponse } from "../utils/ApiResponse.js";
import jwt from "jsonwebtoken";

const generateAccessAndRefereshTokens = async(userId) =>{
    try {
        const user = await User.findById(userId)
        const accessToken = user.generateAccessToken()
        const refreshToken = user.generateRefreshToken()

        user.refreshToken = refreshToken
        await user.save({ validateBeforeSave: false })
        return {accessToken, refreshToken}

    } catch (error) {
        throw new ApiError(500,"Something went wrong while generating access and refresh token")
    }
}
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

const loginUser = asyncHandler(async (req, res) => {
    // req body -> data
    const { email, username, password } = req.body

    // username or email
    if (!username && !email) {
        throw new ApiError(400,"username or email is required")
    }
    // find the user
    const user = await User.findOne({
        $or: [{username},{email}]
    })

    if (!user) {
        throw new ApiError(404,"user does not exists")
    }
    // password check 
    const isPasswordValid = await user.isPasswordCorrect(password)
    if (!isPasswordValid) {
        throw new ApiError(401,"Invalid User credentials")
    }
    // access and refresh token generate
    const {accessToken, refreshToken} = await generateAccessAndRefereshTokens(user._id)
    const loggedInUser = await User.findById(user._id).select("-password -refreshToken")
    // send cookies

    const options = {
        httpOnly: true, //when we do this we will not be able to update cookies from frontend and can only be updated from server
        secure: true
    }

    return res
        .status(200)
        .cookie("accessToken", accessToken, options)
        .cookie("refreshToken", refreshToken, options)
        .json(
            new ApiResponse(
                200,
                {
                    user: loggedInUser,accessToken,refreshToken
                },
                "User Logged in Successfully"
            )
        )
})

const logoutUser = asyncHandler(async (req,res) => {
    User.findByIdAndUpdate(
        req.user._id,
        {
            $set: {
                refreshToken: undefined
            }
        },
        {
            new : true
        }
    )
    const options = {
        httpOnly: true, //when we do this we will not be able to update cookies from frontend and can only be updated from server
        secure: true
    }
    return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(new ApiResponse(200,{},"User Logged out"))

})

const refreshAccessToken = asyncHandler(async (req, res) => {
    const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken
    if (!incomingRefreshToken) {
        throw new ApiError(401, "unauthorized request")
    }
    try {
        const decodedToken = jwt.verify(incomingRefreshToken, process.env.REFRESH_TOKEN_SECRET)
        const user = await User.findById(decodedToken?._id)
    
        if (!user) {
            throw new ApiError(401, "Invalid Refresh Token")
        }
        if (incomingRefreshToken != user?.refreshToken) {
            throw new ApiError(401, "Refresh Token is Expired or used")
        }
    
        const options = {
            httpOnly: true, //when we do this we will not be able to update cookies from frontend and can only be updated from server
            secure: true
        }
        const {accessToken, newrefreshToken} = await generateAccessAndRefereshTokens(user._id)
        return res
            .status(200)
            .cookie("accessToken", accessToken, options)
            .cookie("refreshToken", newrefreshToken, options)
            .json(
                new ApiResponse(
                    200,
                    {
                        accessToken, refreshToken : newrefreshToken
                    },
                    "Access Token refreshed"
                )
            )
    } catch (error) {
        throw new ApiError(401,error?.message || "Invalid Refresh Token")
    }
})

const changeCurrentPassword = asyncHandler(async (req, res) => {
    const { oldPassword, newPassword } = req.body
    const user = await User.findById(req.user?._id)
    const isPasswordCorrect = await user.isPasswordCorrect(oldPassword)
    if (!isPasswordCorrect) {
        throw new ApiError(400, "Invalid Password")
    }
    user.password = newPassword;
    await user.save({ validateBeforeSave: false })
    return res
    .status(200)
    .json(new ApiResponse(200,{},"Password has been Updated"))
})

const getCurrentUser = asyncHandler(async(req,res)=>{
    res
    .status(200)
    .json(200, req.user, "current user fetched successfully") 
})

const updateAccountDetails = asyncHandler(async (req, res) => {
    const { fullName, email } = req.body
    if (!fullName || !email) {
        throw new ApiError(400, "All fields are required")
    }
    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set: {
                fullName,
                email  // email:email
            }
        },
        {new : true}
    ).select("-password")

    return res.status(200).json(new ApiResponse(200,user,"Acount details Updated Successfully"))
})

const updateUserAvatar = asyncHandler(async (req, res) => {
    const avatarLocalPath = req.file?.path.replace(/\\/g, '/');
    if (!avatarLocalPath) {
        throw new ApiError(400,"avatar file is missing")
    }

    const avatar = await uploadOnCloudinary(avatarLocalPath)
    if (!avatar.url) {
        throw new ApiError(400,"Error while Uploading avatar")
    }
    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set: {
                avatar : avatar.url
            }
        },
        {new : true}
    ).select("-password")

    return res
    .status(200)
    .json(new ApiResponse(200, user, "Avatar Updated Successfully"))
})

const updateUserCoverImage = asyncHandler(async (req, res) => {
    const coverImageLocalPath = req.file?.path.replace(/\\/g, '/');
    if (!coverImageLocalPath) {
        throw new ApiError(400,"CoverImage file is missing")
    }

    const coverImage = await uploadOnCloudinary(coverImageLocalPath)
    if (!coverImage.url) {
        throw new ApiError(400,"Error while Uploading CoverImage")
    }
    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set: {
                coverImage : coverImage.url
            }
        },
        {new : true}
    ).select("-password")

    return res
    .status(200)
    .json(new ApiResponse(200, user, "CoverImage Updated Successfully"))
})
export {
    registerUser,
    loginUser,
    logoutUser,
    refreshAccessToken,
    changeCurrentPassword,
    getCurrentUser,
    updateAccountDetails,
    updateUserAvatar,
    updateUserCoverImage
}