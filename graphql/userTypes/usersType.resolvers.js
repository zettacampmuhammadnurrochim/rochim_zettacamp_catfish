const userTypeModel = require('./userType.model')
const mongoose = require('../../services/services')



/////////////////////////////////////////////////////loader function////////////////////////////////////////////////////

/////////////////////////////////////////////////////query function////////////////////////////////////////////////////

const getAllUsersType = async function (parent, arggs, ctx) {
}

///////////////////////////////////// mutation resolver ////////////////////////////////

const createAllUsersType = async function (parent, arggs, ctx) {
}

const deleteUserType = async function (parent, {id}, ctx) {
    try {
        let result = await userTypeModel.updateOne({_id : mongoose.Types.ObjectId(id), status : 'active'},{
            $set : {
                deletedAt : new Date(),
                status : "deleted"
            }
        })
        return {result : result}
    } catch (error) {
        return new ctx.error(error)
    }
}

const usersResolvers = {
    Query: {
        getAllUsersType
    },
    
    Mutation: {
        createAllUsersType,
        deleteUserType
    }
}

module.exports = usersResolvers