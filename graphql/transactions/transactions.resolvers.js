
const transactionsModel = require('./transaction.model')
const mongoose = require('../../services/services')
const {GraphQLScalarType,Kind} = require('graphql')
const {GraphQLJSON} = require('graphql-type-json')
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
const getAllTransactions = async function (parent, arggs, ctx) {
    try {
        let aggregateQuery = []
        if (arggs.match) {
            let indexMatch = aggregateQuery.push({$match : {$and : []} }) - 1
            if (arggs.match.last_name_user) {

                aggregateQuery.push({
                    $lookup : {
                        from: "users",
                        localField: "user_id",
                        foreignField: "_id",
                        as: "user_detail"
                    }
                })
                
                aggregateQuery.push({
                    $addFields : {
                        'user_first_name' : {$first : "$user_detail.first_name"},
                        'user_last_name' : {$first : "$user_detail.last_name"},
                        'user_name' : {
                            $concat : [{$first : "$user_detail.first_name"}, {$first : "$user_detail.last_name"}]
                        }
                    }
                })

                const search = new RegExp(arggs.match.last_name_user,'i');
                aggregateQuery[indexMatch].$match.$and.push({
                    'user_last_name' : search
                })

                aggregateQuery.push({
                   $project : {
                        "user_detail" : 0
                    }
                })
            }

            if (arggs.match.recipe_name) {
                const search = new RegExp(arggs.match.recipe_name,'i');
                aggregateQuery[indexMatch].$match.$and.push({
                    'recipe_name' : search
                })
            }

            if (arggs.match.order_status) {
                const search = new RegExp(arggs.match.order_status,'i');
                aggregateQuery[indexMatch].$match.$and.push({
                    'order_status' : search
                })
            }

            if (arggs.match.order_date) {
                const search = arggs.match.order_date
                console.log(search);
                aggregateQuery[indexMatch].$match.$and.push({
                    'order_date' : {
                        $lte : search
                    }
                })
                console.log(aggregateQuery[indexMatch].$match.$and);
            }

            aggregateQuery.push(aggregateQuery.shift())    
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
        // console.log(aggregateQuery);

        
        arggs.match || arggs.paginator ? result = await transactionsModel.aggregate(aggregateQuery) : result = await transactionsModel.collection.find().toArray()
        
        return result
    } catch (error) {
        return new ctx.error(error)
    }
}
// done
const getOneTransaction = async function (parent, arggs, ctx) {
    try {
        const result = await transactionsModel.collection.findOne({_id : mongoose.Types.ObjectId(arggs.id)})
        return result
    } catch (error) {
        return new ctx.error(error)
    }
}

///////////////////////////////////// mutation resolver ////////////////////////////////
// done
const createTransaction = async function (parent, {entity,data}, ctx) {
    try {
        let BatchRecipes = []
        let menu = []
        const {user_id,admin_id} = entity
        for(const recipe of data) {
            BatchRecipes.push({recipe_id : recipe.recipe_id, amount : recipe.amount})
            menu.push({
                recipe_id : mongoose.Types.ObjectId(recipe.recipe_id),
                amount : recipe.amount,
                note : recipe.note
            })
        }
        let checkAvailable = await validateStockIngredient(BatchRecipes)
        for(const [ind,val] of checkAvailable.entries()){
            val ? menu[ind].status_recipe = 'outOfStock' : menu[ind].status_recipe = 'available' 
        }
        checkAvailable = checkAvailable.includes(true) // if result true mean that all recipe is able to create
        let order_status = ''
        console.log(checkAvailable);
        checkAvailable ? order_status = 'failed' : order_status = 'success'
        console.log(order_status);
        const result = await transactionsModel.create({
                user_id : mongoose.Types.ObjectId(user_id),
                admin_id : mongoose.Types.ObjectId(admin_id),
                menu : menu,
                order_status : order_status,
                order_date : new Date(),
                status : 'active'
            })

            order_status == 'success' ? await reduceIngredientStock(BatchRecipes) : null
        
        return result
    } catch (error) {
        return new ctx.error(error)
    }
}
// done
const updateTransaction = async function (parent, {id,data}, ctx) {
    try {
        
    } catch (error) {
        return new ctx.error(error)
    }
}
// done
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
    JSON: GraphQLJSON,
    Date: new GraphQLScalarType({
        name: 'Date',
        description: 'Date custom scalar type',
        parseValue(value) {
            return new Date(value).toISOString(); // value from the client
        },
        serialize(value) {
            return value.getTime(); // value sent to the client
        },
        parseLiteral(ast) {
            if (ast.kind === Kind.INT) {
                return parseInt(ast.value, 10); // ast value is always in string format
            }
            return null;
        },
    }),
    Query: {
        getAllTransactions,
        getOneTransaction
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