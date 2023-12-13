class ApiResponse{
    constructor(statusCode, data, message = "Success") {
        this.statusCode = statusCode
        this.data = data
        this.message = message
        this.success = statusCode<400   
    }
}   

// jwt - main is payload where our data goes like id etc
