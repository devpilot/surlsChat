function init(toggle, msg) {
    $('#msgBox, #msgSend').attr("disabled", toggle);
    $('#messages').append(msg);
    autoScroll();
}
function autoScroll(){
    // set scroll to buttom
    var scrollHeight = document.getElementById('messages').scrollHeight; //get chat window
    $('#messages').scrollTop(scrollHeight);
}
;
$(document).ready(function() {
    //init(true, 'Please wait connecting...');
    var socket = io.connect('http://192.168.0.100:4000', {'sync disconnect on unload': true});

    // listen to user count
    socket.on('userCount', function(count) {
        $('#userCount').text(count + ' Users Online');
    });

    // listen to incomeing message
    socket.on('serverMessage', function(msg) {
        $('#messages').append('<p>' + msg + '</p>');
        autoScroll();
    });

    // listen to typing
    socket.on('typing', function() {
        $('#messages').append('<p class="typMsg">User is typing...</p>').stop(false, true).fadeIn(800);
        autoScroll();
        $('.typMsg').stop(false, true).fadeOut(1000,function(){$(this).remove();});
    });

    /********** Send message *********/
    $('#msgBox').keydown(function(e) {
        //27 ESC
        if (e.keyCode === 13) {
            setMessage();
            e.preventDefault();
        } else {
            socket.emit('typing');
        }
    });
    $('#msgSend').click(function() {
        setMessage();
    });

    function setMessage() {
        var msg = $.trim($('#msgBox').val());
        if (msg != "") {
            socket.emit('clientMessage', msg);
            $('#msgBox').val('');
        }
    }
    /********** Send message end *********/

    var connectBtnflag = 3;
    // listen to system command
    socket.on('syscmd', function(cmd) {
        switch (cmd) {
            case 'connected':
                $('#messages').html('');
                $('#msgBox').val('');
                init(false, '<p class="sysmsg">You\'re now connected with a random chat partner...<br/>Say Hello!</p>');
                $('#connectBtn > p').text("Disconnect");
                connectBtnflag = 0;
                break;
            case 'connecting':
                $('#messages').html('');
                init(true, '<p class="sysmsg">Plsease wait...<br/>Connecting to random chat partner...</p>');
                break;
            case 'end':
                init(true, '<p class="sysmsg">You\'re disconnected.<br/><button>Chat with new stranger</button> or go to <a href="#">More Chat Rooms</a></p>');
                $('#connectBtn > p').text("New");
                connectBtnflag = 2;
                break;
        }
        ;
    });

    $('#connectBtn').click(function() {
        switch (connectBtnflag) {
            case 0:
                $('#connectBtn > p').text("Really?");
                connectBtnflag = 1;
                break;
            case 1:
                connectBtnflag = 3; //prevent extra click
                socket.emit('syscmd', 'end');
                break;
            case 2:
                connectBtnflag = 3; //prevent extra click
                socket.emit('syscmd', 'new');
                break;
        }
    });
    $(document).keydown(function(e) {
        if (e.keyCode === 27) {
            switch (connectBtnflag) {
                case 0:
                    $('#connectBtn > p').text("Really?");
                    connectBtnflag = 1;
                    break;
                case 1:
                    connectBtnflag = 3; //prevent extra click
                    socket.emit('syscmd', 'end');
                    break;
                case 2:
                    connectBtnflag = 3; //prevent extra click
                    socket.emit('syscmd', 'new');
                    break;
            }
            e.preventDefault();
        }
    });

    $(window).focusout(function() {
        console.log("lost focus");
    });
    $(window).focusin(function() {
        console.log("In focus");
    });
});