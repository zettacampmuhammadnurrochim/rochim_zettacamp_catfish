
const express = require('express'); //must use in every documents
const router = express.Router();

const {userController} = require('../app/controllers/userController');

router.get('/register', (req,res) => {res.send('belum ada halaman') });
router.post('/register', userController.register);

router.get('/login', userController.loginView);
router.post('/login', userController.login);

router.get('/getAllUsers', userController.getAllUsers);
router.get('/getUserById/:id', userController.getUserById);

router.put('/UpdateOne/:id', userController.UpdateOne);

router.get('/getToken', userController.getToken);
router.get('/getRefreshToken', userController.getRefreshToken);
router.get('/logout', userController.logout);

// tugas JS day 7
router.get('/Await/readfile', userController.readFileAwait) //readfile using await 
router.get('/readfile', userController.readFile)  //readfile without await
module.exports = router;
