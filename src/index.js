import dotenv from "dotenv"
import connnectDB from "./db/index.js";
import { app } from "./app.js";
dotenv.config();
const PORT = process.env.PORT || 8000;
// this is an asysnchronous code so it will return a promise and we can use .then
connnectDB()
.then(() => {
    app.listen(PORT, () => {
        console.log(`Connected to Port ${PORT}`);
    })
}).catch((err) => {
    console.log("MongoDB Connection failed",err);
})