
const transactionsModel = require('./transaction.model')
const mongoose = require('../../services/services')
const {GraphQLScalarType,Kind} = require('graphql')
const {validateStockIngredient,reduceIngredientStock} = require('./transaction.utility')

/////////////////////////////////////////////////////loader function////////////////////////////////////////////////////
const getRecipesLoader = async function (parent, arggs, ctx) {
    if (parent.recipe_id) {
        const result = await ctx.recipesLoader.load(parent.recipe_id)
        return result;
    }
}
const getUsersLoader = async function (parent, arggs, ctx) {
    if (parent) {
        const result = await ctx.usersLoader.load(parent)
        return result;
    }
}
/////////////////////////////////////////////////////query function////////////////////////////////////////////////////
// already test
const getUserTransactionHistory = async function (parent, arggs, ctx) {
    try {
        const userid = ctx.req.headers.userid
        let querySort = { $sort: {} }
        let aggregateQuery = []
        
        let matchQuery = {$match : {$and : [
            {
            "user_id" : mongoose.Types.ObjectId(userid)
            },
            {
            "order_status" : {$ne : "pending"}
            }
        ]} }

        aggregateQuery.push(matchQuery)
        querySort.$sort.createdAt = -1
        aggregateQuery.push(querySort)

        if (arggs.paginator) {
            let total_items = 0
            if (arggs.match && aggregateQuery.length) {  
                total_items = await transactionsModel.aggregate(aggregateQuery) 
                total_items = total_items.length
            }else{
                total_items = await transactionsModel.count() 
            }
            const {limit, page} = arggs.paginator
            const skip = limit * page
            aggregateQuery.push({
                $skip : skip
            },
            {
                $limit : limit
            })

            let showing = `Showing ${skip+1} to ${Math.min(total_items , skip+limit)} from ${total_items} entries`
            let total_page = Math.ceil(total_items/limit)
            let position = `${page+1}/${total_page}`
           
            paginator = {
                total_items : total_items,
                showing : showing,
                total_page : total_page,
                position : position,
            }
        }
        let result = []
        arggs.match || arggs.paginator ? result = await transactionsModel.aggregate(aggregateQuery) : result = await transactionsModel.find({ status: 'active' }).sort({ createdAt : -1 })
        return {data : result, paginator : paginator}
    } catch (error) {
        return new ctx.error(error)
    }
}

const getAllTransactions = async function (parent, arggs, ctx) {
    try {
        let aggregateQuery = []
        let lookupQuery = []
        let addfieldsQuery = {$addFields : {}}
        let matchQuery = {$match : {$and : []} }
        let projectQuery = {$project : {}}
        if (arggs.match) {

            if(arggs.match.last_name_user || arggs.match.recipe_name) { // its aggregate where need lookup,addfields,match,and project
            
                if (arggs.match.last_name_user) {

                    lookupQuery.push({
                        $lookup : {
                            from: "users",
                            localField: "user_id",
                            foreignField: "_id",
                            as: "user_detail"
                        }
                    })
                    
                    addfieldsQuery.$addFields.user_first_name = {$first : "$user_detail.first_name"}
                    addfieldsQuery.$addFields.user_last_name = {$first : "$user_detail.last_name"}
                    addfieldsQuery.$addFields.user_name = {$concat : [{$first : "$user_detail.first_name"},' ',{$first : "$user_detail.last_name"}]}

                    const search = new RegExp(arggs.match.last_name_user,'i');
                    matchQuery.$match.$and.push({
                        'user_last_name' : search
                    })

                    projectQuery.$project.user_detail = 0
                    
                }

                if (arggs.match.recipe_name) {

                    lookupQuery.push({
                        $lookup : {
                            from: "recipes",
                            localField: "menu.recipe_id",
                            foreignField: "_id",
                            as: "recipe_detail"
                        }
                    })
                    
                    addfieldsQuery.$addFields.recipe_name = '$recipe_detail.recipe_name'

                    const search = new RegExp(arggs.match.recipe_name,'i');
                    matchQuery.$match.$and.push({
                        'recipe_name' : {$in : [search]}
                    })

                    projectQuery.$project.recipe_detail = 0
                }

            }

            if (arggs.match.order_status) {
                const search = new RegExp(arggs.match.order_status,'i');
                matchQuery.$match.$and.push({
                    'order_status' : search
                })
            }

            if (arggs.match.order_date) {
                const startDate = arggs.match.order_date
                let endDate = new Date(startDate)
                endDate.setDate(startDate.getDate() + 1).toLocaleString()

                matchQuery.$match.$and.push({
                    'order_date' : {
                        $gte : startDate,
                        $lte : endDate
                    }
                })
            }

            aggregateQuery.push(...lookupQuery)
            aggregateQuery.push(addfieldsQuery)
            aggregateQuery.push(matchQuery)
            aggregateQuery.push(projectQuery)
            
            
        }
        
        if (arggs.paginator) {
            let total_items = 0
            if (arggs.match && aggregateQuery.length) {  
                total_items = await transactionsModel.aggregate(aggregateQuery) 
                total_items = total_items.length
            }else{
                total_items = await transactionsModel.count() 
            }
            const {limit, page} = arggs.paginator
            const skip = limit * page
            aggregateQuery.push({
                $skip : skip
            },
            {
                $limit : limit
            })

            let showing = `Showing ${skip+1} to ${Math.min(total_items , skip+limit)} from ${total_items} entries`
            let total_page = Math.ceil(total_items/limit)
            let position = `${page+1}/${total_page}`
           
            paginator = {
                total_items : total_items,
                showing : showing,
                total_page : total_page,
                position : position,
            }
        }
        
        let result = []
        arggs.match || arggs.paginator ? result = await transactionsModel.aggregate(aggregateQuery) : result = await transactionsModel.collection.find({status : 'active'}).toArray()
     
        return {data : result, paginator : paginator}
    } catch (error) {
        return new ctx.error(error)
    }
}

const getOneTransaction = async function (parent, arggs, ctx) {
    try {
        const result = await transactionsModel.collection.findOne({_id : mongoose.Types.ObjectId(arggs.id)})
        return result
    } catch (error) {
        return new ctx.error(error)
    }
}

const getBalance = async (parent, arggs, ctx) => {
    let querySort = { $sort: {} }
    let aggregateQuery = []
    querySort.$sort.createdAt = -1
    aggregateQuery.push(querySort)
    if (arggs.paginator) {
            let total_items = 0
            if (arggs.match && aggregateQuery.length) {  
                total_items = await transactionsModel.aggregate(aggregateQuery) 
                total_items = total_items.length
            }else{
                total_items = await transactionsModel.count() 
            }
            const {limit, page} = arggs.paginator
            const skip = limit * page
            aggregateQuery.push({
                $skip : skip
            },
            {
                $limit : limit
            })

            let showing = `Showing ${skip+1} to ${Math.min(total_items , skip+limit)} from ${total_items} entries`
            let total_page = Math.ceil(total_items/limit)
            let position = `${page+1}/${total_page}`
           
            paginator = {
                total_items : total_items,
                showing : showing,
                total_page : total_page,
                position : position,
            }
        }

    let result = []
    arggs.paginator ? result = await transactionsModel.aggregate(aggregateQuery) : result = await transactionsModel.find({ "order_status": "success" }).sort({ createdAt : -1 })

    const dataBalance = await transactionsModel.find({"order_status" : "success"}).select("total_price")
    balance = 0
    for (const transaction of dataBalance){
        balance = balance + transaction.total_price
    }

    return { data: result, paginator: paginator, balance : balance}
}

///////////////////////////////////// mutation resolver ////////////////////////////////

const createTransaction = async function (parent, {type,data}, ctx) {
    try {
        let menu = []
        const {user_id,admin_id} = type
        for(const recipe of data) {
            menu.push({
                recipe_id : mongoose.Types.ObjectId(recipe.recipe_id),
                amount : recipe.amount,
                note : recipe.note
            })
        }
        let checkAvailable = await validateStockIngredient(menu)
        for(const [ind,val] of checkAvailable.entries()){
            val ? menu[ind].status_recipe = 'outOfStock' : menu[ind].status_recipe = 'available' 
        }
        checkAvailable = checkAvailable.includes(true) // if result true mean that all recipe is not able to create
        let order_status = ''
        
        checkAvailable ? order_status = 'failed' : order_status = 'success'
        
        const result = await transactionsModel.create({
                user_id : mongoose.Types.ObjectId(user_id),
                admin_id : mongoose.Types.ObjectId(admin_id),
                menu : menu,
                order_status : order_status,
                order_date : new Date(),
                status : 'active'
            })

        order_status == 'success' ? await reduceIngredientStock(menu) : null
        
        return result
    } catch (error) {
        return new ctx.error(error)
    }
}

const updateTransaction = async function (parent, {id,data}, ctx) {
    try {
        
    } catch (error) {
        return new ctx.error(error)
    }
}

const deleteTransaction = async function (parent, {id}, ctx) {
    try {
        let result = await transactionsModel.updateOne({_id : mongoose.Types.ObjectId(id), status : 'active'},{
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

const TransactionsResolvers = {
    Query: {
        getAllTransactions,
        getOneTransaction,
        getUserTransactionHistory,
        getBalance
    },
    
    Mutation: {
        createTransaction,
        updateTransaction,
        deleteTransaction
    },

    user_detail: {
        detail_user : getUsersLoader
    },

    admin_detail: {
        detail_admin : getUsersLoader
    },

    transaction_menus : {
        recipe_id : getRecipesLoader
    }

}
module.exports = TransactionsResolvers