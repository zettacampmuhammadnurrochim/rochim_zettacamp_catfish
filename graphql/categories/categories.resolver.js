const categoriesModel = require('./categories.model')
const mongoose = require('../../services/services')
/////////////////////////////////////////////////////loader function////////////////////////////////////////////////////

/////////////////////////////////////////////////////query function////////////////////////////////////////////////////

const GetAllCategories = async function (parent, arggs, ctx) {
    try {
        let aggregateQuery = []

        if (arggs.match) {
            let indexMatch = aggregateQuery.push({$match : {$and : []} }) - 1
            if (arggs.match.name) {
                const search = new RegExp(arggs.match.name,'i');
                aggregateQuery[indexMatch].$match.$and.push({
                    'name' : search
                })
            }

        }
        
        let paginator = {}
        if (arggs.paginator) {
            let total_items = 0
            if (arggs.match && aggregateQuery.length) {  
                total_items = await categoriesModel.aggregate(aggregateQuery) 
                total_items = total_items.length
            }else{
                total_items = await categoriesModel.count() 
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
        arggs.match || arggs.paginator ? result = await categoriesModel.aggregate(aggregateQuery) : result = await categoriesModel.collection.find().toArray()
        return {data : result, paginator : paginator}
    } catch (error) {
        return new ctx.error(error)
    }
}

///////////////////////////////////// mutation resolver ////////////////////////////////

const createCategories = async function (parent, arggs, ctx) {
    try {
        let inputcategoriess = new categoriesModel({
            name : arggs.data.name,
            description : arggs.data.description
        })
        let validator = await inputcategoriess.validate()
        let result = {}
        !validator ? result = await inputcategoriess.save() : result = {}

        return result
    } catch (error) {
        return new ctx.error(error)
    }
}

const updateCategories = async function (parent, {id,data}, ctx) {
    try {
        let {name,description} = data
        let result = categoriesModel.updateOne({_id : mongoose.Types.ObjectId(id)},{
            name : name,
            description : description
        })
        return result
    } catch (error) {
        return new ctx.error(error)
    }
}
const deleteCategories = async function (parent, {id}, ctx) {
    try {
        let result = {}
        let checkRelations = await checkcategories(id)
        let recipeName = []
        if (!checkRelations.length) {
            result = await categoriesModel.updateOne({_id : mongoose.Types.ObjectId(id), status : 'active'},{
                status : "deleted"
            })
        }else{
            for(const val of checkRelations){
                recipeName.push(val.recipe_name)
            }
            return new ctx.error('cant delete the ingredients has relation to recipe',{ recipe : recipeName})
        }
        
        return {result : result}
    } catch (error) {
        return new ctx.error(error)
    }
}

const ingredientssResolvers = {
    Query: {
        GetAllCategories
    },
    
    Mutation: {
        createCategories,
        updateCategories,
        deleteCategories
    }
}

module.exports = ingredientssResolvers