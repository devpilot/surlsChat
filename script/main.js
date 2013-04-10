function init(toggle, msg) {
    $('#msgBox, #msgSend, #smileyToggle').attr("disabled", toggle);
    $('#messages').append(msg);
    autoScroll();
}
function connBtnManage(flag, socket){
    switch (flag){
        case 0:
            $('#connectBtn > p').text("Really?");
            flag = 1;
            break;
        case 1:
            flag = 3; //prevent extra click
            socket.emit('syscmd','end');
            break;
         case 2:
            flag = 3; //prevent extra click
            socket.emit('syscmd','new');
            break;
    }
    return flag;
}
function autoScroll(){
    // set scroll to buttom
    var scrollHeight = document.getElementById('messages').scrollHeight; //get chat window
    $('#messages').scrollTop(scrollHeight);
};

// append messages to chat window
function appendMsg(msg){
    $('.typStat').remove();
    $('#messages').append('<p class="msg-item">' + msg + '</p><div class="typStat"></div>');
    autoScroll();
};

var connectBtnflag = 3;
var socket = io.connect('http://192.168.0.100:4000', {'sync disconnect on unload': true});

$(document).ready(function() {
    // Enter chat first time
    $('#chatbutton').click(function(e){
        e.preventDefault();
        $('#intro').hide();
            connectBtnflag = connBtnManage(2,socket);
            $('#main-wrap').show();
    });
    // listen to user count
    socket.on('userCount', function(count) {
        $('#userCount').text(count + ' Users Online');
    });

    // listen to incomeing message
    socket.on('serverMessage', function(msg) {
        convertSmiley(msg,function(msg){
            appendMsg(msg);
            playSound();
        })
    });

    // listen to typing
    socket.on('typing', function() {
        $('.typStat').append('<p class="typMsg">Stranger is typing...</p>').stop(false, true).fadeIn(600);
        //autoScroll();
        $('.typMsg').stop(false, true).fadeOut(600,function(){$(this).remove();});
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
            appendMsg('<span class="you">*&#9829;*&#9829;**Me**&#9829;*&#9829;*</span> '+msg)
            socket.emit('clientMessage', msg);
            $('#msgBox').val('');
        }
    }
    /********** Send message end *********/

    // listen to system command
    socket.on('syscmd', function(cmd) {
        switch (cmd) {
            case 'connected':
                $('#messages').html('');
                $('#msgBox').val('');
                init(false, '<p class="sysmsg">You\'re now connected with a random chat partner...</p><p class="sysmsg">Say Hello!</p><div class="typStat"></div>');
                $('#connectBtn > p').text("Disconnect");
                connectBtnflag = 0;
                break;
            case 'connecting':
                $('#messages').html('');
                init(true, '<p class="sysmsg">Plsease wait...</p><p class="sysmsg">Connecting to random chat partner...</p>');
                break;
            case 'end':
                init(true, '<p class="sysmsg">You\'re disconnected.</p><p class="sysmsg"><button id="newChatBtn">Chat with new stranger</button> or go to <a href="#">More Chat Rooms</a></p>');
                $('#connectBtn > p').text("New");
                connectBtnflag = 2;
                break;
        }
        ;
    });

    $('#connectBtn').click(function() {
        connectBtnflag = connBtnManage(connectBtnflag,socket);
    });
    $(document).keydown(function(e) {
        if (e.keyCode === 27) {
            connectBtnflag = connBtnManage(connectBtnflag,socket);
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
// new chat button on chat window
$(document).on('click','#newChatBtn',function(){
    connectBtnflag = connBtnManage(connectBtnflag,socket);
});

/*---------------------------------- Smiley -------------------------------------------*/
(function($) {
    $.fn.getCursorPosition = function() {
        var input = this.get(0);
        if (!input) return; // No (input) element found
        if ('selectionStart' in input) {
            // Standard-compliant browsers
            return input.selectionStart;
        } else if (document.selection) {
            // IE
            input.focus();
            var sel = document.selection.createRange();
            var selLen = document.selection.createRange().text.length;
            sel.moveStart('character', -input.value.length);
            return sel.text.length - selLen;
        }
    }
    $.fn.setCursorPosition = function(position){
        var input = this.get(0);
        if (!input) return; // No (input) element found
        if ('selectionStart' in input) {
            // Standard-compliant browsers
            input.selectionStart = position;
            input.selectionEnd = position;
        } else if (document.selection) {
            // IE
            // Need to fix older IE crap
        }
    }
})(jQuery);

$(document).ready(function(){
    var pos;
    $(".sm_icon").click(function(e){
        //var sym = $(this).html(); //get smiley text
        var sym = $(this).attr("alt")
        pos = $("#msgBox").getCursorPosition();
        $("#msgBox").val(addSymbol($("#msgBox").val(),pos,sym));
        $("#msgBox").focus().setCursorPosition(pos + sym.length +2); // Set smiley offset
        $(".icons").hide();
        e.preventDefault();
    })
    $("#smileyToggle").click(function(e){
        if($(".icons").is(":visible"))
            $(".icons").hide();
        else
            $(".icons").show();
        e.stopPropagation();
    })

    $(document).click(function(){
        $(".icons").hide();
    });
});

// Insetr smiley
function addSymbol(str,pos,sym){
    sp = new Array;
    sp[0] = str.substring(0,pos);
    sp[1] = ltrim(str.substring(pos,str.length));
    return sp[0]+' '+ sym +' '+ sp[1];
}

// trim left whitespace
function ltrim(s){
    var l=0;
    while(l < s.length && s[l] == ''){
        l++;
    }
    return s.substring(l, s.length);
}

// Replace smiley symbol with image on sent messages
function convertSmiley(msg, fn){
    msg =   msg.split('::laugh').join("<img src='images/icons/laughing.gif' /> ");
    msg =   msg.split('::angry').join("<img src='images/icons/angry.gif' /> ");
    msg =   msg.split('::blush').join("<img src='images/icons/blush.gif' /> ");
    msg =   msg.split('::clap').join("<img src='images/icons/clap.gif' /> ");
    msg =   msg.split('::haha').join("<img src='images/icons/haha.gif' /> ");
    msg =   msg.split('::cool').join("<img src='images/icons/cool.gif' /> ");
    msg =   msg.split('::kiss').join("<img src='images/icons/kiss.gif' /> ");
    msg =   msg.split('::yawn').join("<img src='images/icons/yawn.gif' /> ");
    msg =   msg.split('::loser').join("<img src='images/icons/loser.gif' /> ");
    msg =   msg.split('::heart').join("<img src='images/icons/heart.gif' /> ");
    msg =   msg.split('::oh').join("<img src='images/icons/oh.gif' /> ");
    msg =   msg.split('::boo').join("<img src='images/icons/party.gif' /> ");
    msg =   msg.split('::oon').join("<img src='images/icons/oon.gif' /> ");
    msg =   msg.split('::roll').join("<img src='images/icons/roll.gif' /> ");
    msg =   msg.split(':(').join("<img src='images/icons/sad.gif' /> ");
    msg =   msg.split('::sleepy').join("<img src='images/icons/sleepy.gif' /> ");
    msg =   msg.split('::snatch').join("<img src='images/icons/snatch.gif' /> ");
    msg =   msg.split('::what').join("<img src='images/icons/surprise.gif' /> ");
    msg =   msg.split('::stop').join("<img src='images/icons/stop.gif' /> ");
    msg =   msg.split('::thinking').join("<img src='images/icons/thinking.gif' /> ");
    msg =   msg.split('::timeout').join("<img src='images/icons/timeout.gif' /> ");
    msg =   msg.split(':p').join("<img src='images/icons/tongue.gif' /> ");
    msg =   msg.split('::waiting').join("<img src='images/icons/waiting.gif' /> ");
    msg =   msg.split('::bye').join("<img src='images/icons/bye.gif' /> ");
    msg =   msg.split('::whew').join("<img src='images/icons/whew.gif' /> ");
    msg =   msg.split('::wink').join("<img src='images/icons/winking.gif' /> ");
    msg =   msg.split('::worry').join("<img src='images/icons/worried.gif' /> ");
    msg =   msg.split('::silly').join("<img src='images/icons/silly.gif' /> ");
    msg =   msg.split('::sick').join("<img src='images/icons/sick.gif' /> ");
    msg =   msg.split(':)').join("<img src='images/icons/happy.gif' /> ");
    msg =   msg.split('::yeah').join("<img src='images/icons/yeah.gif' /> ");
    msg =   msg.split('::broken').join("<img src='images/icons/broken.gif' /> ");
    msg =   msg.split('::confuse').join("<img src='images/icons/confuse.gif' /> ");
    msg =   msg.split('::crying').join("<img src='images/icons/crying.gif' /> ");
    msg =   msg.split('::devil').join("<img src='images/icons/devil.gif' /> ");
    msg =   msg.split('::dayd').join("<img src='images/icons/dayd.gif' /> ");
    msg =   msg.split('::drooling').join("<img src='images/icons/drooling.gif' /> ");
    msg =   msg.split('::eyebrow').join("<img src='images/icons/eyebrow.gif' /> ");
    msg =   msg.split('::duntel').join("<img src='images/icons/duntel.gif' /> ");
    msg =   msg.split('::scared').join("<img src='images/icons/scared.gif' /> ");
    msg =   msg.split('::notalk').join("<img src='images/icons/notalk.gif' /> ");
    msg =   msg.split('::bful').join("<img src='images/icons/bful.gif' /> ");
    msg =   msg.split('::hello').join("<img src='images/icons/hello.gif' /> ");
    msg =   msg.split('::hugs').join("<img src='images/icons/hugs.gif' /> ");
    msg =   msg.split('::iloveu').join("<img src='images/icons/iloveu.gif' /> ");
    msg =   msg.split('::imsorry').join("<img src='images/icons/imsorry.gif' /> ");
    msg =   msg.split('::salam').join("<img src='images/icons/salam.gif' /> ");
    msg =   msg.split('::thanks').join("<img src='images/icons/thanks.gif' /> ");
    msg =   msg.split('::thanku').join("<img src='images/icons/thanku.gif' /> ");

fn(msg);
}

/*-------------------------- Sound --------------------------*/
function playSound(){
    var sound = document.getElementById('alt-sound');
    console.info(sound);
    sound.play();
}