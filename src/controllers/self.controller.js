const selfDetailsService=require("../services/selfDeatils");
exports.selfDetails=require("../services/selfDeatils.js")
exports.getSelfDeatils=async(req,res)=>{
    try{
        const task=await selfDetailsService.selfDetails(Number(req.user.id));
        return res.status(200).json(
            task
        );
    }
    catch(err)
    {
        return res.status(400).json({
            message:"Failed to Fetch",
            err,
        })
    }
}

// exports.changeSelfDeatils=async(req,res)=>{
//     try{
//         const userId=Number(req.params.userId);
//         if(!Number.isInteger(userId))
//         {
//             return res.status(400).json({
//                 message:"Invalid type of UserId"
//             }
//             )
//         }
//         const uid=Number(req.user.id);
//         if(userId!=uid)
//         {
//             return res.status(400).json({
//                 message:"You can not change other Personal Data"
//             }
//             )
//         }
//         const data=req.body;
//         const userDeatils=await selfDetailsService.changeSelfDeatils(userId,data);
//         return res.status(200).json({
//             data:userDeatils
//         })
//     }
//     catch(err)
//     {
//         return res.status(400).json({
//             message:"Failed to Update",
//             err,
//         })
//     }
// }