
const express = require("express"); //must use in every documents
const router = express.Router();

const {getAllBooks_raw,getAllBooks_,getAllBooks_credit} = require("../app/controllers/bookController");

router.get("/all", getAllBooks_raw);
router.get("/all/calc", getAllBooks_);

router.post("/all/credit/", getAllBooks_credit);

module.exports = router;
