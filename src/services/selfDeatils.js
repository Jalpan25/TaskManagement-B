const prisma = require("../prisma");
exports.selfDetails=async (userId)=>{
    //console.log(userId);
    const user=await prisma.user.findFirst(
        {
        where:{
            id:Number(userId),
        },
        select:{
            name:true,
            email:true,
            role:true,
            createdAt:true
        }
    })
    return user;
}

// exports.changeSelfDeatils=async(userId,userDeatls)=>{
//     console.log(userId);
//     console.log(userDeatls);
//     const {name,email}=userDeatls;
//     const user=await prisma.user.update(
//         {
//             where:{id:userId},
//             data:{
//                 name:name,
//                 email:email,
//             },
//             select:{
//                 name:true,
//                 email:true,
//             }
//         }
//     )
//     return user;
// }
