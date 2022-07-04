var express = require("express");
var router = express.Router();
var bcrypt = require("bcrypt");
const saltRounds = 10;

var User = require("../models/user");
var Department = require("../models/department");
var Like = require("../models/like");
var Comment = require("../models/comment");
var Post = require("../models/post");
var Notification = require("../models/notification");

// AllPosts.findOne({ user: req.params.userid })
// .populate({path: 'housingposts', options: { sort: { 'date': -1 } } })

router.get('/', function (req, res, next) {
    // check login
    if (!req.session.user && !req.session.email) {
        return res.redirect("/login");
    }
    if(req.session.role != 0) {
        return res.redirect('/');
    }
    Department.find(function (err, departLst) {
        if (err) return res.status(404).json({ msg: "DB error" });
        let stu_departLst = [];
        departLst.forEach(depart => {
          if(depart.role == 1) stu_departLst.push(depart);
        })
        User.find({ $or: [{ role: 1 }, { role: 2 }] })
            .populate('department')
            .then(userLst => {
                let user_depart_lst = [];
                let user_stu_lst = [];

                userLst.forEach(user => {
                    if(user.role == 1)
                        user_depart_lst.push(user);
                    else
                        user_stu_lst.push(user);
                });

                User.findOne({ role: 0, username: req.session.user })
                  .then(useradmin => {
                    console.log('use:', useradmin._id);
                    return res.render("admin2", {
                      stu_departLst: stu_departLst,
                      departlst: departLst,
                      layout: "alayout",
                      title: "Admin Page",
                      user_depart_lst: user_depart_lst,
                      user_stu_lst: user_stu_lst,
                      userid: useradmin._id
                    });
                  })
                  .catch(err => {
                    console.log(err);
                    return res.status(404).json({ msg: "DB error" });
                  });
            })
            .catch(err => {
                console.log(err);
                return res.status(404).json({ msg: "DB error" });
            });
    });
});

router.post('/passchange/:id', (req, res, next) => {
  if (!req.session.user && !req.session.email) {
    return res.redirect("/login");
  }
  if(req.session.role != 0) {
      return res.redirect('/');
  }

  User.findOne({ _id: req.params.id })
    .then(user => {
      var oldpass = req.body.pass;
      var newpass = req.body.newpass;
      var confnewpass = req.body.confnewpass;
      if(oldpass != user.password) return res.json({ isvalid: false, msg: 'Sai mật khẩu!' });
      if(newpass != confnewpass) return res.json({ isvalid: false, msg: 'Xác nhận mật khẩu không chính xác!' });

      user.password = newpass;
      user.save((err, edited_user) => {
        if(err) return res.json({ isvalid: false, msg: err });
        return res.json({ isvalid: true, msg: 'Đổi mật khẩu thành công!' })
      });
    })
    .catch(err => {
      console.log(err);
      return res.status(404).json({ msg: "DB error" });
    });
});

router.post("/newDepartment", function (req, res, next) {
  let newDep = req.body.department;
  let departRole = req.body.departType;
  if (!newDep)
    return res.json({ isvalid: false, msg: "Chưa nhập tên phòng ban " });
  Department.findOne({ departmentName: newDep }, (error, user) => {
    if (error || user) {
      return res.json({
        isvalid: false,
        msg: "Đã tồn tại phòng ban, vui lòng nhập tên khác ",
      });
    }
    Department({
      departmentName: newDep,
      role: departRole
    }).save((err, new_depart) => {
      if (err) return res.status(404).json({ isvalid: false, msg: err });
      User.findById('61d84afc7a296768be4ffb06')
          .then(adUser => {
            adUser.department.push(new_depart.id);
            adUser.save();
            return res.json({ isvalid: true, newdepart: new_depart });
          })
          .catch(err => {
            console.log(err);
            return res.status(404).json({ msg: "DB error" });
          })
    });
  });
});

router.post("/createUser", function (req, res, next) {
  let name = req.body.name;
  let username = req.body.username;
  let password = req.body.password;
  let confpass = req.body.confpassword;
  let departlst = JSON.parse(req.body.department);

  if (!username)
    return res.json({ isvalid: false, msg: "Vui lòng nhập username " });
  if (!password)
    return res.json({ isvalid: false, msg: "Vui lòng nhập password " });
  if (password !== confpass)
    return res.json({
      isvalid: false,
      msg: "Confirm password không trùng khớp ",
    });
  if(departlst.length == 0)
    return res.json({
      isvalid: false,
      msg: "Vui lòng chọn Phòng ban",
    });

  User.findOne({ username: username }, (error, user) => {
    if (error || user) {
      return res.json({
        isvalid: false,
        msg: "Đã tồn tại username, vui lòng nhập tên khác ",
      });
    }
    bcrypt.hash(password, saltRounds).then(function (hash) {
      let newUser = new User({
        name: name,
        username: username,
        password: hash,
        role: 1,
      });
      departlst.forEach((departId) => {
        newUser.department.push(departId);
      });
      newUser.save((err, new_user) => {
        if (err) return res.status(404).json({ isvalid: false, msg: err });
        console.log(new_user._id);
        console.log(new_user.id);
        User.findOne({ _id: new_user.id })
        .populate('department')
        .then(result => {
          return res.json({ isvalid: true, newuser: result });
        })
        .catch(err => {
            console.log(err);
            return res.status(404).json({ msg: "DB error" });
        });
      });
    });
  });
});

// Delete department - done
router.delete("/delDepart", function (req, res, next) {
  let id = req.body.id;
  User.find()
    .then(userlst => {
      Department.findByIdAndDelete(id)
        .then((result) => {
          console.log('re: ', result);
          userlst.forEach(user => {
            user.department.pull(result._id);
            user.save();
          });

          return res.json({
            isvalid: true,
            msg: "Department " + result.departmentName + " had been deleted",
          });
        })
        .catch((err) => {
          return res.json({ isvalid: false, msg: err });
        });
    })
    .catch((err) => {
      return res.json({ isvalid: false, msg: err });
    });
});

// Delete user - done
router.delete("/delUser", function (req, res, next) {
  let id = req.body.id;
  
  User.findByIdAndDelete(id)
    .then((result) => {
      Post.deleteMany({ user: result._id })
        .then(postLst => {
          Comment.deleteMany({ user: result._id })
            .then(commentLst => {
              Like.deleteMany({ user: result._id })
                .then(likeLst => { 
                  Notification.deleteMany({ user: result._id })
                    .then(notiLst => {
                      return res.json({ isvalid: true });
                    })
                    .catch((err) => {
                      return res.json({ isvalid: false, msg: err });
                    });
                })
                .catch((err) => {
                  return res.json({ isvalid: false, msg: err });
                });
            })
            .catch((err) => {
              return res.json({ isvalid: false, msg: err });
            });
        })
        .catch((err) => {
          return res.json({ isvalid: false, msg: err });
        });
    })
    .catch((err) => {
      return res.json({ isvalid: false, msg: err });
    });
});

// Update department - done
router.put("/upDepart/:id", function (req, res, next) {
  Department.findOne({ _id: req.params.id }, (err, depart) => {
    if (err) return res.status(404).json({ isvalid: false, msg: err });
    if (!depart)
      return res
        .status(404)
        .json({ isvalid: false, msg: "Department not found!" });
    if (!req.body.name)
      return res.json({ isvalid: false, msg: "Must enter department name" });
    else {
      depart.departmentName = req.body.name;
    }
    depart.role = req.body.departType;
    depart.save((err, depart_update) => {
      if (err) return res.status(404).json({ isvalid: false, msg: err });
      return res
        .status(200)
        .json({ isvalid: true, msg: "Department update successfull", editeddepart: depart_update });
    });
  });
});

// Edit Depart User - done
router.put("/editDUser/:id", function (req, res, next) {
  User.findOne({ _id: req.params.id }, (err, user) => {
    if (err) return res.status(404).json({ isvalid: false, msg: err });
    if (!user)
      return res.status(404).json({ isvalid: false, msg: "User not found!" });
    
    let departlst = JSON.parse(req.body.department);

    if (!req.body.name)
      return res.json({ isvalid: false, msg: "Vui lòng nhập tên " });
    if(departlst.length == 0)
      return res.json({
        isvalid: false,
        msg: "Vui lòng chọn Phòng ban",
      });
    if(req.body.password) {
      if(req.body.password != req.body.confpassword)
        return res.json({
          isvalid: false,
          msg: "Confirm password không trùng khớp ",
        });
      user.password = req.body.password;
    };

    let lst = [];
    departlst.forEach((departId) => {
      lst.push(departId);
    });

    user.name = req.body.name;
    user.department = lst;

    user.save((err, user_update) => {
      if (err) return res.status(404).json({ isvalid: false, msg: err });
      user_update.populate('department')
        .then(user => {
          return res.status(200).json({ isvalid: true, msg: "User update successfull" , useredit: user});
        })
        .catch(err => {
          return res.status(404).json({ isvalid: false, msg: err });
        });
    });
  });
});

// Edit Student User - done
router.put("/editSUser/:id", function (req, res, next) {
  User.findOne({ _id: req.params.id }, (err, user) => {
    if (err) return res.status(404).json({ isvalid: false, msg: err });
    if (!user)
      return res.status(404).json({ isvalid: false, msg: "User not found!" });

    if (!req.body.name)
      return res.json({ isvalid: false, msg: "Vui lòng nhập tên " });
    if(!req.body.department)
      return res.json({
        isvalid: false,
        msg: "Vui lòng chọn Phòng ban",
      });
    // ???check class for student???

    user.name = req.body.name;
    user.class = req.body.stuclass;
    user.department = req.body.department;

    user.save((err, user_update) => {
      if (err) return res.status(404).json({ isvalid: false, msg: err });
      user_update.populate('department')
        .then(user => {
          return res.status(200).json({ isvalid: true, msg: "User update successfull" , useredit: user});
        })
        .catch(err => {
          return res.status(404).json({ isvalid: false, msg: err });
        });
    });
  });
});

router.get("/update", function (req, res, next) {
  // check login

  if (!req.session.user && !req.session.email) {
    return res.redirect("/login");
  }
  if(req.session.role != 0) {
    return res.redirect('/');
  } else {
    User.findOne({ role: 0 })
    .populate('department')
    .then(user => {
      return res.render('update', { layout: "alayout", user: user });
    })
    .catch(err => {
      console.log(err);
      return res.status(404).json({ msg: "DB error" });
    });
  }
});

router.get("/test2", function (req, res, next) {
  res.render("test2", { layout: "alayout.hbs" });
});
module.exports = router;
