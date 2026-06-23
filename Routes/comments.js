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
const { commentRules, handleValidationErrors } = require('../middleware/validators');
 
router.get('/',    isAuth, getComments);   // anyone logged in can read
router.post('/', isAuth, commentRules, handleValidationErrors, addComment);    // citizen posts comment
 
router.delete('/:id', isAuth, deleteComment);
router.put('/:id',    isAuth,commentRules,handleValidationErrors, editComment);
 
module.exports = router;