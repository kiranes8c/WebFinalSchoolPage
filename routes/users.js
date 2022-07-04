var express = require("express");
var router = express.Router();
var bcrypt = require("bcrypt");
var moment = require("moment"); 
const saltRounds = 10;

var User = require("../models/user");
var Department = require("../models/department");
var Notification = require("../models/notification");

router.get("/", function (req, res, next) {
  // check login
  if (!req.session.user && !req.session.email) {
    return res.redirect("/login");
  }
  if(req.session.role == 2 || !req.session.user) {
      return res.redirect('/');
  }
  User.findOne({ username: req.session.user })
    .populate("department")
    .then(user => {
      return res.render('user', {
        layout: "alayout",
        title: "Users Page",
        user: user,
        userid: user._id
      })
    })
    .catch(err => {
      console.log(err);
      return res.status(404).json({ msg: "DB error" });
    })
});

router.post('/notiPost', (req, res, next) => {
  var userid = req.body.id;
  var depart = req.body.depart;
  var title = req.body.title;
  var content = req.body.content;
  if(!title) return res.json({ isvalid: false, msg: 'Vui lòng ghi tiêu đề bài đăng!' });
  User.findOne({ _id: userid })
      .populate('department')
      .then(user => {
        var newNoti = new Notification({
          title: title,
          content: content,
          department: depart,
          user: userid
        });
        newNoti.save((err, notification) => {
          if(err) res.status(404).json({ isvalid: false, msg: err });
          user.notification.push(notification.id);
          user.save();
          Department.findById(depart)
              .then(mydepart => {
                mydepart.notification.push(notification.id);
                mydepart.save();
                return res.json({ isvalid: true, mydepartName: mydepart.departmentName, mynoti: notification });
              })
              .catch(err => {
                console.log(err);
                return res.status(404).json({ msg: "DB error" });
              })
        })
      })
      .catch(err => {
        console.log(err);
        return res.status(404).json({ msg: "DB error" });
      })
});


router.get("/posted", function (req, res, next) {
  res.redirect("/users/posted/1");
});

router.get("/posted/:page", function (req, res, next) {
  // check login
  if (!req.session.user && !req.session.email) {
    return res.redirect("/login");
  }
  if (req.session.role == 2 || !req.session.user) {
    return res.redirect("/");
  }
  User.findOne({ username: req.session.user })
    .populate("department")
    .then((user) => {
      
      let perPage = 10; // số lượng thông báo xuất hiện trên 1 page
      let page = req.params.page || 1;
      let pagearray = [];
      console.log('user id: ', user.id);
      Notification.find({ user: user.id })
        .skip(perPage * page - perPage) // Trong page đầu tiên sẽ bỏ qua giá trị là 0
        .limit(perPage)
        .sort({ createdAt: -1 })
        .populate("user")
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
          Notification.countDocuments({ user: user }, (err, count) => {
            // count = Notification.countDocuments({ _id: req.params.departID });
            console.log("number of posts: ", count);
            if (err) return next(err);
            // đếm để tính có bao nhiêu trang
            let pages = Math.ceil(count / perPage);

            for (i = 1; i <= pages; i++) {
              if (pagearray.length < 10) pagearray.push(i);
            }
            return res.render("posted", {
              // departlst: departLst,
              layout: "alayout",
              title: "User Posts",
              depost_list: depost_list,
              current: page, // page hiện tại
              pages: pages, // tổng số các page
              pagearray: pagearray
            });
          });
        })
        .catch((err) => {
          console.log(err);
          return res.status(404).json({ msg: "DB error" });
        });
    })
    .catch((err) => {
      console.log(err);
      return res.status(404).json({ msg: "DB error" });
    });
});

router.get('/mypost/edit/:id', function(req, res, next) {
  if (!req.session.user && !req.session.email) {
    return res.redirect("/login");
  }
  if (req.session.role == 2 || !req.session.user) {
    return res.redirect('/');
  }
  
  User.findOne({ username: req.session.user })
    .populate("department")
    .populate("notification")
    .then((user) => {
      var nextRun = false;
      user.notification.forEach(userNoti => {
        if(req.params.id == userNoti.id){
          nextRun = true;
        }
      });

      if(!nextRun) return res.redirect('/');
      Notification.findOne({ _id: req.params.id })
        .populate('department')
        .then(myNoti => {
          var mapNoti = {
            id: myNoti.id,
            title: myNoti.title,
            content: myNoti.content,
            department:  myNoti.department._id,
            departmentName: myNoti.department.departmentName,
          };

          return res.render("editNoti", {
            layout: "alayout",
            title: "Edit Posts",
            user: user,
            noti: mapNoti
          });
        })
        .catch(err => {
          console.log(err);
          return res.status(404).json({ msg: "DB error" });
        });
    })
    .catch((err) => {
      console.log(err);
      return res.status(404).json({ msg: "DB error" });
    });
});

router.post('/mypost/edit', function(req, res, next) {
  if (!req.session.user && !req.session.email) {
    return res.redirect("/login");
  }
  if (req.session.role == 2 || !req.session.user) {
    return res.redirect('/');
  }

  var id = req.body.id;
  var depart = req.body.depart;
  var title = req.body.title;
  var content = req.body.content;
  if(!title) return res.json({ isvalid: false, msg: 'Vui lòng ghi tiêu đề bài đăng!' });

  Notification.findById(id)
    .then(myNoti => {
      myNoti.department = depart;
      myNoti.title = title;
      myNoti.content = content;

      myNoti.save((err, edited_noti) => {
        if(err) res.status(404).json({ isvalid: false, msg: err });
        console.log('edit: ');
        return res.json({ isvalid: true, msg: 'Cập nhật bài đăng thành công!' });
      });
    })
    .catch(err => {
      console.log(err);
      return res.status(404).json({ msg: "DB error" });
    });
});

router.delete('/mypost/delete/:id', function(req, res, next) {
  if (!req.session.user && !req.session.email) {
    return res.redirect("/login");
  }
  if (req.session.role == 2 || !req.session.user) {
    return res.redirect('/');
  }
  Notification.findByIdAndDelete(req.params.id)
    .then(deleted_noti => {
      User.findById(deleted_noti.user)
        .then(user => {
          user.notification.pull(deleted_noti._id);
          user.save();
          Department.findById(deleted_noti.department)
            .then(depart => {
              depart.notification.pull(deleted_noti._id);
              depart.save();
              return res.json({ isvalid: true, noti: deleted_noti });
            })
            .catch((err) => {
              console.log(err);
              return res.status(404).json({ msg: "DB error" });
            });
        })
        .catch((err) => {
          console.log(err);
          return res.status(404).json({ msg: "DB error" });
        });
    })
    .catch((err) => {
      console.log(err);
      return res.status(404).json({ msg: "DB error" });
    });
});

module.exports = router;
