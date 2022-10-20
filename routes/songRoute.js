
const express = require("express"); //must use in every documents
const router = express.Router();

const {songController} = require("../app/controllers/songController");

router.get("/all", songController.all);
router.get("/playlist", songController.songlist);

module.exports = router;
