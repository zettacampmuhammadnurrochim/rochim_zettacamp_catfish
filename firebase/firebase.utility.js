const fetch = require('node-fetch')
const messagingTokenModel = require('./../graphql/users/messagingToken.model')
require('dotenv').config()

const sendMessages = async (recipe)=>{
    let tokens = await messagingTokenModel.collection.find().toArray()
    tokens = tokens.map((e) => e.token)
    
    let notification = {
        'title' : `new highlights menu`,
        'body'  : `${recipe.recipe_name} is discount ${recipe.disc}% right now`,
        'receiver' : 'lovely users',
        'icon'  : recipe.image,
        'click_action' : `https://mini-project-duanda.vercel.app/Homepage`,
        'sound' : 'mySound'
    }

    let notification_body = {
        'notification' : notification,
        'registration_ids' : tokens 
    }

    fetch('https://fcm.googleapis.com/fcm/send', {
        'method' : 'POST',
        'headers' : {
            'Authorization': `key= ${process.env.SERVER_FCM} `,
            'Content-Type' : 'application/json'
        },
        'body' : JSON.stringify(notification_body)
    })
    .then((e)=>{
        return 'success update and sent'
    }).catch((e) =>{
        return 'error cant send notification'+e
    })
    
}
module.exports = {sendMessages}