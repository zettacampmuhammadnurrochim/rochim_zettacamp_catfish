
const express = require("express"); //must use in every documents
const router = express.Router();

const {getAllBooks_raw,getAllBooks_,getAllBooks_credit,saveBook,updateBook,deleteBook,bookshelf,
    bookshelf_add,bookshelf_find,bookshelf_addMany,bookshelf_find_match} = require("../app/controllers/bookController");

router.get("/all", getAllBooks_raw);
router.post("/save", saveBook);
router.put("/update", updateBook);
router.delete("/delete", deleteBook);
router.get("/all/calc", getAllBooks_);


router.get("/shelf", bookshelf);
router.post("/shelf/add", bookshelf_add);
router.post("/shelf/addMany", bookshelf_addMany);
router.post("/shelf/find", bookshelf_find);
router.post("/shelf/find/match", bookshelf_find_match);

router.post("/all/credit/", getAllBooks_credit);

module.exports = router;
