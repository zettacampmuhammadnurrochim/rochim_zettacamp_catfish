
const express = require("express"); //must use in every documents
const router = express.Router();

const {songController} = require("../app/controllers/songController");

router.get("/all", songController.all);
router.get("/all/detail", songController.findDetailAll);
router.get("/playlist", songController.songlist);


router.get("/match", songController.matchSong);
router.post("/detail", songController.findDetail);
router.post("/playlist/add", songController.addSongList);
router.post("/playlist/hour/save", songController.addOneHourSongList);
router.put("/playlist/update/remove", songController.remSongList);
router.put("/playlist/update/add", songController.updSongList);
router.put("/playlist/delete", songController.dellSongList);
router.delete("/playlist/delete/force", songController.forceDellSongList);

module.exports = router;
