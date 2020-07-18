const BookmarkService ={
  getAllItems(db) {
    return db
      .select()
      .from('bookmark_list');
  },
  
  insertItems(db,newArticle) {
    return db
      .insert(newArticle)
      .into('bookmark_list')
      .returning('*')
      .then(rows => rows[0]);
  },
  
  getById(db,id){
    return db.select()
      .from('bookmark_list')
      .where('id',id)
      .first();
  },
  
  deleteItems(db,id){
    return db('bookmark_list')
      .where({id})
      .delete();
  },
  
  updateItems(db,id,newArticleFields){
    return db('bookmark_list')
      .where({id})
      .update(newArticleFields);
  }
  
};
  
module.exports = BookmarkService ; 