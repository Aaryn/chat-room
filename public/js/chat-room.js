$(document).ready(function(e) {
  $(window).keydown(function(e){
    if(e.keyCode == 116)
    {
      if(!confirm("Refresh？"))
      {
        e.preventDefault();
      }
    }
  });
  var from = $.cookie('user');
  var to = 'all';
  $("#input_content").html("");
  if (/Firefox\/\s/.test(navigator.userAgent)){
    var socket = io.connect({transports:['xhr-polling']});
  }
  else if (/MSIE (\d+.\d+);/.test(navigator.userAgent)){
    var socket = io.connect({transports:['jsonp-polling']});
  }
  else {
    var socket = io.connect();
  }
  socket.emit('online',JSON.stringify({user:from}));
  socket.on('disconnect',function(){
    var message = '<div style="color:#f00">SYSTEM:Cannot connect to the server</div>';
    addMessage(message);
    $("#list").empty();
  });
  socket.on('reconnect',function(){
    socket.emit('online',JSON.stringify({user:from}));
    var message = '<div style="color:#f00">SYSTEM:Try to connect to the server again</div>';
    addMessage(message);
  });
  socket.on('system',function(data){
    var data = JSON.parse(data);
    var time = getTimeShow(data.time);
    var message = '';
    if(data.type =='online')
    {
      message += 'User ' + data.message +' is Online！';
    } else if(data.type =='offline')
    {
      message += 'User ' + data.message +' left！';
    } else if(data.type == 'in')
    {
      message += 'You enter the chat room！';
    } else
    {
      message += 'Unknown message！';
    }
    var message = '<div style="color:#f00">SYSTEM('+time+'):'+message+'</div>';
    addMessage(message);
  })
  socket.on('userflush',function(data){
    var data = JSON.parse(data);
    var users = data.users;
    flushUsers(users);
  });
  socket.on('newMessage',function(messageData){
    var time = messageData.time;
    time = getTimeShow(time);
    var data = messageData.data;
    if (data.to=='all') {
      addMessage('<div>'+data.from+'('+time+')：<br/>'+data.message+'</div>');
    } else if(data.from == from) {
      addMessage('<div>I('+time+')talk to '+data.to+'：<br/>'+data.message+'</div>');
    } else if(data.to == from)
    {
      addMessage('<div>'+data.from+'('+time+')(private)：<br/>'+data.message+'</div>');
    }
  });

  function addMessage(message){
    $("#contents").append(message);
    $("#contents").append("<br/>");
    $("#contents").scrollTop($("#contents")[0].scrollHeight);
  }
  function flushUsers(users)
  {
    var ulEle = $("#list");
    ulEle.empty();
    ulEle.append('<li title="Private talk" alt="all" onselectstart="return false">ALL</li>');
    for(var i = 0; i < users.length; i ++)
    {
      ulEle.append('<li alt="'+users[i]+'" title="Private talk" onselectstart="return false">'+users[i]+'</li>')
    }
    //double click to start private talk
    $("#list > li").dblclick(function(e){
      if($(this).attr('alt') != from)
      {
        to = $(this).attr('alt');
        displayPrivateTalk();
      }
    });
    displayPrivateTalk();
  }
  $("#input_content").keydown(function(e) {
    if(e.shiftKey && e.which==13){
      $("#input_content").append("<br/>");
    } else if(e.which == 13)
    {
      e.preventDefault();
      say();
    }
  });
  $("#say").click(function(e){
    say();
  });
  function say()
  {
    if ($("#input_content").html() == "") {
      return;
    }
    socket.emit('newMessage',JSON.stringify({to:to,from:from,message:$("#input_content").html()}));
    $("#input_content").html("");
    $("#input_content").focus();
  }

  function displayPrivateTalk()
  {
    $("#from").html(from);
    $("#to").html(to=="all" ? "ALL" : to);
    var users = $("#list > li");
    for(var i = 0; i < users.length; i ++)
    {
      if($(users[i]).attr('alt')==to)
      {
        $(users[i]).addClass('sayingto');
      }
      else
      {
        $(users[i]).removeClass('sayingto');
      }
    }
  }

  function getTimeShow(time)
  {
    var dt = new Date(time);
    time = dt.getFullYear() + '-' + (dt.getMonth()+1) + '-' + dt.getDate() + ' '+dt.getHours() + ':' + (dt.getMinutes()<10?('0'+ dt.getMinutes()):dt.getMinutes()) + ":" + (dt.getSeconds()<10 ? ('0' + dt.getSeconds()) : dt.getSeconds());
    return time;
  }
  $.cookie('isLogin',true);
});
