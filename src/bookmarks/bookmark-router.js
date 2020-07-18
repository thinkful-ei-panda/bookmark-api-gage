const express = require('express');
const BookmarkRouter = express.Router();
const BookmarkService = require('./bookmark-service');
const xss = require('xss');

const serializedBookmark = mark =>({
  id: mark.id ,
  title: xss( mark.title),
  url_address: xss(mark.url_address), 
  rating: mark.rating ,
  bookmark_description: xss(mark.bookmark_description)
});

BookmarkRouter
  .route('/')
  .get((req,res,next) =>{
    const nxA = req.app.get('db');
    BookmarkService.getAllItems(nxA)
      .then(mark => {
        res.json(mark.map(serializedBookmark));
      })
      .catch(next);
  })
  .post(express.json(),(req,res,next)=>{
    const {title , url_address ,rating, bookmark_description} = req.body;
    const newMark = {title , url_address ,rating, bookmark_description};
    for( const [key,val] of Object.entries(newMark)){
      if(!val){
        return res.status(400).json({
          error : {
            message : `hey! your missing '${key}' in the request body`
          }
        });
      }
    }
    if(typeof rating !== 'number'|| rating > 5 || rating < 1 ){
      return res.status(400).json({
        error : {
          message : 'please put in a valid rating score between 1-5'}
      });
    }
    
    
    BookmarkService.insertItems(req.app.get('db'), newMark)
      .then( mark => {
        res
          .status(201)
          .location(`/bookmarks/${mark.id}`)
          .json(serializedBookmark(mark));
      })
      .catch(next);

  });
BookmarkRouter
  .route('/:id')
  .all((req,res,next)=>{
    BookmarkService.getById(
      req.app.get('db'),
      req.params.id
    )
      .then(mark =>{
        if(!mark){
          return res.status(404).json({
            error : {message : 'Article doesn\'t exist... just like my waifu'}
          });
        }
        res.mark = mark;
        next();
      })
      .catch(next);
  })
  .get((req,res,next) => {
    res.json(serializedBookmark(res.mark));
  })
  .delete((req,res,next) => {
    BookmarkService.deleteItems(
      req.app.get('db'),
      req.params.id
    )
      .then(()=>{
        res.status(204).end();
      })
      .catch(next);
  });

//   .patch( (req,res,next)=>{

//   })


module.exports = BookmarkRouter; 