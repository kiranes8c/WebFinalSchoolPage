
// window.onload = function () {
//   gapi.load("auth2", function () {
//     gapi.auth2.init();
//   });
// };
function onLoad() {
  gapi.load('auth2', function() {
    gapi.auth2.init();
  });
}
const socket = io('/');

function onSignIn(googleUser) {
  var profile = googleUser.getBasicProfile();
  var user_student = {
    id_gg: profile.getId(),
    name: profile.getName(),
    email: profile.getEmail(),
    image_url: profile.getImageUrl()
  };
  $("#signInDiv").css("display", "none")
  $("#loadingBtn").css("display", "block")
  $.ajax({
    url: "/login",
    method: "post",
    data: user_student,
    success: function (user) {
      console.log(user)
      if(user.message == 'Error format'){
        document.getElementById('myFlashMsgLogin').style.display = 'inline-block';
        $('#flashLogin').text("Login must contain: @student.tdtu.edu.vn");
        document.getElementById('myFlashMsgLogin').classList.add('show');   

        gapi.auth2
        .getAuthInstance()
        .signOut()
        .then(function () {
          $("#signInDiv").css("display", "block")
          $("#loadingBtn").css("display", "none")
          console.log("Sign Out");
          //window.location.replace("/logout");
        });
      }
      else{
        window.location.replace("/");
      }
    },
    error: function (user) {
      alert(user.error);
    },
  });
};
function signOut() {
  console.log("logging out");
  gapi.auth2
    .getAuthInstance()
    .signOut()
    .then(function () {
      console.log("Sign Out");
      window.location.replace("/logout");
    });
};

// ------------------------- Create department, Create User -------------
function closeFlash() {
  document.getElementById('myFlashMsg').style.display = 'none';
  document.getElementById('flash_link').href = '#';
  $('#flashDepart').text('Holy OMG');
  document.getElementById('myFlashMsg').classList.remove('show');
};

function closeFlashLogin() {
  document.getElementById('myFlashMsgLogin').style.display = 'none';
  document.getElementById('myFlashMsgLogin').classList.remove('show');
};

function newDepartment() {
  var newDep = $("#newDepartment").val();
  var depart_radio = document.getElementsByName('radio_depart');
  var departType;
  depart_radio.forEach(type => {
    if(type.checked) {
      departType = type.value;
    };
  });
  $.ajax({
      url: '/admin/newDepartment',
      method: 'post',
      data: {department: newDep, departType: departType},
      success: function(data) {
          if(data.isvalid) {
              $('#newDepartment').val('');
              document.getElementsByName('radio_depart')[0].checked = true;
              document.getElementById('depart_table').innerHTML += '<tr id="tr_depart' + data.newdepart._id + '">' + 
                '<td id="depart_role_' + data.newdepart.role + '">' + data.newdepart.departmentName + '</td>' +
                '<td>' +
                  '<button type="button" class="btn btn-light fa fa-edit" onclick="editDepartDialog(`' + data.newdepart._id + '`)" data-toggle="modal" data-target="#edit-department-dialog"/>' +
                  '<button type="button" class="btn btn-light fa fa-minus-circle" onclick="confirmDelDepart(`' + data.newdepart._id + '`)" data-toggle="modal" data-target="#conf-del-depart"/>' +
                '</td>' +
              '</tr>';
          } else {
              alert(data.msg);
          }
      },
      error: function(xhr, sts, errr) {
          console.log(err);
      }
  });
};

function setCreate() {
  $(".js-example-basic-multiple").select2();
};

function createUser() {
  var departlst = $(".js-example-basic-multiple").select2("val");
  $.ajax({
    url: "/admin/createUser",
    method: "post",
    data: {
      name: $("#newName").val(),
      username: $("#newUsername").val(),
      password: $("#newPassword").val(),
      confpassword: $("#newConfpassword").val(),
      department: JSON.stringify(departlst),
    },
    success: function (data) {
      if (data.isvalid) {
        $("#newName").val("");
        $("#newUsername").val("");
        $("#newPassword").val("");
        $("#newConfpassword").val("");
        $(".js-example-basic-multiple").val("").trigger("change");

        let email = '';
        if(data.newuser.email) email = data.newuser.email;
        let tb_html = 
          '<tr id="tr_user' + data.newuser._id + '">' +
            '<td>' +
                '<img src="/w3images/avatar2.png" class="w3-left w3-circle w3-margin-right" style="width:35px">' +
                '<span class="w3-xlarge">' + data.newuser.name + '</span><br>'+
            '</td>' +
            '<td>' + data.newuser.username + '</td>' +
            '<td>' + email + '</td>' +
            '<td id="td_depart_' + data.newuser._id + '">';
        
        if(data.newuser.department) {
          data.newuser.department.forEach(depart => {
            tb_html += '<p id="DU_' + depart._id + '">' + depart.departmentName + '</p>';
          })
        }

        tb_html +=        
            '</td>' +
            '<td>' +
                '<button type="button" class="btn btn-light fa fa-edit" onclick="editDUserDialog(`' + data.newuser._id + '`, `' + data.newuser.username + '`)" data-toggle="modal" data-target="#edit-userdepart-dialog"/>' +
                '<button type="button" class="btn btn-light fa fa-minus-circle" onclick="confirmDelUser(`' + data.newuser._id + '`, `' + data.newuser.username + '`)" data-toggle="modal" data-target="#conf-del-user"/>' +
            '</td>' +
        '</tr>';
        document.getElementById('departuser_table').innerHTML += tb_html;
      } else {
        alert(data.msg);
      }
    },
    error: function (xhr, sts, errr) {
      console.log(err);
    },
  });
};

function confirmDelDepart(id) {
  $('#delDepartName').text(document.getElementById('tr_depart' + id).cells[0].innerText);
  $('#delidD').val(id);
};

function confirmDelUser(id, name) {
  $('#delUserName').text(name);
  $('#delidU').val(id);
};

function editDepartDialog(id) {
  $('#editDepartment').val(document.getElementById('tr_depart' + id).cells[0].innerText);
  $('#editD').val(id);
  var role = document.getElementById('tr_depart' + id).cells[0].id.replace('depart_role_', '');
  var depart_radio = document.getElementsByName('radio_edit_depart');
  depart_radio.forEach(type => {
    if(type.value == role) {
      type.checked = true;
    }
  });
};

function editDepart() {
  let id = $('#editD').val();
  let edit_name = $('#editDepartment').val();
  var depart_radio = document.getElementsByName('radio_edit_depart');
  var departType;
  depart_radio.forEach(type => {
    if(type.checked) {
      departType = type.value;
    }
  });
  $.ajax({
    url: '/admin/upDepart/' + id,
    method: 'put',
    data: { name: edit_name, departType: departType },
    success: function (data) {
      if (data.isvalid) {
        $('#editDepartment').val('');
        $('#editD').val();
        document.getElementsByName('radio_edit_depart')[0].checked = true;
        document.getElementById('tr_depart' + id).cells[0].innerText = data.editeddepart.departmentName;
        document.getElementById('tr_depart' + id).cells[0].id = 'depart_role_' + data.editeddepart.role;
        alert(data.msg);
      } else {
        alert(data.msg);
      }
    },
    error: function (xhr, sts, errr) {
      console.log(err);
    },
  });
};

function editDUserDialog(id, username) {
  $(".js-editDU-basic-multiple").select2();
  $('#editUD_hidden').val(id);
  $('#editUserDepart').text(username);
  $('#editUDName').val(document.getElementById('tr_user' + id).cells[0].children[1].innerText);
  var lst_p = document.getElementById('td_depart_' + id).getElementsByTagName('p');
  var departLst = [];
  for (var i = 0; i < lst_p.length; i++) {
    departLst.push(lst_p[i].id.replace('DU_', ''));
  }
  $(".js-editDU-basic-multiple").val(departLst).trigger('change');
};

function editDUser() {
  var id = $('#editUD_hidden').val();
  var departlst = $(".js-editDU-basic-multiple").select2("val");
  $.ajax({
    url: "/admin/editDUser/" + id,
    method: "put",
    data: {
      name: $('#editUDName').val(),
      password: $("#newDUPassword").val(),
      confpassword: $("#newDUPasswordConf").val(),
      department: JSON.stringify(departlst),
    },
    success: function (data) {
      if (data.isvalid) {
        document.getElementById('tr_user' + id).cells[0].children[1].innerText = data.useredit.name;
        var departHtml = '';
        data.useredit.department.forEach(depart => {
          departHtml += '<p id="DU_' + depart._id + '">'+ depart.departmentName + '</p>';
        });
        document.getElementById('td_depart_' + id).innerHTML = departHtml;
        alert(data.msg);
      } else {
        alert(data.msg);
      }
    },
    error: function (xhr, sts, errr) {
      console.log(err);
    },
  });
};

function editSUserDialog(id, email) {
  $(".js-editSU-basic-single").select2();
  $('#editSU_hidden').val(id);
  $('#editUserStu').text(email);
  $('#editSUName').val(document.getElementById('tr_user' + id).cells[0].children[1].innerText);
  $('#editSUClass').val(document.getElementById('tr_user' + id).cells[2].innerText);
  var departid = document.getElementById('td_stu_' + id).getElementsByTagName('span');
  if(departid.length != 0) {
    $(".js-editSU-basic-single").val(departid[0].id.replace('SU_', '')).trigger('change');
  }
};

function editSUser() {
  var id = $('#editSU_hidden').val();
  var depart = $(".js-editSU-basic-single").select2("val");
  $.ajax({
    url: "/admin/editSUser/" + id,
    method: "put",
    data: {
      name: $('#editSUName').val(),
      stuclass: $('#editSUClass').val(),
      department: depart,
    },
    success: function (data) {
      if (data.isvalid) {
        document.getElementById('tr_user' + id).cells[0].children[1].innerText = data.useredit.name;
        document.getElementById('tr_user' + id).cells[2].innerText = data.useredit.class;
        document.getElementById('td_stu_' + id).innerHTML = '<span id="SU_' + data.useredit.department[0]._id + '">'+ data.useredit.department[0].departmentName + '</span>';
        alert(data.msg);
      } else {
        alert(data.msg);
      }
    },
    error: function (xhr, sts, errr) {
      console.log(err);
    },
  });
};

function delDepart() {
  let id = $("#delidD").val();
  $.ajax({
    url: "/admin/delDepart",
    method: "delete",
    data: { id: id },
    success: function (data) {
      if (data.isvalid) {
        $("#tr_depart" + id).remove();
        $("#delDepartName").text("");
        $("#delidD").val("517H0042");
        alert(data.msg);
      } else {
        alert(data.msg);
      }
    },
    error: function (xhr, sts, errr) {
      console.log(err);
    },
  });
};

function delUser() {
  let id = $('#delidU').val();
  $.ajax({
    url: '/admin/delUser',
    method: 'delete',
    data: { id: id },
    success: function (data) {
      if (data.isvalid) {
        $('#tr_user' + id).remove();
        $('#delUserName').text('');
        $('#delidU').val('517H0042');
      } else {
        alert(data.msg);
      }
    },
    error: function (xhr, sts, errr) {
      console.log(err);
    },
  });
};

function previewEditAvatar(input) {
  var imgfile = $("#edit_upload_img").get(0).files[0];
  if(imgfile){
    var reader = new FileReader();

    reader.onload = function(){
        $("#edit_user_avatar").attr("src", reader.result);
    }
    reader.readAsDataURL(imgfile);
  }
};

function closeEditError() {
  document.getElementById('edit_user_div_error').className = 
    document.getElementById('edit_user_div_error').className.replace( /(?:^|\s)show(?!\S)/g , '' );
  $('#edit_user_error').text('OMG ERROR');
};

function editUser(event) {
  event.preventDefault();
  var id = $('#edit_hidden_id').val();
  var formData = new FormData(document.getElementById("formEditUser"));
  $.ajax({
      type: "PUT",
      url: "/edit/" + id,
      data: formData,
      processData: false,
      contentType: false,
      success: function(data){
        if (data.isvalid) {
          console.log(data.msg);
          window.location.reload();
          // ??????
        } else {
          $('#edit_user_error').text(data.msg);
          document.getElementById('edit_user_div_error').classList.add('show');
        }
      },
      error: function (err) {
        console.log(err);
        alert(err);
      }
  });  
};

function avatarRemove() {
  var id = $('#edit_hidden_id').val();
  $.ajax({
    type: "POST",
    url: "/avatarRm/" + id,
    success: function(data){
      if (data.isvalid) {
        // ??????
      } else {
        $('#edit_user_error').text(data.msg);
        document.getElementById('edit_user_div_error').classList.add('show');
      }
    },
    error: function (err) {
      console.log(err);
      alert(err);
    }
  }); 
};

function notiSubmit() {
  var id = $('#userHidden').val();
  var depart = $('#user_selected_depart').find(':selected').val();
  var title = $('#user_noti_title').val().replace(/\n/g, '<br/>');
  var content = $('#user_noti_content').val().replace(/\n/g, '<br/>');
  $.ajax({
    type: "POST",
    url: "/users/notiPost",
    data: {
      id: id,
      depart: depart,
      title: title,
      content: content
    },
    success: function(data){
      if (data.isvalid) {
        socket.emit('showFlash', { depart: data.mydepartName, noti: data.mynoti });
        $('#user_noti_title').val('');
        $('#user_noti_content').val('');
        alert('Đăng thông báo thành công!');
      } else {
        alert(data.msg);
      }
    },
    error: function (err) {
      console.log(err);
      alert(err);
    }
  }); 
};

function notiEditSubmit() {
  var id = $('#notiHidden').val();
  var depart = $('#user_editselected_depart').find(':selected').val();
  var title = $('#user_editnoti_title').val().replace(/\n/g, '<br/>');
  var content = $('#user_editnoti_content').val().replace(/\n/g, '<br/>');
  $.ajax({
    type: "POST",
    url: "/users/mypost/edit",
    data: {
      id: id,
      depart: depart,
      title: title,
      content: content
    },
    success: function(data){
      if (data.isvalid) {
        alert(data.msg);
      } else {
        alert(data.msg);
      }
    },
    error: function (err) {
      console.log(err);
      alert(err);
    }
  });
};

function editNotiLoad(title, content) {
  $('#user_editnoti_title').val(title.replace('<br/>', '\n'));
  $('#user_editnoti_content').val(content.replaceAll('<br/>', '\n'));
};

function confirmDelPost(id) {
  $('#delPostId').val(id);
};

function delPost() {
  var id = $('#delPostId').val();
  $.ajax({
    type: 'DELETE',
    url: "/users/mypost/delete/" + id,
    success: function(data){
      if (data.isvalid) {
        $('#li_post_' + data.noti._id).remove();
        $('#delPostId').val('517H0042');
        alert("Xóa bài post thành công!");
      } else {
        alert(data.msg);
      }
    },
    error: function (err) {
      console.log(err);
      alert(err);
    }
  })
};

function changePass(id) {
  $.ajax({
    type: 'POST',
    url: '/admin/passchange/' + id,
    data: {
      pass: $('#admin_currpass').val(),
      newpass: $('#admin_newpass').val(),
      confnewpass: $('#admin_confnewpass').val()
    },
    success: data => {
      alert(data.msg);
    },
    error: function (err) {
      console.log(err);
      alert(err);
    }
  });
};

socket.on('showFlash', ({ depart, noti }) => {
  document.getElementById('myFlashMsg').style.display = 'inline-block';
  document.getElementById('flash_link').href = '/detail/' + noti._id;
  $('#flashDepart').text(depart);
  var departpost = document.getElementById('index_ul_departpost').innerHTML;
  var date = new Date(noti.updatedAt);
  console.log(date);
  document.getElementById('index_ul_departpost').innerHTML = 
    '<li>' + 
      '<span><a href="/detail/' + noti._id + '">' + noti.title + '</a></span>' +
      '<p>' + depart + '| Ngày đăng ' + String(date.getDate()).padStart(2, '0') + '/' + String(date.getMonth() + 1).padStart(2, '0') + '/' + date.getFullYear() + '</p>' +
    '</li>';
    document.getElementById('index_ul_departpost').innerHTML += departpost;
  document.getElementById('myFlashMsg').classList.add('show');
});

// ------------------------- Layout -------------------------------------

//----------------------------- Post, Like, Comment ------------------------------------

function addPost(post){
  var post_id = "'" + post._id + "'"
  var youtube_link = ''
  var img = ''
  var imgLink = ''
  if(post.image){
    img = '<img src="' + post.image +  '" alt="" id = "imgPost'+ post._id +'">'
  }
  if(post.youtube_url)
  {
  youtube_link = 
                 '<p id = "videoPost' + post._id +'" hidden>' + post.youtube_url + '</p>' +
                 '  <iframe width="420" height="315" ' +
                 '  src= ' + post.youtube_url          +
                 ' allow="autoplay;" allowfullscreen id = "if_frame' +post._id +'" >' +
                 ' </iframe>                         '
  }

  if($("#userImgUrl").val()){
    imgLink = $("#userImgUrl").val()
  }
  else{
    imgLink = "./images/tdt.png"
  }

  console.log(post_id)
  var post_link = 
  '<div class="central-meta item" id = "postDiv' + post._id +'">' +
    '<div class="user-post">'         +
    '  <div class="friend-info">    ' +
    '    <figure>                   ' +
    '      <img src="' + imgLink +'" alt="">' + 
    '    </figure>                  ' +
    '    <div class="friend-name">  ' +
    '      <ins><a href="/me/' + post.user._id + '" title="">' + post.user.name + '</a>' +
          '<i class="fa fa-remove" style="cursor: pointer;float: right;margin-right:10px;"' +
          ' data-toggle="modal" data-target="#deletePost" onclick="showDelPost(' + post_id  +')"></i>' +
          '<i class="fa fa-edit" style="cursor: pointer;float: right;margin-right:10px;"' +
          'data-toggle="modal" data-target="#editPost" onclick="showPost(' + post_id  +')" ></i>' +
    '      </ins> ' +
    '      <span>published: ' + post.create_date + '</span> ' +
    '    </div>                     ' +
    '    <div class="description">  ' +
    '      <p id = "contentPost' + post._id + '">' +
              post.content +
    '      </p>                     ' +
    '    </div>                     ' +
    '    <div class="post-meta">    ' +
          img + youtube_link +            
    '      <div class="we-video-info">  ' +
    '        <ul>                       ' +
    '          <li>                     ' +
    '            <span class="like" data-toggle="tooltip" ' +
    '              title="like">        ' +
    '              <i class="ti-heart" id = "Ilike'+ post._id +'" onclick="likePost(' + post_id +')"></i> ' +
    '              <ins id="like'+ post._id + '">0</ins>         ' +
    '            </span>                ' +
    '          </li>                    ' +
    '          <li>                     ' +
    '            <span class="comment" data-toggle="tooltip" ' +
    '              title="Comments">    ' +
    '              <i class="fa fa-comments-o"></i>          ' +
    '            </span>                ' +
    '          </li>                    ' +
    '        </ul>                      ' +
    '      </div>                       ' +
    '    </div>                         ' +
    '  </div>                           ' +
    '  <div class="coment-area">        ' +
    '    <ul class="we-comet">          ' +
    '      <li class="post-comment">    ' +
    '        <div class="comet-avatar"> ' +
    '<img src="' + imgLink +'" alt="" width="30px">' +
    '        </div>                     ' +
    '        <div class="post-comt-box"> ' +
    '          <form method="post">      ' +
    '            <textarea placeholder="Post your comment" ' +
    '              id="comment_content' + post._id +'"' +
    '              onkeypress="post_comment(event,' + post_id +')"></textarea> ' +
    '            <div class="add-smiles">             ' +
    '              <span class="em em-expressionless" ' +
    '                title="add icon"></span>         ' +
    '            </div>                               ' +
    '            <button type="submit"></button>      ' +
    '          </form>                                ' +
    '        </div>                                   ' +
    '          </li>                                  ' +
    '    </ul>                                        ' +
    '    <ul class="container we-comet"  id = "post_comment' + post._id  + '"> ' +
    '    </ul>                                        ' +
    '  </div> ' +
    '</div> ' +
  '</div> '

  return post_link;
};

//New Post
function postForm(e) {
  e.preventDefault();
  var formData = new FormData(document.getElementById("formSubmit"));
  $.ajax({
      type: "POST",
      url: "/post/",
      data: formData,
      processData: false,
      contentType: false,
      success: function(data){
        //Clear
        $("#content").val("")
        $("#video_youtube").val("")
        $("#previewImg").attr("src", "");
        $("input[type=file]").val("")
        $("#youtube_link").css("display", "none")
        console.log(data)
        $('#list_post').prepend(addPost(data))
      },
      error: function (err) {
        console.log(err);
        alert(err);
      }
  });  
};

//edit Post
function putForm(e) {
  console.log("test")
  e.preventDefault();
  var formData = new FormData(document.getElementById("formSubmitEdit"));
  $.ajax({
      type: "PUT",
      url: "/post/",
      data: formData,
      processData: false,
      contentType: false,
      success: function(data){
        var id = data._id
        console.log(data)
        $('#contentPost' + id).text(data.content)
        let img = $("#previewImgEdit").attr("src");

        $("#imgPost" + id).attr('src', img);
        $("#if_frame" + id).attr('src', data.youtube_url);  
        $("#videoPost" + id).text(data.youtube_url);
        document.getElementById("close_post").click()
      },
      error: function (err) {
        console.log(err);
        alert(err);
      }
  });  
};

function previewFile(input){
  $("#youtube_link").css("display", "none")
  var file = $("input[type=file]").get(0).files[0];
  if(file){
    var reader = new FileReader();

    reader.onload = function(){
        $("#previewImg").attr("src", reader.result);
    }

    reader.readAsDataURL(file);
    $("#video_youtube").val("")
  }
};
//Show Post need to edit
function showPost(id) {
  console.log("vô")
  //Refresh data
  $("#previewImgEdit").attr("src", "");
  $("#previewImgEdit").css("display", "none")
  $("#youtube_link_edit").css("display", "none")

  //Content
  let content = $("#contentPost" + id).text()
  console.log(content)
  $("#edit_post").val(content)

  //Send ID
  $("#postEdit").val(id)

  if($("#imgPost" + id).length != 0)
  {
    //Image
    $("#previewImgEdit").css("display", "block")
    let img = $("#imgPost" + id).attr('src');
    $("#previewImgEdit").attr("src", img);


    //icon
    $("#image_edit_icon").show()
    $("#video_edit_icon").hide()
  }

  if($("#videoPost" + id).length != 0){
    //Video
    let video_link = $("#videoPost" + id).text()
    $("#youtube_link_edit").css("display", "block")
    $("#video_youtube_edit").val(video_link)

    //icon
    $("#image_edit_icon").hide()
    $("#video_edit_icon").show()   
  }

};

function showDelPost(id) {

  $('#postDelete').val(id);
};

//Delete Post
function deletePost() {

  let id = $("#postDelete").val(); 
  var postDelete = $('#postDiv' + id);

  $.ajax({
      url: "/post/" + id,
      method: "DELETE",
      success: function(data){
        //Clear
        postDelete.remove();
      },
      error: function (err) {
        console.log(err.responseJSON.message);
        alert(err.responseJSON.message);
      }
  });  
};

function previewFileEdit(input){
  console.log($("#file_edit"))
  var file = $("#file_edit").get(0).files[0];
  if(file){
    var reader = new FileReader();
    reader.onload = function(){
        $("#previewImgEdit").attr("src", reader.result);
    }
    reader.readAsDataURL(file);
  }
};

function showVideo() {
  if ($("#youtube_link").css("display") == "none") {
    $("#youtube_link").css("display", "block");
    $("#previewImg").attr("src", "");
    $("input[type=file]").val("");
  } else {
    $("#youtube_link").css("display", "none");
  }
};

//like Post

function likePost(id) {

    var like = {
      id: id
    };

    $.ajax({
      url: "/post/like/" + id,
      method: "post",
      data: like,
      success: function (post) {
        console.log(post)
        let like_count = post.like.length;
        var Ilike = $("#Ilike" + post._id).attr('class')
        if(Ilike == 'ti-heart')
        {
          $("#Ilike" + post._id).removeClass('ti-heart');
          $("#Ilike" + post._id).addClass('fa');
          $("#Ilike" + post._id).addClass('fa-heart');
        }
        else{
          $("#Ilike" + post._id).removeClass('fa');
          $("#Ilike" + post._id).removeClass('fa-heart');
          $("#Ilike" + post._id).addClass('ti-heart');
        }
        
        $("#like" + post._id).text(like_count);
      },
      error: function (err) {
        console.log(err.responseJSON);
        alert(err.responseJSON.message);
      },
    });

};

//New Comment
function post_comment(e, id) {
  //Press enter event
  if (e.keyCode == 13) {
    //Post
    let post_comment = $("#post_comment" + id);
    //Get content of comment
    let comment_content = $("#comment_content" + id);
    console.log(comment_content.val())
    var comment = {
      id_post: id,
      comment: comment_content.val(),
    };
    if($("#userImgUrl").val()){
      imgLink = $("#userImgUrl").val()
    }
    else{
      imgLink = "./images/tdt.png"
    }
    
    $.ajax({
      url: "/post/comment",
      method: "post",
      data: comment,
      success: function (comment) {
        console.log(comment)
        var comment_id = "'" + comment.id + "'"
        var comment_HTML =
          '<li ' + 'class="flex"' + "id = 'commentLi" + comment.id  + "'>" +
              '<div class="comet-avatar">' +
                '<img src="' + imgLink +'" alt="" width="30px">' +
              '</div>' +
              '<div class="we-comment">' +
                '<div class="coment-head">' +
                  '<h5><a href="/me/'+ comment.user_id +'" title="">' +
                  comment.user_name +
                  '</a></h5>' +
                  '<span>' +
                  comment.create_date +
                  "</span>" +
                '<i class="fa fa-remove" style="cursor: pointer;float: right;margin-right:10px;" data-toggle="modal"' +
                'data-target="#deleteComment" onclick="showDelComment(' + comment_id +')"></i>' +            
                '<i class="fa fa-edit" style="cursor: pointer;float: right;margin-right:10px;" data-toggle="modal"'  +
                'data-target="#editComment" onclick="showComment(' + comment_id +')"></i>' +
              "</div>" +
              '<p id = "content_comment' + comment.id + '">' +
              comment.content +
              "</p>" +   
              "</div>" +
               
          "</li>";         
        post_comment.prepend(comment_HTML);
        comment_content.val("");
      },
      error: function (comment) {
        console.log(comment);
        alert("Fail to comment");
      },
    });
  }
};

//Show Comment need to edit
function showComment(id) {
  
  $('#commentEdit').val(id)
  let content = $("#content_comment" + id).text();
  $("#edit_comment").val(content);

};
function showDelComment(id) {

  $('#commentDelete').val(id);
};

//Edit Comment
function editComment() {

    let id = $("#commentEdit").val(); 
    //Get content of comment
    let content = $("#edit_comment");
    var comment = {
      id: id,
      comment: content.val(),
    };
    $.ajax({
      url: "/post/comment/" + id,
      method: "post",
      data: comment,
      success: function (comment) {
        let content_update = $("#content_comment" + id);
        content_update.text(content.val());
      },
      error: function (err) {
        console.log(err.responseJSON);
        alert(err.responseJSON.message);
      },
    });
 
};

//Delete Comment
function deleteComment() {

  let id = $("#commentDelete").val(); 
  var commentDelete = $('#commentLi' + id);
  var comment = {
    id: id,
  };
  $.ajax({
      url: "/post/comment/" + id,
      method: "DELETE",
      success: function(data){
        //Clear
        commentDelete.remove();
      },
      error: function (err) {
        console.log(err.responseJSON.message);
        alert(err.responseJSON.message);
      }
  });  
};

// Load more comment
function loadMoreComment(id) {
  $(".cm-loadMore").on("click", function (e) {
    console.log("loadMoreComment .cm-" + id);
    e.preventDefault();
    cm =document.getElementsByName("cm-" + id)
    console.log($(cm).length);
    console.log($(".cm-content:hidden"));

    
    $(".cm-content:hidden").slice(0, 3).slideDown();
    if ($(".cm-content:hidden").length == 0) {
      $(".cm-loadMore").text("No more comment").addClass("noContent");
    }
  });
};
$(document).ready(function () {
  $(".cm-content").slice(0, 3).show();
});
  

// Toggle between showing and hiding the sidebar, and add overlay effect
function w3_open() {
  // Get the Sidebar
  var mySidebar = document.getElementById("mySidebar");

  // Get the DIV with overlay effect
  var overlayBg = document.getElementById("myOverlay");
  if (mySidebar.style.display === "block") {
    mySidebar.style.display = "none";
    overlayBg.style.display = "none";
  } else {
    mySidebar.style.display = "block";
    overlayBg.style.display = "block";
  }
}
// Close the sidebar with the close button
function w3_close() {
  // Get the Sidebar
  var mySidebar = document.getElementById("mySidebar");

  // Get the DIV with overlay effect
  var overlayBg = document.getElementById("myOverlay");
  mySidebar.style.display = "none";
  overlayBg.style.display = "none";
}

jQuery(document).ready(function($) {
	
	"use strict";
	
//------- Notifications Dropdowns
  $('.top-area > .setting-area > li').on("click",function(){
	$(this).siblings().children('div').removeClass('active');
	$(this).children('div').addClass('active');
	return false;
  });
//------- remove class active on body
  $("body *").not('.top-area > .setting-area > li').on("click", function() {
	$(".top-area > .setting-area > li > div").removeClass('active');		
 });
	

//--- user setting dropdown on topbar	
$('.user-img').on('click', function() {
	$('.user-setting').toggleClass("active");
	return false;
});	
	
//--- side message box	
$('.friendz-list > li, .chat-users > li').on('click', function() {
	$('.chat-box').addClass("show");
	return false;
});	
	$('.close-mesage').on('click', function() {
		$('.chat-box').removeClass("show");
		return false;
	});	
	
//------ scrollbar plugin
	if ($.isFunction($.fn.perfectScrollbar)) {
		$('.dropdowns, .twiter-feed, .invition, .followers, .chatting-area, .peoples, #people-list, .chat-list > ul, .message-list, .chat-users, .left-menu').perfectScrollbar();
	}

/*--- socials menu scritp ---*/	
	$('.trigger').on("click", function() {
	    $(this).parent(".menu").toggleClass("active");
	  });
	
/*--- emojies show on text area ---*/	
	$('.add-smiles > span').on("click", function() {
	    $(this).parent().siblings(".smiles-bunch").toggleClass("active");
	  });

// delete notifications
$('.notification-box > ul li > i.del').on("click", function(){
    $(this).parent().slideUp();
	return false;
  }); 	

/*--- socials menu scritp ---*/	
	$('.f-page > figure i').on("click", function() {
	    $(".drop").toggleClass("active");
	  });

//===== Search Filter =====//
	(function ($) {
	// custom css expression for a case-insensitive contains()
	jQuery.expr[':'].Contains = function(a,i,m){
	  return (a.textContent || a.innerText || "").toUpperCase().indexOf(m[3].toUpperCase())>=0;
	};

	function listFilter(searchDir, list) { 
	  var form = $("<form>").attr({"class":"filterform","action":"#"}),
	  input = $("<input>").attr({"class":"filterinput","type":"text","placeholder":"Search Contacts..."});
	  $(form).append(input).appendTo(searchDir);

	  $(input)
	  .change( function () {
		var filter = $(this).val();
		if(filter) {
		  $(list).find("li:not(:Contains(" + filter + "))").slideUp();
		  $(list).find("li:Contains(" + filter + ")").slideDown();
		} else {
		  $(list).find("li").slideDown();
		}
		return false;
	  })
	  .keyup( function () {
		$(this).change();
	  });
	}

//search friends widget
	$(function () {
	  listFilter($("#searchDir"), $("#people-list"));
	});
	}(jQuery));	

//progress line for page loader
	$('body').show();
	NProgress.start();
	setTimeout(function() { NProgress.done(); $('.fade').removeClass('out'); }, 2000);
	
//--- bootstrap tooltip	
	$(function () {
	  $('[data-toggle="tooltip"]').tooltip();
	});
	
// Sticky Sidebar & header
	if($(window).width() < 769) {
		jQuery(".sidebar").children().removeClass("stick-widget");
	}

	if ($.isFunction($.fn.stick_in_parent)) {
		$('.stick-widget').stick_in_parent({
			parent: '#page-contents',
			offset_top: 60,
		});

		
		$('.stick').stick_in_parent({
		    parent: 'body',
            offset_top: 0,
		});
		
	}
	
/*--- topbar setting dropdown ---*/	
	$(".we-page-setting").on("click", function() {
	    $(".wesetting-dropdown").toggleClass("active");
	  });	
	  
/*--- topbar toogle setting dropdown ---*/	
$('#nightmode').on('change', function() {
    if ($(this).is(':checked')) {
        // Show popup window
        $(".theme-layout").addClass('black');	
    }
	else {
        $(".theme-layout").removeClass("black");
    }
});

//chosen select plugin
if ($.isFunction($.fn.chosen)) {
	$("select").chosen();
}

//----- add item plus minus button
if ($.isFunction($.fn.userincr)) {
	$(".manual-adjust").userincr({
		buttonlabels:{'dec':'-','inc':'+'},
	}).data({'min':0,'max':20,'step':1});
}	
	
if ($.isFunction($.fn.loadMoreResults)) {	
	$(".loadMore").loadMoreResults({
    displayedItems: 10,
    showItems: 10,
    button: {
      class: "btn-load-more",
      text: "Load More",
    },
  });	
}
	//===== owl carousel  =====//
	if ($.isFunction($.fn.owlCarousel)) {
		$('.sponsor-logo').owlCarousel({
			items: 6,
			loop: true,
			margin: 30,
			autoplay: true,
			autoplayTimeout: 1500,
			smartSpeed: 1000,
			autoplayHoverPause: true,
			nav: false,
			dots: false,
			responsiveClass:true,
				responsive:{
					0:{
						items:3,
					},
					600:{
						items:3,

					},
					1000:{
						items:6,
					}
				}

		});
	}
	
// slick carousel for detail page
	if ($.isFunction($.fn.slick)) {
	$('.slider-for-gold').slick({
		slidesToShow: 1,
		slidesToScroll: 1,
		arrows: false,
		slide: 'li',
		fade: false,
		asNavFor: '.slider-nav-gold'
	});
	
	$('.slider-nav-gold').slick({
		slidesToShow: 3,
		slidesToScroll: 1,
		asNavFor: '.slider-for-gold',
		dots: false,
		arrows: true,
		slide: 'li',
		vertical: true,
		centerMode: true,
		centerPadding: '0',
		focusOnSelect: true,
		responsive: [
		{
			breakpoint: 768,
			settings: {
				slidesToShow: 3,
				slidesToScroll: 1,
				infinite: true,
				vertical: false,
				centerMode: true,
				dots: false,
				arrows: false
			}
		},
		{
			breakpoint: 641,
			settings: {
				slidesToShow: 3,
				slidesToScroll: 1,
				infinite: true,
				vertical: true,
				centerMode: true,
				dots: false,
				arrows: false
			}
		},
		{
			breakpoint: 420,
			settings: {
				slidesToShow: 3,
				slidesToScroll: 1,
				infinite: true,
				vertical: false,
				centerMode: true,
				dots: false,
				arrows: false
			}
		}	
		]
	});
}
	
//---- responsive header
	
$(function() {

	//	create the menus
	$('#menu').mmenu();
	$('#shoppingbag').mmenu({
		navbar: {
			title: 'General Setting'
		},
		offCanvas: {
			position: 'right'
		}
	});

	//	fire the plugin
	$('.mh-head.first').mhead({
		scroll: {
			hide: 200
		}
		
	});
	$('.mh-head.second').mhead({
		scroll: false
	});

	
});		

//**** Slide Panel Toggle ***//
	  $("span.main-menu").on("click", function(){
	     $(".side-panel").addClass('active');
		  $(".theme-layout").addClass('active');
		  return false;
	  });

	  $('.theme-layout').on("click",function(){
		  $(this).removeClass('active');
	     $(".side-panel").removeClass('active');
		  
	     
	  });

	  
// login & register form
	$('button.signup').on("click", function(){
		$('.login-reg-bg').addClass('show');
		return false;
	  });
	  
	  $('.already-have').on("click", function(){
		$('.login-reg-bg').removeClass('show');
		return false;
	  });
	
//----- count down timer		
	if ($.isFunction($.fn.downCount)) {
		$('.countdown').downCount({
			date: '11/12/2018 12:00:00',
			offset: +10
		});
	}
	
// /** Post a Comment **/
// jQuery(".post-comt-box textarea").on("keydown", function(event) {

// 	if (event.keyCode == 13) {
// 		var comment = jQuery(this).val();
// 		var parent = jQuery(".showmore").parent("li");
// 		var comment_HTML = '	<li><div class="comet-avatar"><img src="images/resources/comet-1.jpg" alt=""></div><div class="we-comment"><div class="coment-head"><h5><a href="time-line.html" title="">Jason borne</a></h5><span>1 year ago</span><a class="we-reply" href="#" title="Reply"><i class="fa fa-reply"></i></a></div><p>'+comment+'</p></div></li>';
// 		$(comment_HTML).insertBefore(parent);
// 		jQuery(this).val('');
// 	}
// }); 
	
//inbox page 	
//***** Message Star *****//  
    $('.message-list > li > span.star-this').on("click", function(){
    	$(this).toggleClass('starred');
    });


//***** Message Important *****//
    $('.message-list > li > span.make-important').on("click", function(){
    	$(this).toggleClass('important-done');
    });

    

// Listen for click on toggle checkbox
	$('#select_all').on("click", function(event) {
	  if(this.checked) {
	      // Iterate each checkbox
	      $('input:checkbox.select-message').each(function() {
	          this.checked = true;
	      });
	  }
	  else {
	    $('input:checkbox.select-message').each(function() {
	          this.checked = false;
	      });
	  }
	});


	$(".delete-email").on("click",function(){
		$(".message-list .select-message").each(function(){
			  if(this.checked) {
			  	$(this).parent().slideUp();
			  }
		});
	});

// change background color on hover
	$('.category-box').hover(function () {
		$(this).addClass('selected');
		$(this).parent().siblings().children('.category-box').removeClass('selected');
	});
	
	
//------- offcanvas menu 

	const menu = document.querySelector('#toggle');  
	const menuItems = document.querySelector('#overlay');  
	const menuContainer = document.querySelector('.menu-container');  
	const menuIcon = document.querySelector('.canvas-menu i');  

	function toggleMenu(e) {
		menuItems.classList.toggle('open');
		menuContainer.classList.toggle('full-menu');
		menuIcon.classList.toggle('fa-bars');
		menuIcon.classList.add('fa-times');
		e.preventDefault();
	}

	if( menu ) {
		menu.addEventListener('click', toggleMenu, false);	
	}
	
// Responsive nav dropdowns
	$('.offcanvas-menu li.menu-item-has-children > a').on('click', function () {
		$(this).parent().siblings().children('ul').slideUp();
		$(this).parent().siblings().removeClass('active');
		$(this).parent().children('ul').slideToggle();
		$(this).parent().toggleClass('active');
		return false;
	});	
	


});//document ready end






