var express = require('express');
var moment= require('moment') 
var router = express.Router();
var User = require('../models/user');
var Post = require('../models/post');
var Comment = require('../models/comment');
var Like = require('../models/like');
const { populate } = require('../models/user');
const multer = require('multer');
const { contentType } = require('express/lib/response');
const e = require('express');

/* GET users listing. */
/* GET post listing. */
router.get('/', function(req, res, next) {
  console.log('test Post')
  console.log(req.session.email)

  // Post.find({})
  //     .populate()
  //     .populate("user")
  //     .populate({
  //       path:"comment",
  //       populate:[{
  //         path: "user",
  //       }] 
  //     })
  //     .then( post => {
  //       console.log(post)
  //       return res.status(200).json({post})
  //     })
  //     .catch(error => {
  //       console.log(error)
  //     }) 


  User.findOne({ email: req.session.email })
      .populate("post")  
      .then( user => {
        console.log(user)
        return res.status(200).json({user})
      })
      .catch(error => {
        console.log(error)
      })   
});


//New post
var upload = multer({ dest: './public/images/posts/' })
router.post('/', upload.single('img'),function(req, res, next) {

  var data = req.body;
  var your_url = req.body.video.replace('watch?v=', "embed/");
  var url = your_url.split('&ab_channel=');
  var you_url = url[0];
  console.log(you_url)  
  var img = ''
  if(req.file){
    img = '/images/posts/' + req.file.filename;
  }
  
  User.findOne({ email: req.session.email }, (error, user) => {
    if(error || !user) {                              
      return res.status(404).json({ message: error })      
    }
    //post
    //Date
    var datetime = new Date();
    var c_date  = moment(datetime).format('YYYY-MM-DD h:mm:ss');
    var u_date  = c_date;
    //Post
    var post = new Post({
      content: data.content,
      youtube_url: you_url,
      image: img,
      user: user._id,
      create_date: c_date,
      update_date: u_date      
    });
    post.save(function (err, post) {
      if(err || !post) return res.status(404).json({ message: error }) 
      user.post.push(post._id)
      user.save((err, user_update) => {
        if(error || !user_update)
        if(err){
          return res.status(404).json({ error: 'DB Error, please login again'})             
        }
        post.populate('user', function(err) {
          return res.status(200).json(post)
         });
      })         
    });         
    
  })
});

//Edit Post
var upload = multer({ dest: './public/images/posts/' })
router.put('/', upload.single('img'),function(req, res, next) {
  var your_url = req.body.video.replace('watch?v=', "embed/");
  var url = your_url.split('&ab_channel=');
  var you_url = url[0];
  console.log(you_url)
  var img = ''
  if(req.file){
    img = '/images/posts/' + req.file.filename;
  }
  console.log(req.body)

  User.findOne({ email: req.session.email }, (error, user) => {
    if(error || !user) {                              
      return res.status(404).json({ message: error })      
    }
    //Date
    var datetime = new Date();
    var u_date  = moment(datetime).format('YYYY-MM-DD h:mm:ss');
    //Post

    Post.findOne({_id: req.body.id }, (err, post) => {
      if(err || !post) return res.status(404).json({ message: error }) 

      if(you_url)
      {
        post.youtube_url = you_url
      }
      post.content = req.body.content
      post.update_date = u_date
      if(req.file){
        post.image = img
      }
      post.save(function (err, post) {
        if(err || !post) return res.status(404).json({ message: error }) 
        return res.status(200).json(post)
      }); 
    })
  })
});

//Delete Post
router.delete('/:id', function(req, res, next) {
  User.findOne({ email: req.session.email }, (error, user) => {
    if(error || !user) {                              
      return res.status(404).json({ message: error })      
    }
    let id = req.params.id;
    //post
    Post.findOne({_id: id }, (error, post) => {
      if(error || !post) {                              
        return res.status(404).json({ message: error })      
      }
      if(String(post.user) != String(user._id))
      {
        return res.status(404).json({ message: "You are not have permission to delete" })
      }
      post.remove(function(error){
        if(error) {                              
          return res.status(404).json({ message: error })      
        }
        user.post.pull(id)
        user.save()
        return res.status(200).json({ message: "Delete comment succesfull" })
      })
    })       
  })
});

//like Post
router.post('/like/:id', function(req, res, next) {
   if(req.session.role == 2){
    User.findOne({ email: req.session.email }, (error, user) => {
      if(error || !user) {                              
        return res.status(404).json({ message: error })      
      }
      //Get data from body
      let id_post = req.body.id;
      let flag = 0;
      //post
      
      Post.findOne({_id: id_post }, (error, post) => {
        console.log('flag-post')
        console.log(post)
        if(error || !post) {                              
          return res.status(404).json({ message: error })      
        }
        Like.findOne({user: user, post: post }, (error, like) => {
        console.log('flag-like')
        console.log(like)
        if(!like)
        {
          
          //like 
          var datetime = new Date();
          var c_date  = moment(datetime).format('YYYY-MM-DD h:mm:ss');
          var u_date  = c_date;
          var like = new Like({
            user: user._id,
            post: post._id,
            create_date: c_date,
            update_date: u_date
          });       
          console.log(like)
          like.save(function (err, like) {
            if(err) return res.status(404).json({ message: 'DB Error' }) 
            //user.like.push(like._id)
            post.like.push(like._id)
            post.save((err, post_update) => {
              if(err){
                return res.status(404).json({ error: 'DB Error, please login again'})             
              }
              user.like.push(like._id)
              user.save((err, user_update) => {
                if(err){
                  return res.status(404).json({ error: 'DB Error, please login again'})             
                }              
                return res.status(200).json(post_update)
              })
            })         
          });         
        }
        else{
          //Remove like
          like.remove(function(error){
            if(error) {                              
              return res.status(404).json({ message: error })      
            }
            Post.findOne({_id: like.post._id }, (error, post) => {
              post.like.pull(like._id)
              post.save()
              User.findOne({_id: like.user._id }, (error, user_like) => {
                user_like.like.pull(like._id)
                user_like.save()
                return res.status(200).json(post)
              })
            
            })     
          })
        }
      })
    })   
    })
  }
  else{
    User.findOne({ username: req.session.user }, (error, user) => {
      if(error || !user) {                              
        return res.status(404).json({ message: error })      
      }
      //Get data from body
      let id_post = req.body.id;
      let flag = 0;
      //post
      
      Post.findOne({_id: id_post }, (error, post) => {
        console.log('flag-post')
        console.log(post)
        if(error || !post) {                              
          return res.status(404).json({ message: error })      
        }
        Like.findOne({user: user, post: post }, (error, like) => {
        console.log('flag-like')
        console.log(like)
        if(!like)
        {
          
          //like 
          var datetime = new Date();
          var c_date  = moment(datetime).format('YYYY-MM-DD h:mm:ss');
          var u_date  = c_date;
          var like = new Like({
            user: user._id,
            post: post._id,
            create_date: c_date,
            update_date: u_date
          });       
          console.log(like)
          like.save(function (err, like) {
            if(err) return res.status(404).json({ message: 'DB Error' }) 
            //user.like.push(like._id)
            post.like.push(like._id)
            post.save((err, post_update) => {
              if(err){
                return res.status(404).json({ error: 'DB Error, please login again'})             
              }
              user.like.push(like._id)
              user.save((err, user_update) => {
                if(err){
                  return res.status(404).json({ error: 'DB Error, please login again'})             
                }              
                return res.status(200).json(post_update)
              })
            })         
          });         
        }
        else{
          //Remove like
          like.remove(function(error){
            if(error) {                              
              return res.status(404).json({ message: error })      
            }
            Post.findOne({_id: like.post._id }, (error, post) => {
              post.like.pull(like._id)
              post.save()
              User.findOne({_id: like.user._id }, (error, user_like) => {
                user_like.like.pull(like._id)
                user_like.save()
                return res.status(200).json(post)
              })
            
            })     
          })
        }
      })
    })   
    })    
  }
});
//New Comment
router.post('/comment', function(req, res, next) {
  if(req.session.role == 2)
  {
    User.findOne({ email: req.session.email }, (error, user) => {
      if(error || !user) {                              
        return res.status(404).json({ message: error })      
      }

      //Get data from body
      let id_post = req.body.id_post;
      let comment_content = req.body.comment;  
      //post
      Post.findOne({_id: id_post }, (error, post) => {
        if(error || !post) {                              
          return res.status(404).json({ message: error })      
        }
        //comment     
        var datetime = new Date();
        var c_date  = moment(datetime).format('YYYY-MM-DD h:mm:ss');
        var u_date  = c_date;
        var comment = new Comment({
          content: comment_content,
          user: user._id,
          post: post._id,
          create_date: c_date,
          update_date: u_date
        });       
        console.log(comment)
        comment.save(function (err, comment) {
          if(err || !comment) return res.status(404).json({ message: error }) 
          post.comment.push(comment._id)
          post.save((err, post_update) => {
            if(error || !post_update)
            if(err){
              return res.status(404).json({ error: 'DB Error, please login again'})             
            }       
            comment_respond ={
              id: comment._id,
              content: comment_content,
              user_id: user._id,
              user_name: user.name,
              create_date: c_date,
              update_date: u_date
            }
            console.log(comment_respond)
            return res.status(200).json(comment_respond)
          })         
        });   
      })       
    })
  }
  else{
    User.findOne({ username: req.session.user }, (error, user) => {
      if(error || !user) {                              
        return res.status(404).json({ message: error })      
      }

      //Get data from body
      let id_post = req.body.id_post;
      let comment_content = req.body.comment;  
      //post
      Post.findOne({_id: id_post }, (error, post) => {
        if(error || !post) {                              
          return res.status(404).json({ message: error })      
        }
        //comment     
        var datetime = new Date();
        var c_date  = moment(datetime).format('YYYY-MM-DD h:mm:ss');
        var u_date  = c_date;
        var comment = new Comment({
          content: comment_content,
          user: user._id,
          post: post._id,
          create_date: c_date,
          update_date: u_date
        });       
        console.log(comment)
        comment.save(function (err, comment) {
          if(err || !comment) return res.status(404).json({ message: error }) 
          post.comment.push(comment._id)
          post.save((err, post_update) => {
            if(error || !post_update)
            if(err){
              return res.status(404).json({ error: 'DB Error, please login again'})             
            }       
            comment_respond ={
              id: comment._id,
              content: comment_content,
              user_id: user._id,
              user_name: user.name,
              create_date: c_date,
              update_date: u_date
            }
            console.log(comment_respond)
            return res.status(200).json(comment_respond)
          })         
        });   
      })       
    })
  }
});

//Edit Comment
router.post('/comment/:id', function(req, res, next) {
  if(req.session.role == 2)
  {
    User.findOne({ email: req.session.email }, (error, user) => {
      if(error || !user) {                              
        return res.status(404).json({ message: error })      
      }
      //Get data from body
      let id_comment = req.body.id;
      let content = req.body.comment; 
      console.log(id_comment)
      Comment.findOne({_id: id_comment }, (error, comment) => {
        if(error || !comment) {                              
          return res.status(404).json({ message: error })      
        }
        console.log(comment.user)
        console.log(user._id)
        if(String(comment.user) != String(user._id))
        {
          return res.status(404).json({ message: "You are not have permission to edit comment" })
        }
        comment.content = content;
        comment.save();
        return res.status(200).json({ message: "Comment edit succesfull" }) 
      })        
    })
  }
  else{
    User.findOne({ username: req.session.user }, (error, user) => {
      if(error || !user) {                              
        return res.status(404).json({ message: error })      
      }
      //Get data from body
      let id_comment = req.body.id;
      let content = req.body.comment; 
      console.log(id_comment)
      Comment.findOne({_id: id_comment }, (error, comment) => {
        if(error || !comment) {                              
          return res.status(404).json({ message: error })      
        }
        console.log(comment.user)
        console.log(user._id)
        if(String(comment.user) != String(user._id))
        {
          return res.status(404).json({ message: "You are not have permission to edit comment" })
        }
        comment.content = content;
        comment.save();
        return res.status(200).json({ message: "Comment edit succesfull" }) 
      })        
    })   
  }
});

//Delete Comment
router.delete('/comment/:id', function(req, res, next) {
  if(req.session.role == 2){
    User.findOne({ email: req.session.email }, (error, user) => {
      if(error || !user) {                              
        return res.status(404).json({ message: error })      
      }
      let id = req.params.id;
      //post
      Comment.findOne({_id: id }, (error, comment) => {
        if(error || !comment) {                              
          return res.status(404).json({ message: error })      
        }
        if(String(comment.user) != String(user._id))
        {
          return res.status(404).json({ message: "You are not have permission to delete" })
        }
        comment.remove(function(error){
          if(error) {                              
            return res.status(404).json({ message: error })      
          }
          Post.findOne({_id: comment.post }, (error, post) => {
            post.comment.pull(id)
            post.save()
            return res.status(200).json({ message: "Delete comment succesfull" })
          })     
        })
     
      })       
    })
  }
  else{
    User.findOne({ username: req.session.user }, (error, user) => {
      if(error || !user) {                              
        return res.status(404).json({ message: error })      
      }
      let id = req.params.id;
      //post
      Comment.findOne({_id: id }, (error, comment) => {
        if(error || !comment) {                              
          return res.status(404).json({ message: error })      
        }
        if(String(comment.user) != String(user._id))
        {
          return res.status(404).json({ message: "You are not have permission to delete" })
        }
        comment.remove(function(error){
          if(error) {                              
            return res.status(404).json({ message: error })      
          }
          Post.findOne({_id: comment.post }, (error, post) => {
            post.comment.pull(id)
            post.save()
            return res.status(200).json({ message: "Delete comment succesfull" })
          })     
        })
     
      })       
    })   
  }

});
module.exports = router;
