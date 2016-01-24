var express = require('express');
var app = require('express')();
var http = require('http').createServer(app);
var io = require('socket.io')(http);
var path = require('path');

var clients = [];
var users = [];

io.on('connection', function(socket){
  socket.on('online', function(data){
    var data = JSON.parse(data);
    //new user
    if(!clients[data.user]){
      users.unshift(data.user);
      for(var index in clients)
      {
        clients[index].emit('system',JSON.stringify({type:'online',message:data.user,time:(new Date()).getTime()}));
        clients[index].emit('userflush',JSON.stringify({users:users}));
      }
      socket.emit('system',JSON.stringify({type:'in',message:'',time:(new Date()).getTime()}));
      socket.emit('userflush',JSON.stringify({users:users}));
    }

    //exist user
    clients[data.user] = socket;
    socket.emit('userflush',JSON.stringify({users:users}));
  })
  socket.on('newMessage', function(data){
    data = JSON.parse(data);
    var message = {
      time: (new Date()).getTime(),
      data: data
    }
    if(data.to == 'all'){
      for(var index in clients)
      {
        clients[index].emit('newMessage',message);
      }
    }else{
      clients[data.to].emit('newMessage',message);
      clients[data.from].emit('newMessage',message);
    }
  })
  socket.on('offline', function(data){
    socket.disconnect();
  })
  socket.on('disconnect', function(data){
    setTimeout(userOffline,5000);
    function userOffline()
    {
      for(var index in clients)
      {
        if(clients[index] == socket)
        {
          users.splice(users.indexOf(index),1);
          delete clients[index];
          for(var index_inline in clients)
          {
            clients[index_inline].emit('system',JSON.stringify({type:'offline',message:index,time:(new Date()).getTime()}));
            clients[index_inline].emit('userflush',JSON.stringify({users:users}));
          }
          break;
        }
      }
    }
  })
})

app.configure(function(){
  app.set('port', process.env.PORT || 5005);
  app.set('views', __dirname + '/views');
  app.set('view engine', 'jade');
  app.use(express.favicon());
  app.use(express.logger('dev'));
  app.use(express.bodyParser());
  app.use(express.cookieParser());
  app.use(express.methodOverride());
  app.use(app.router);
  app.use(express.static(path.join(__dirname, 'public')));
});

app.configure('development', function(){
  app.use(express.errorHandler());
});

app.get('/', function (req, res, next) {
  if(!req.headers.cookie)
  {
    res.redirect('/login');
    return;
  }
  var cookies = req.headers.cookie.split("; ");
  var isSign = false;
  for(var i = 0 ; i < cookies.length; i ++)
  {
    var cookie = cookies[i].split("=");
    if(cookie[0]=="user" && cookie[1] != "")
    {
      isSign = true;
      break;
    }
  }
  if(!isSign)
  {
    res.redirect('/login');
    return;
  }
  res.sendfile('views/index.html');
});
app.get('/login',function(req,res,next){
  res.sendfile('views/login.html');
});
app.get('/register',function(req,res,next){
  res.sendfile('views/register.html');
});
app.post('/login',function(req,res,next){
  res.cookie("user",req.body.username[0]);
  res.redirect('/');
});
http.listen(app.get('port'), function(){
  console.log("Express server listening on port " + app.get('port'));
});