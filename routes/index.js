var express = require('express');
var router = express.Router();
var bcrypt = require('bcrypt');
const saltRounds = 10;
const multer = require('multer');
var upload = multer({ 
  dest: './public/images/avatars/',
  limits: {
    fileSize: 4 * 1024 * 1024,
  }
});
const fs = require('fs');
var moment= require('moment');
const sharp = require('sharp');
const path = require('path');

var User = require('../models/user');
var Post = require('../models/post');
var Comment = require('../models/comment');
var Department = require("../models/department");
var Notification = require('../models/notification');
const e = require('express');
const { redirect } = require('express/lib/response');

/* GET home page. */
router.get("/", function (req, res, next) {
  console.log("session1" + req.session.user);
  console.log("session2" + req.session.email);

  if (!req.session.user && !req.session.email) {
    return res.redirect("/login");
  }
  console.log("role: ", req.session.role);
  // if (req.session.role == 1) {
  //   // res.redirect('/users')
  // }
  if(req.session.role == 2) {
    Post.find()
    .sort({ createdAt: -1 })
    .populate()
    .populate("user")     
    .populate({
      path: "like",
      populate: [
        {
          path: "user",
        },
      ]
    })       
    .populate({
      path: "comment",
      populate: [
        {
          path: "user",
        },
      ],
      options: { sort: { createdAt: -1 } },
    })
    .then((post) => {
      User.findOne({ email: req.session.email })
        .populate('department')
        .then((user) => {
          // console.log('khoa: ', user.department[0].departmentName)
          if (user.department[0]) {
            console.log('check khoa true')
          } else {
            console.log('check khoa false')
            console.log('id', user.id);
            return res.redirect("/edit/"+ user.id);
          }

          Notification.find()
            .limit(3)
            .sort({ createdAt: -1 })
            .populate("department")
            .then((listNoti) => {
              let depost_list = listNoti.map(function (myNoti) {
                return {
                  id: myNoti.id,
                  title: myNoti.title,
                  content: myNoti.content,
                  department: myNoti.department._id,
                  departmentName: myNoti.department.departmentName,
                  user: myNoti.user,
                  date: moment(myNoti.updatedAt).format("DD/MM/YYYY"),
                };
              });

              //return res.status(200).json(post);
              
              return res.render("index2", {
                post: post,
                user: user,
                depost_list: depost_list,
              });
            });
        }).catch((err) => {
          console.log(err);
          return res.status(404).json({ msg: "DB error" });
        });
      })
      .catch((error) => {
        console.log(error);
        res.render("index2");
    });
  } else {
    Post.find()
    .sort({ createdAt: -1 })
    .populate()
    .populate("user")     
    .populate({
      path: "like",
      populate: [
        {
          path: "user",
        },
      ]
    })       
    .populate({
      path: "comment",
      populate: [
        {
          path: "user",
        },
      ],
      options: { sort: { createdAt: -1 } },
    })
    .then((post) => {
      User.findOne({ username: req.session.user })
        .populate('department')
        .then((user) => {
          // console.log('khoa: ', user.department[0].departmentName)
          if (user.department[0]) {
            console.log('check khoa true')
          } else {
            console.log('check khoa false')
            console.log('id', user.id);
            return res.redirect("/edit/"+ user.id);
          }

          Notification.find()
            .limit(3)
            .sort({ createdAt: -1 })
            .populate("department")
            .then((listNoti) => {
              let depost_list = listNoti.map(function (myNoti) {
                return {
                  id: myNoti.id,
                  title: myNoti.title,
                  content: myNoti.content,
                  department: myNoti.department._id,
                  departmentName: myNoti.department.departmentName,
                  user: myNoti.user,
                  date: moment(myNoti.updatedAt).format("DD/MM/YYYY"),
                };
              });

              //return res.status(200).json(post);
              
              return res.render("index2", {
                post: post,
                user: user,
                depost_list: depost_list,
              });
            });
        }).catch((err) => {
          console.log(err);
          return res.status(404).json({ msg: "DB error" });
        });
      })
      .catch((error) => {
        console.log(error);
        res.render("index2");
    });
  }
  
    
});

router.get("/login", function (req, res, next) {
  if (req.session.user || req.session.email) {
    res.redirect("/");
  }
  res.render("login", { title: "Login", layout: false });
});

router.get("/logout", function (req, res, next) {
  if (req.session.user || req.session.email) {
    delete req.session.user;
    delete req.session.email;
  }
  
  res.redirect("/login");
});

router.post("/login", function (req, res, next) {
  console.log(req.body);

  var username = req.body.username;
  var name = req.body.name;
  var email = req.body.email;
  var pass = req.body.password;
  var id_gg = req.body.id_gg;
  var image_url = req.body.image_url;

  if(email){
    if(!email.includes("@student.tdtu.edu.vn"))
    {
      return res.status(200).json({message: "Error format" });
    }
  }
 
  if (email) {
    User.findOne({ email: email }, (error, user) => {
      if (!error && user) {
        req.session.email = user.email;
        req.session.role = user.role;
        return res.status(200).json({ message: "Student login sucessfull" });
      }

      //Check if student first login -> Save to DB
      let user_new = new User({
        name: name,
        email: email,
        id_gg: id_gg,
        image_url: image_url,
        role: 2,
      });
      console.log('user neww:', user_new);
      user_new.save((err, user_new) => {
        console.log('err:', err)
        if (err) {
          return res
            .status(404)
            .json({ error: "DB Error, please login again" });
        }
        req.session.email = user_new.email;
        req.session.role = user_new.role;
   
        return res.status(200).json({ message: "Student login sucessfull" });
      });
    });
  }
  else{
    //For Admin or phòng ban
    User.findOne({ username: username }, (error, user) => {
      if (error || !user) {
        // req.session.flash = {
        //   msg: 'Không tìm thấy email trong dữ liệu'
        // }
        return res.redirect("/login");
      }
      console.log(user);
      bcrypt.compare(pass, user.password).then(function (result) {
        console.log(result);
        if (result) {
          req.session.user = user.username;
          req.session.role = user.role;
          return res.redirect("/");
        }
        // req.session.flash = {
        //   msg: 'Sai email hoặc mật khẩu'
        // }
        return res.redirect("/login");
      });
    });
  }

});

// CongP 02.12.21 Update

router.get("/test", function (req, res, next) {
  res.render("test");
});

// CongP 06.12.21 Update
router.get("/me", function (req, res, next) {
  console.log("session1" + req.session.user);
  console.log("session2" + req.session.email);

  if (!req.session.user && !req.session.email) {
    return res.redirect("/login");
  }
  console.log("role: ", req.session.role);
  Post.find({})
    .populate()
    .populate("user")
    .populate({
      path: "like",
      populate: [
        {
          path: "user",
        },
      ]
    })    
    .populate({
      path: "comment",
      populate: [
        {
          path: "user",
        },
      ],
      options: { sort: { createdAt: -1 } },
    })
    .then((post) => {
      User.findOne({ email: req.session.email }, (error, user) => {
        if (error || !user) {
          return res.status(404).json({ message: error });
        }
        //return res.status(200).json(post);
        res.render("me", { post: post, user: user, user_show: user });
      });
    })
    .catch((error) => {
      console.log(error);
      res.render("me");
    });
});

router.get("/me/:id", function (req, res, next) {
  console.log("session1" + req.session.user);
  console.log("session2" + req.session.email);

  if (!req.session.user && !req.session.email) {
    return res.redirect("/login");
  }
  console.log("role: ", req.session.role);

  User.findOne({ email: req.session.email })
      .then((user) => {
        console.log(req.params.id)
        User.findOne({ _id: req.params.id })
            .populate({
              path:"post",
              populate:
              [
                { path: "user"},
                [{
                  path: "comment",
                  populate: 
                    {
                      path: "user"
                    }
                }],
                [{
                  path: "like",
                  populate: 
                    {
                      path: "user"
                    }
                }]               
              ],
              options: { sort: { createdAt: -1 } }
            })        
            .then((user_show) => {
              res.render("me", { post: user_show.post, user: user, user_show: user_show });
            })
            .catch((error) => {
              console.log(error);
              res.render("me");
            });  
      })
      .catch((error) => {
        console.log(error);
        res.render("me");
      }); 
     
});

router.get("/edit/:id", function (req, res, next) {
  if (!req.session.user && !req.session.email) {
    return res.redirect("/login");
  }
  Department.find({ role: 1 })
    .then(departLst => {
      let mydepart;
      User.findOne({ _id: req.params.id })
        .populate('department')
        .then(user => {
          if(user.role == 2 && user.email == req.session.email) {
            if(user.department[0]) {
              mydepart = user.department[0];
            }
            var haveImg = false
            if(user.image_url) haveImg = true;

            return res.render('edit', { 
              user: user, 
              departLst: departLst, 
              userDepart: mydepart
            });
          } else {
            return res.redirect('/');
          }
        })
        .catch(err => {
          console.log(err);
          return res.status(404).redirect('/404');
        })
    })
    .catch(err => {
      console.log(err);
      return res.status(404).json({ msg: "DB error" });
    });
});

router.put("/edit/:id", upload.single('edit_upload_img'),   function (req, res, next) {
  var dataform = req.body;
  console.log(dataform)
  var imgfile = req.file;
  console.log(imgfile);
  // fs.unlinkSync('../images/avatars/576e04ef0e071322dfae480299a183d0');
  User.findOne({ _id: req.params.id })
    .populate('department')
    .then(async user => {
      // if(dataform.edit_user_pw || dataform.edit_user_newpw || dataform.edit_user_confnewpw) {
      //   if(!dataform.edit_user_pw) return res.json({ isvalid: false, msg: 'Please enter your old password' });
      //   var checkpass = bcrypt.hashSync(dataform.edit_user_pw, saltRounds);
      //   if(checkpass != user.password) return res.json({ isvalid: false, msg: 'Your old password wrong' });
      //   if(!dataform.edit_user_newpw) return res.json({ isvalid: false, msg: 'Please enter your new password' });
      //   if(!dataform.edit_user_confnewpw) return res.json({ isvalid: false, msg: 'Please enter confirm new password' });
      //   if(dataform.edit_user_newpw != dataform.edit_user_confnewpw) return res.json({ isvalid: false, msg: 'Wrong confirm new password' });
      //   user.password = dataform.edit_user_newpw;
      // }
      user.name = dataform.edit_user_name;
      user.class = dataform.edit_user_class;
      user.department = dataform.states;
      if(imgfile) {
        if(user.image_url && fs.existsSync('public' + user.image_url)) fs.unlinkSync('public' + user.image_url);

        await sharp(req.file.path)
          .resize(720, 720)
          .jpeg({quality: 80})
          .toFile(req.file.destination + 'avatar_' + imgfile.filename);
        fs.unlinkSync(req.file.path);
        user.image_url = '/images/avatars/avatar_' + imgfile.filename;
      }

      user.save((err, update_user) => {
        console.log('user update: ', update_user);
        if (err) return res.status(404).json({ isvalid: false, msg: err });
        return res.json({ isvalid: true, msg: 'Update success' });
      })
    })
    .catch(err => {
      console.log(err);
      return res.status(404).redirect('/404');
    })
});

router.post('/avatarRm/:id', function(req, res) {
  var id = req.params.id;
  User.findOne({ _id: req.params.id })
    .then(user => {
      if(user.image_url && fs.existsSync('public' + user.image_url)) fs.unlinkSync('public' + user.image_url);
      user.image_url = '';

      user.save((err, update_user) => {
        if (err) return res.status(404).json({ isvalid: false, msg: err });
        return res.json({ isvalid: true, msg: 'Update success' });
      })
    })
    .catch(err => {
      console.log(err);
      return res.status(404).redirect('/404');
    })
});

router.get("/posts", function (req, res, next) {
  res.render("posts", { layout: "alayout.hbs", title: "Department Posts" });
});


router.get("/detail/:id", function (req, res, next) {
  if (!req.session.user && !req.session.email) {
    return res.redirect("/login");
  }
  Notification.findOne({ _id: req.params.id })
    .populate('department')
    .then(myNoti => {
      var mapNoti = {
        id: myNoti.id,
        title: myNoti.title,
        content: myNoti.content,
        department:  myNoti.department._id,
        departmentName: myNoti.department.departmentName,
        user: myNoti.user,
        date: moment(myNoti.updatedAt).format('DD/MM/YYYY')
      };
      return res.render('detail', {
        layout: 'playout.hbs',
        title: "Detail Posts",
        noti: mapNoti
      });
    })
    .catch(err => {
      console.log(err);
      return res.status(404).json({ msg: "DB error" });
    });
});

module.exports = router;
