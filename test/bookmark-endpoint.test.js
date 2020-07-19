const knex = require ('knex');
const app = require('../src/app');
const { testArrayPackage } = require ('./bookmarks.fixures');
const supertest = require('supertest');
const { expect } = require('chai');

/* wait... do you smell that?  */


describe.only('The Bookmarks Endpoint',() => {
  let db; 

  before('make knex instance', () => {
    db = knex({
      client : 'pg',
      connection : process.env.TEST_DB_URL
    });
    app.set('db',db);
  });

  after('unmount from db', () => db.destroy());
  
  before('clear the table for the next test', () => db('bookmark_list').truncate());
  
  afterEach('wow it\'s dirty in here', () =>  db('bookmark_list').truncate() );

  describe('GET @ /bookmarks', () =>{

    context('given nothing is in the database' , () =>{
      it('it should send back an empty array & 200 ', ()=>{
        return supertest(app)
          .get('/api/bookmarks')
          .expect(200, []);
      });
    });

    context('if bookmarks has content', () =>{
      const testData = testArrayPackage();
      beforeEach('insert data' ,()=> {
        return db.into('bookmark_list').insert(testData);
      });
      it('should do ', ()=> {
        return supertest(app)
          .get('/api/bookmarks')
          .expect(200,testData);

      });
    });
  });


  
  describe('GET @ /bookmarks/:id', () =>{

    context('Given an Xss attack article', () => {

      const badData = {
        id: 666,
        title: 'Naughty naughty very naughty <script>alert("xss");</script>',
        url_address : 'https://nowhere.info/',
        bookmark_description: 'Bad image <img src="https://url.to.file.which/does-not.exist" onerror="alert(document.cookie);">. But not <strong>all</strong> bad.',
        rating : 4
      };

      beforeEach('insert badData into bookmarks', () => {
        return db 
          .into('bookmark_list')
          .insert([badData]);
      });
      it('should remove XSS attack content', () => {
        return supertest(app)
          .get(`/api/bookmarks/${badData.id}`)
          .expect(200)
          .expect( res => {
            expect(res.body.title).to.eql('Naughty naughty very naughty &lt;script&gt;alert("xss");&lt;/script&gt;');
            expect(res.body.bookmark_description).to.eql('Bad image <img src="https://url.to.file.which/does-not.exist">. But not <strong>all</strong> bad.');
          });
      });

    });

    context('if given a wrong id' , () =>{
      it('it should give back a 404 ', ()=>{
        const wrongID = 123456;
        return supertest(app)
          .get(`/api/bookmarks/${wrongID}`)
          .expect(404, {error :{message : 'that bookmark doesn\'t exist... just like my waifu'}} );

      });
      
    }); 
    context('if bookmarks/:id was content', () =>{

      const testData = testArrayPackage();
     
      beforeEach('insert data' ,()=> {
        return db.into('bookmark_list').insert(testData);
      });

      it('i should give back the right bookmark ', ()=> {
        const test_id = 2;
        const expectedTarget = testData[test_id - 1];
        return supertest(app)
          .get(`/api/bookmarks/${test_id}`)
          .expect(200, expectedTarget);

      });

    });
  });   
  describe('POST @ /bookmarks', ()=>{


    context('if trying to POST SSX', () =>{
      it('it should remove the XSS attack content',()=>{
        const badData = {
          id: 666,
          title: 'Naughty naughty very naughty <script>alert("xss");</script>',
          url_address : 'https://nowhere.info/',
          bookmark_description: 'Bad image <img src="https://url.to.file.which/does-not.exist" onerror="alert(document.cookie);">. But not <strong>all</strong> bad.',
          rating : 4
        };

        return supertest(app)
          .post('/api/bookmarks')
          .send(badData)
          .expect(201)
          .expect(res => {
            expect(res.body).to.be.an('object');
            expect(res.body.title).to.eql('Naughty naughty very naughty &lt;script&gt;alert("xss");&lt;/script&gt;');
            expect(res.body.url_address).to.eql(badData.url_address);
            expect(res.body.bookmark_description).to.eql('Bad image <img src="https://url.to.file.which/does-not.exist">. But not <strong>all</strong> bad.');
            expect(res.body.rating).to.eql(badData.rating);
            expect(res.body.rating).to.be.an('number');
            expect(res.body.rating).to.below(6);
            expect(res.body).to.have.property('id');

          });
      });
    });

    context('if given a valid Id', ()=> {

      it('it should send back a 201, and the new article ',() => {
        const newTestMark ={
          title : 'pixiv' ,
          url_address :'https://www.pixiv.net/en/' , 
          rating : 4 ,
          bookmark_description : '..... dont ask :c '
        };
        return supertest(app)
          .post('/api/bookmarks')
          .send(newTestMark)
          .expect(201)
          .expect(res => {
            expect(res.body).to.be.an('object');
            expect(res.body.title).to.eql(newTestMark.title);
            expect(res.body.url_address).to.eql(newTestMark.url_address);
            expect(res.body.rating).to.eql(newTestMark.rating);
            expect(res.body.bookmark_description).to.eql(newTestMark.bookmark_description);
            expect(res.body).to.have.property('id');
          });
      });
    });


    context('if given a invalid field content', ()=> {
      const requiredFields = ['title','url_address','rating'];
      requiredFields.forEach(t => {
        const newTestMark ={
          title : 'oof test' ,
          url_address :'https://www.dad_jokes.com/' , 
          rating : 1 ,
          bookmark_description : 'im running out of jokes to tell in this ' 
        };
        it(`it should send back an error message when ${t} is missing  `,() => {
          delete newTestMark[t];

          return supertest(app)
            .post('/api/bookmarks')
            .send(newTestMark)
            .expect(400, {
              error : {
                message : `hey! your missing '${t}' in the request body`
              }
            });
        });
      });

    });
   
    context('if the rating is greater of lesser then the respected range ',()=>{
     
      const x = [8,-1,6,12,-2];
      x.forEach(a => {
        const badRatingField = {
          title : 'oof test' ,
          url_address :'https://www.dad_jokes.com/' , 
          rating : a ,
          bookmark_description : 'im running out of jokes to tell in this ' 
        };
  
        it(`should send back a 400, and a error message stating ${a} is invalid`, () => {
          return supertest(app)
            .post('/api/bookmarks')
            .send(badRatingField)
            .expect(400, {
              error : {
                message : 'please put in a valid rating score between 1-5'}
            });
        });
      });
    });
  
  });


  describe('DELETE @ /bookmarks/:id', ()=>{
    context('if given a valid id endpoint it....', ()=> {
      const deleteMeOwO = testArrayPackage();

      beforeEach('injecting the database with the needed content', ()=>{
        return db.into('bookmark_list').insert(deleteMeOwO);
      });
      it('should delete the given target based on the id given ',() => {
          
        const targetId = 2;
        const arrayWithTargetRemoved = deleteMeOwO.filter(item => item.id !== targetId);
        return supertest(app)
          .delete(`/api/bookmarks/${targetId}`)
          .expect(204)
          .then( res => 
            supertest(app)
              .get('/api/bookmarks')
              .expect(arrayWithTargetRemoved)
          );

      });
    });
    context('if given an id that does not exist is should ', ()=> {
      it('send a 404 with an error message',() => {
        return supertest(app)
          .delete(`/api/bookmarks/${123456}`)
          .expect(404, {
            error : {message : 'that bookmark doesn\'t exist... just like my waifu'}
          });
      });
    });
  });  
  describe('PATCH @ .bookmarks/:target id ' , () =>{

    context('when there is no content within the database ,or the target is N/A', ()=>{
      
      it('it should send a 404, and an error message',()=>{
        const id = 123456;
        return supertest(app)
          .patch(`/api/bookmarks/${id}`)
          .expect(404 , {
            error : {message : 'that bookmark doesn\'t exist... just like my waifu'}
          });
      });
    });
    
    context('when there is content with in the database the api..', ()=>{
      const testDataBaseContent = testArrayPackage();
      beforeEach('seed bookmarks_list', ()=> {
        return db.into('bookmark_list').insert(testDataBaseContent);
      });

    it('should send back 204 and update the article ',()=>{
      const idToUpdate = 2;
      const updatedContent = {
        title : 'updated title',
        url_address : 'https://updated.com/',
        rating : 5,
        bookmark_description : 'updated description'
      };
      const expectedTarget = {
        ...testDataBaseContent[idToUpdate - 1],
        ...updatedContent
      }

      return supertest(app)
        .patch(`/api/bookmarks/${idToUpdate}`)
        .send(updatedContent)
        .expect(204)
        .then(res => {
         return supertest(app)
          .get(`/api/bookmarks/${idToUpdate}`)
          .expect(expectedTarget)
        })
    });
    it('it should respond with a 400 when no required field supplied',()=>{
      const idToUpdate = 2;
      return supertest(app)
        .patch(`/api/bookmarks/${idToUpdate}`)
        .send({ooferKey : 'oofer property'})
        .expect(400, {
          error: {
            message : "requested at less one of the 'title','rating','url','description', "
          }
        });
    });
    it('should respond with a 204 when updating only a subset of fields',()=>{
      const idToUpdate = 1
      const updatedContent = {
        title : 'updated title'
      }
      const expectedTarget = {
        ...testDataBaseContent[idToUpdate - 1],
        ...updatedContent
      }
      return supertest(app)
        .patch(`/api/bookmarks/${idToUpdate}`)
        .send({
          ...updatedContent,
          notARealField : 'if this is being seen we have problem'
        })
        .expect(204)
        .then(res=> {
          return supertest(app)
          .get(`/api/bookmarks/${idToUpdate}`)
          .expect(expectedTarget)
        })
    });
    });
      



    
    
  });
});
