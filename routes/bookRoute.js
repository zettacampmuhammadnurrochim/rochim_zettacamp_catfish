
const express = require("express"); //must use in every documents
const router = express.Router();

const {getAllBooks_raw,getAllBooks_,getAllBooks_credit,saveBook,updateBook,deleteBook} = require("../app/controllers/bookController");

router.get("/all", getAllBooks_raw);
router.post("/save", saveBook);
router.put("/update", updateBook);
router.delete("/delete", deleteBook);
router.get("/all/calc", getAllBooks_);

router.post("/all/credit/", getAllBooks_credit);

module.exports = router;
