const asyncHandler = (requestHandler) => {
    (req, res, next) => {
        Promise.resolve(requestHandler(req, res, next)).
        catch((err)=>next(err))
    }
}

export { asyncHandler }

// const asyncHandler = () => {}
// const asyncHandler = (func) => () => {}

// ONE way is to do like this
// so the function taking a function as an argument is a Higher Order Function
// callback function -> a function that is being called as a parameter inside a function
// func = () => {
    
// }
// const asyncHandler => (func) => {
//     func()
// }
// const asyncHandler => (func) => async (req, res, next) => {
//     try {
//         await func(req, res, next)
//     } catch (error) {
//         res.status(error.code || 500).json({
//             success: false,
//             message: error.message
//         })
//     }
// }