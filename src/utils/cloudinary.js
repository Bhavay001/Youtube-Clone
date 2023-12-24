import {v2 as cloudinary} from 'cloudinary';
import fs from "fs"       
cloudinary.config({ 
  cloud_name: 'bhavay', 
  api_key: '997561967964434', 
  api_secret: 'zaJ0yn9am6SanacXQL0D5Ruitu8' 
});         
 
// file local server par aa chuki hai now we will upload to clodinary from local path
// remove file from local server after it has been uploaded

const uploadOnCloudinary = async (localFilePath) => {
    try {
        if (!localFilePath) return null
        //upload the file on cloudinary
        // console.log(localFilePath)

        const response = await cloudinary.uploader.upload(localFilePath, {
            resource_type: "auto"
        })
        // file has been uploaded successfully
        // console.log("file is uploaded on cloudinary", response.url)
        fs.unlinkSync(localFilePath)
        return response
    } catch (error) {
        fs.unlinkSync(localFilePath) // remove the locally saved temporary file as the upload operation got failed
        return null;
    }      
}   

export {uploadOnCloudinary}