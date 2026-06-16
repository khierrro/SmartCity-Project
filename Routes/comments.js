'use strict';
const express = require('express');
const router  = express.Router({ mergeParams: true }); // mergeParams → gets :id from parent
const isAuth  = require('../middleware/isAuth');
const {
  getComments,
  addComment,
  deleteComment,
  editComment,
} = require('../controllers/commentController');
 
router.get('/',    isAuth, getComments);   // anyone logged in can read
router.post('/',   isAuth, addComment);    // citizen posts comment
 
router.delete('/:id', isAuth, deleteComment);
router.put('/:id',    isAuth, editComment);
 
module.exports = router;