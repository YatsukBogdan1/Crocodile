const socket = io();
let me_painter = false;
let current_color = '#000';
let current_size = 3;

function submitfunction(){
  var from = $('#user').val();
  var message = $('#m').val();
  if(message != '' && !me_painter) {
    socket.emit('chatMessage', from, message);
  }
  $('#m').val('').focus();
  return false;
}

function resize_canvas(){
    canvas = document.getElementById("board");
    canvas.width  = window.innerWidth*0.6;
    canvas.height = window.innerHeight*0.7;
}


function notifyTyping() {
  var user = $('#user').val();
  socket.emit('notifyUser', user);
}
function enterRoom(){
  var user = $('#user').val();
  socket.emit('enterRoom', user);
}

socket.on('chatMessage', function(from, msg){
  var me = $('#user').val();
  var color = (from == me) ? 'green' : '#009afd';
  var from = (from == me) ? 'Me' : from;
  $('#messages').append('<li><b style="color:' + color + '">' + from + '</b>: ' + msg + '</li>');
});

function getWord(){
    socket.emit('getWord');
}

function sendClearToAll(){
    var me = $('#user').val();
    clearCanvas();
    socket.emit('clearCanvas', me);
}

function clearCanvas(){
    var ctx = document.getElementById("board").getContext("2d");
    ctx.clearRect(0, 0, canvas.width, canvas.height);
}

socket.on('clearCanvas', function(user){
    clearCanvas();
});

socket.on('painterChoosed', function(user){
    $('#messages').empty();
    $('#messages').append('<li><b style="color:red">'+ "Painter" + '</b>: ' + user + '</li>');
    var canvas = document.getElementById("board");
    var ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    var me = $('#user').val();
    if (user == me) {
        me_painter = true;
    }
    else me_painter = false;
    getWord();
});

socket.on('notifyUser', function(user){
  var me = $('#user').val();
  if(user != me) {
    $('#notifyUser').text(user + ' is typing ...');
  }
  setTimeout(function(){ $('#notifyUser').text(''); }, 10000);
});

socket.on('getWord', function(word){
    if (me_painter)
        $('#messages').append('<li><b style="color:red">' + "Your word" + '</b>: ' + word + '</li>');
});

socket.on('showImage', function(from, action){
  var me = $('#user').val();
  if(from != me) {
      paint(action.x, action.y, action.type, action.color, action.size);
  }
});

var paint_flag;

document.onmousedown = function(e){
    if (me_painter){
        var parentOffset = $("#board").parent().offset();
        //or $(this).offset(); if you really just want the current element's offset
        var x = e.pageX - 20;
        var y = e.pageY - 20;
        paint(x,y,"start", current_color);
        var me = $('#user').val();
        socket.emit("showImage",me, {x:x,y:y,type:"start", color:current_color});
        paint_flag = true;
    }
};

document.onmousemove = function(e){
    if (paint_flag && me_painter){
        var parentOffset = $("#board").parent().offset();
        //or $(this).offset(); if you really just want the current element's offset
        var x = e.pageX - 20;
        var y = e.pageY - 20;
        paint(x,y,"draw",current_color);
        var me = $('#user').val();
        socket.emit("showImage",me, {x:x,y:y,type:"draw", color:current_color});
    }
};

document.onmouseup = function(e){
    if (me_painter) {
        var parentOffset = $("#board").parent().offset();
        //or $(this).offset(); if you really just want the current element's offset
        var x = e.pageX - 20;
        var y = e.pageY - 20;
        paint(x, y, "end",current_color, current_size);
        var me = $('#user').val();
        socket.emit("showImage", me, {x: x, y: y, type: "end", color:current_color, size:current_size});
        paint_flag = false;
    }
};

function paint(x,y,type, color, size){
    var ctx = document.getElementById("board").getContext("2d");
    ctx.fillStyle = "solid";
    ctx.strokeStyle = color;
    ctx.lineCap = "round";
    ctx.lineWidth = size;
    if (type == "start"){
        ctx.beginPath();
        ctx.moveTo(x,y);
    }
    else if (type == "draw"){
        ctx.lineTo(x,y);
        ctx.stroke();
    }
    else if (type == "end")
        ctx.closePath();
};

function changeColor(color){
    current_color = color;
}

function changeBrushSize(size){
    current_size = size;
}

changeColor('#000');
changeBrushSize(3);

$(document).ready(function(){
  resize_canvas();
});

function makeid() {
    var user = document.getElementById("username").value;

    socket.emit('chatMessage', 'System', '<b>' + user + '</b> has joined the discussion');
    document.getElementById("user").value = user;
    $("#login_container").hide();
    enterRoom();
}