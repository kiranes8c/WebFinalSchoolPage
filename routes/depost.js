var express = require("express");
var router = express.Router();
//var Depost = require("../models/depost");
var Notification = require("../models/notification");

var hbs = require("hbs");
var User = require("../models/user");
var Department = require("../models/department");
var moment = require("moment"); 
const { contentType, redirect } = require("express/lib/response");
const { route } = require(".");
const { findOne } = require("../models/user");
//Register Helper

router.get("/", function (req, res, next) {
  res.redirect("/depost/home/1");
});

router.get("/home/:page", function (req, res, next) {
  // check login

  if (!req.session.user && !req.session.email) {
    return res.redirect("/login");
  }
  let perPage = 10; // số lượng thông báo xuất hiện trên 1 page
  let page = req.params.page || 1;
  let pagearray = [];
  Department.find(function (err, departLst) {
    if (err) return res.status(404).json({ msg: "DB error" });
    Notification.find()
      .skip(perPage * page - perPage) // Trong page đầu tiên sẽ bỏ qua giá trị là 0
      .limit(perPage)
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

        Notification.countDocuments((err, count) => {
          if (err) return next(err);
          console.log('number of posts: ', count)
          // đếm để tính có bao nhiêu trang
          let pages = Math.ceil(count / perPage);
          
          for (i = 1; i <= pages; i++) {
            if (pagearray.length < 10) 
              pagearray.push(i);
          }

          return res.render("depost", {
            departlst: departLst,
            layout: "playout",
            title: "Department Posts - Home",
            depost_list: depost_list,
            current: page, // page hiện tại
            pages: pages, // tổng số các page
            pagearray: pagearray,
            filter: "home",
          });
        });
      })
      .catch((err) => {
        console.log(err);
        return res.status(404).json({ msg: "DB error" });
      });
  });
});

router.post("/filter", function (req, res, next) {
  console.log('filter: ', req.body.select);
  if (req.body.select !== '')
    res.redirect("/depost/filter/" + req.body.select + "/1");
  else
    res.redirect("/depost")
});

router.get("/filter/:departID/:page", function (req, res, next) {
  console.log(req.params.departID);
  // check login
  if (!req.session.user && !req.session.email) {
    return res.redirect("/login");
  }
  let perPage = 10; // số lượng thông báo xuất hiện trên 1 page
  let page = req.params.page || 1;
  let pagearray = [];
  Department.find(function (err, departLst) {
    if (err) return res.status(404).json({ msg: "DB error" });
    Notification.find({ department: req.params.departID })
      .skip(perPage * page - perPage) // Trong page đầu tiên sẽ bỏ qua giá trị là 0
      .limit(perPage)
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
        Notification.countDocuments(
          { department: req.params.departID },
          (err, count) => {
            // count = Notification.countDocuments({ _id: req.params.departID });
            console.log("number of posts: ", count);
            if (err) return next(err);
            // đếm để tính có bao nhiêu trang
            let pages = Math.ceil(count / perPage);

            for (i = 1; i <= pages; i++) {
              if (pagearray.length < 10) pagearray.push(i);
            }

            Department.findById(req.params.departID, function (err, rs) {
              console.log(rs.departmentName);
              return res.render("depost", { 
                departlst: departLst,
                layout: "playout",
                title: "Department Posts - Home",
                depost_list: depost_list,
                current: page, // page hiện tại
                pages: pages, // tổng số các page
                pagearray: pagearray,
                filter: "filter/" + req.params.departID,
                select: rs.departmentName,
                curr_id: rs.id
              });
            });

          }
        );
      })
      .catch((err) => {
        console.log(err);
        return res.status(404).json({ msg: "DB error" });
      });
  });
});

router.get("/list", function (req, res, next) {
  // check login

  if (!req.session.user && !req.session.email) {
    return res.redirect("/login");
  }

  Department.find().then((lst) => {
    var list = lst.map(function (depart) {
      return {
        id: depart.id,
        departName: depart.departmentName,
        count: depart.notification.length,
      };
    });
    // console.log("result: ", result);
    
    return res.render("delist", {
      departlst: list,
      layout: "playout",
      title: "Department List",
    });
  });

});
module.exports = router;
