import express from "express"
import cookieParser from "cookie-parser";
import cors from "cors"

const app = express();
// middlewares
app.use(cors({
    origin: process.env.CORS_ORIGIN,
    credentials : true
}));

// to get data from json
app.use(express.json({
    limit : "16kb"
}))
//when we get data from URL's
// extended means we will be able to use object inside object
app.use(express.urlencoded({
    extended : true
}))
// public asssets which anyone can use
app.use(express.static("public"))

app.use(cookieParser());



export {app}