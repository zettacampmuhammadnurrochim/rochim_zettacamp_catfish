const ingredientsModel = require('./ingredients.model')
const mongoose = require('../../services/services')
const {GraphQLScalarType,Kind} = require('graphql')
const {GraphQLJSON} = require('graphql-type-json')
/////////////////////////////////////////////////////loader function////////////////////////////////////////////////////

/////////////////////////////////////////////////////query function////////////////////////////////////////////////////

const GetAllIngredients = async function (parent, arggs, ctx) {
    try {
        let aggregateQuery = []

        if (arggs.match) {
            let indexMatch = aggregateQuery.push({$match : {$and : [{status : {$ne : 'deleted'}}]} }) - 1
            if (arggs.match.name) {
                const search = new RegExp(arggs.match.name,'i');
                aggregateQuery[indexMatch].$match.$and.push({
                    'name' : search
                })
            }

            if (arggs.match.stock) {
                const search = arggs.match.stock
                aggregateQuery[indexMatch].$match.$and.push({
                    'stock' : search
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
        arggs.match || arggs.paginator ? result = await ingredientsModel.aggregate(aggregateQuery) : result = await ingredientsModel.collection.find().toArray()
        return result
    } catch (error) {
        return new ctx.error(error)
    }
}

const GetOneIngredient = async function (parent, arggs, ctx) {
    try {
        const result = await ingredientsModel.collection.findOne({_id : mongoose.Types.ObjectId(arggs.id), status : 'active'})
        return result
    } catch (error) {
        return new ctx.error(error)
    }
}

///////////////////////////////////// mutation resolver ////////////////////////////////

const createIngredient = async function (parent, arggs, ctx) {
    try {
        let inputIngredients = new ingredientsModel({
            name : arggs.data.name,
            stock : arggs.data.stock,
            status : "active"
        })
        let validator = await inputIngredients.validate()
        let result = {}
        !validator ? result = await inputIngredients.save() : result = {}

        return result
    } catch (error) {
        return new ctx.error(error)
    }
}

const updateIngredient = async function (parent, arggs, ctx) {
    try {
        const {id,name,stock} = arggs.data
        let result = await ingredientsModel.updateOne({_id : mongoose.Types.ObjectId(id), status : 'active'},{
            name : name,
            stock : stock,
        })
        return {result : result}
    } catch (error) {
        return new ctx.error(error)
    }
}

const deleteIngredient = async function (parent, {id}, ctx) {
    try {
        let result = await ingredientsModel.updateOne({_id : mongoose.Types.ObjectId(id), status : 'active'},{
            status : "deleted"
        })
        return {result : result}
    } catch (error) {
        return new ctx.error(error)
    }
}

const ingredientssResolvers = {
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
        GetAllIngredients,
        GetOneIngredient
    },
    
    Mutation: {
        createIngredient,
        updateIngredient,
        deleteIngredient
    }
}

module.exports = ingredientssResolvers