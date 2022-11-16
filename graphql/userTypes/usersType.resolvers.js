const userTypeModel = require('./userType.model')
const mongoose = require('../../services/services')



/////////////////////////////////////////////////////loader function////////////////////////////////////////////////////

/////////////////////////////////////////////////////query function////////////////////////////////////////////////////
// done
const getAllUsersType = async function (parent, arggs, ctx) {
    try {
        let aggregateQuery = []
        if (arggs.match) {
            let indexMatch = aggregateQuery.push({$match : {$and : []} }) - 1
            if (arggs.match.email) {
                const search = new RegExp(arggs.match.email,'i');
                aggregateQuery[indexMatch].$match.$and.push({
                    'email' : search
                })
            }

            if (arggs.match.first_name) {
                const search = new RegExp(arggs.match.first_name,'i');
                aggregateQuery[indexMatch].$match.$and.push({
                    'first_name' : search
                })
            }

            if (arggs.match.last_name) {
                const search = new RegExp(arggs.match.last_name,'i');
                aggregateQuery[indexMatch].$match.$and.push({
                    'last_name' : search
                })
            }
        }
        
        if (arggs.paginator) {
            const {limit, page} = arggs.paginator
            aggregateQuery.push({
                $skip : limit * page
            },
            {
                $limit : limit
            })
        }
        
        let result = []
        arggs.match || arggs.paginator ? result = await userTypeModel.aggregate(aggregateQuery) : result = await userTypeModel.collection.find().toArray()
        return result
    } catch (error) {
        return new ctx.error(error)
    }
}

///////////////////////////////////// mutation resolver ////////////////////////////////
// done
const createAllUsersType = async function (parent, arggs, ctx) {
    try {
        let remember_token = ""
        arggs.data.remember_me ? remember_token = remember_me(30) : remember_token = ""
        
        let inputUser = new userTypeModel({
            first_name : arggs.data.first_name,
            last_name : arggs.data.last_name,
            email : arggs.data.email,
            type : mongoose.Types.ObjectId(arggs.data.type),
            password : await bcrypt.hash(arggs.data.password, 10),
            remember_me : remember_token,
            status : "active"
        })
        
        let validator = await inputUser.validate()
        let result = {}
        !validator ? result = await inputUser.save() : result = {}
        
        delete result.password
        delete result.remember_me

        return result
    } catch (error) {
        return new ctx.error(error)
    }
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