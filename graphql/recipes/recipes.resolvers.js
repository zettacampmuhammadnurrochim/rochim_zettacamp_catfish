
const recipesModel = require('./recipes.model')
const mongoose = require('../../services/services')
const {GraphQLScalarType,Kind} = require('graphql')
const {GraphQLJSON} = require('graphql-type-json')

/////////////////////////////////////////////////////loader function////////////////////////////////////////////////////
const getIngredientsLoader = async function (parent, arggs, ctx) {
    if (parent.ingredient_id) {
        const result = await ctx.inggridientsLoader.load(parent.ingredient_id)
        return result;
    }
}
/////////////////////////////////////////////////////query function////////////////////////////////////////////////////
// done
const getAllRecipes = async function (parent, arggs, ctx) {
    try {
        let aggregateQuery = []
        if (arggs.match) {
            let indexMatch = aggregateQuery.push({$match : {$and : []} }) - 1
            if (arggs.match.name) {
                const search = new RegExp(arggs.match.name,'i');
                aggregateQuery[indexMatch].$match.$and.push({
                    'recipe_name' : search
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
        
        arggs.match || arggs.paginator ? result = await recipesModel.aggregate(aggregateQuery) : result = await recipesModel.collection.find().toArray()
        return result
    } catch (error) {
        return new ctx.error(error)
    }
}
// done
const getOneRecipe = async function (parent, arggs, ctx) {
    try {
        const result = await recipesModel.collection.findOne({_id : mongoose.Types.ObjectId(arggs.id)})
        return result
    } catch (error) {
        return new ctx.error(error)
    }
}

///////////////////////////////////// mutation resolver ////////////////////////////////
// done
const createRecipe = async function (parent, arggs, ctx) {
    try {
        const {recipe_name, ingredients} = arggs.data
        let inputRecipe = new recipesModel({
            recipe_name : recipe_name, 
            ingredients : ingredients,
            status : "active"
        })
        
        let validator = await inputRecipe.validate()
        let result = {}
        !validator ? result = await inputRecipe.save() : result = {}
        return result
    } catch (error) {
        return new ctx.error(error)
    }
}
// done
const updateRecipe = async function (parent, {id,data}, ctx) {
    try {
        let query = []
        if (data.recipe_name) {
            let {recipe_name} = data
            query.push([
                '$set' , {
                    'recipe_name' : recipe_name
                }
            ])
        }

        let push = [] 
        let pull = []
        let update = []
        if (data.ingredients) {
            let {ingredients} = data
            
            for(const [index,value] of ingredients.entries()){
                if (value.mode == "push") {
                    delete value.mode
                    push.push(value)
                }
                else if(value.mode == "pull") {
                    delete value.mode
                    pull.push(value.ingredient_id)
                }else {
                    delete value.mode
                    update.push(value)
                    //using array filler 
                }
            }
            
            if (pull.length) {
                query.push([
                    '$pull' , {'ingredients' : {
                        'ingredient_id' : pull.map(e => mongoose.Types.ObjectId(e)) 
                        } 
                    }
                ])
            }

            if (push.length) {
                query.push([
                    '$push' , {'ingredients' : {'$each' : push}}
                ])
            }
        
        }

        query = Object.fromEntries(query)

        let result = await recipesModel.updateOne({_id : mongoose.Types.ObjectId(id), status : 'active'},query)
        return {result : result}
    } catch (error) {
        return new ctx.error(error)
    }
}
// done
const deleteRecipe = async function (parent, {id}, ctx) {
    try {
        let result = await recipesModel.updateOne({_id : mongoose.Types.ObjectId(id), status : 'active'},{
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

const RecipesResolvers = {
    JSON: GraphQLJSON,
    Date: new GraphQLScalarType({
        name: 'Date',
        description: 'Date custom scalar type',
        parseValue(value) {
            return new Date(value); // value from the client
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
        getAllRecipes,
        getOneRecipe
    },
    
    Mutation: {
        createRecipe,
        updateRecipe,
        deleteRecipe
    },

    recipe_ingridient : {
        ingredient_id : getIngredientsLoader
    }
}
module.exports = RecipesResolvers