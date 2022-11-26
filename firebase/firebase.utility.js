const { messaging, analytics } = require('./firebase.config')

const getToken = async ()=>{

    const token = await messaging.getToken()
    return token
}