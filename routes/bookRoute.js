
const express = require("express"); //must use in every documents
const router = express.Router();

const {getAllBooks_raw,getAllBooks_,getAllBooks_credit,saveBook,updateBook,deleteBook,bookshelf,
    bookshelf_add,bookshelf_find_pull,bookshelf_addMany,bookshelf_find_eq,
    bookshelf_find_ne,bookshelf_find_update_add,bookshelf_find_updateMany,
    bookshelf_find_match,bookshelf_find_updateFillter,aggregateFunc,aggregateCountDistance
    ,DistanceNear,orederByprice,showBetween,arrayFilter,pagination} = require("../app/controllers/bookController");

router.get("/all", getAllBooks_raw);
router.post("/save", saveBook);
router.put("/update", updateBook);
router.delete("/delete", deleteBook);
router.get("/all/calc", getAllBooks_);


router.get("/shelf", bookshelf);
router.post("/shelf/add", bookshelf_add);
router.post("/shelf/addMany", bookshelf_addMany);

router.put("/shelf/find/pull", bookshelf_find_pull);
router.post("/shelf/find/eq", bookshelf_find_eq);
router.post("/shelf/find/match", bookshelf_find_match);
router.post("/shelf/find/ne", bookshelf_find_ne);
router.put("/shelf/update/add", bookshelf_find_update_add);
router.put("/shelf/update/many", bookshelf_find_updateMany);

router.put("/shelf/update/fillter", bookshelf_find_updateFillter);

router.post("/all/credit/", getAllBooks_credit);
router.get("/all/aggregate/", aggregateFunc);
router.get("/all/calc/distance", aggregateCountDistance);
router.get("/all/calc/distance/near", DistanceNear);
router.get("/all/sort/cheap", orederByprice);
router.get("/all/between", showBetween);
router.get("/all/array/filter", arrayFilter);
router.get("/all/pagination", pagination);

module.exports = router;
