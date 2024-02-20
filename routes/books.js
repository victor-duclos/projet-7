const express = require('express');
const router = express.Router();
const bookCtrl = require('../controllers/book');
const auth = require('../middleware/auth');
const multer = require ('../middleware/multer');


router.get('/', bookCtrl.getAllBook);
router.get('/bestrating', bookCtrl.getBestRating);

router.post('/:id/rating' , auth , bookCtrl.postRating);
router.get('/:id', bookCtrl.getOneBook);
router.post('/', auth, multer, multer.resizeImage, bookCtrl.createBook);



router.put('/:id', auth, multer , multer.resizeImage, bookCtrl.modifyBook);

router.delete('/:id', auth,bookCtrl.deleteBook);




module.exports= router;