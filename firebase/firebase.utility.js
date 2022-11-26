const { messaging, analytics } = require('./firebase.config')

const getToken = async ()=>{
    const token = await messaging.getToken()
    //save to db : 
    console.log(token);
    return token
}

const senMessages = async ()=>{

}
