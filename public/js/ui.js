//UI
function handleWindowFocus() {
    $(window).focus(() => {
        if (unseenMessageCount) {
            $("li:not(.not-seen)").addClass('seen-on-focus');
            $(".not-seen").removeClass('not-seen');
            setTimeout(() => {
                $("li:not(.not-seen)").removeClass('seen-on-focus');
            }, 7000);
            socket.emit('i am active');
        }

        isWindowFocused = true;
        unseenMessageCount = 0;

        $('#favicon').attr('href', 'img/logo_' + userColor.slice(1) + '.png');

        if (userRoom.toLowerCase().trim() != 'start')
            $('title').html('#' + userRoom + ' - Conversează. Online! | www.conversatie.online');
        else
            $('title').html('Conversează. Online! - www.conversatie.online');
        $('#inputMessage').focus();
    });
    $(window).blur(() => {
        isWindowFocused = false;
    });
    $("#inputMessage").keydown(e => {
        var message = $("#inputMessage").val();
        if (e.keyCode == 13 && !e.shiftKey) {
            sendMessage(message);
            return false;
        }
    });
    $("#inputMessage").on('propertychange change click keyup input paste', e => {
        var message = $("#inputMessage").val();
        if ($("#inputMessage").val().trim().length)
            $('#inputSend').removeClass('opaque');
        else
            $('#inputSend').addClass('opaque');
    });
}

function scrollToBottom() {
    setTimeout(() => {
        $(".messages")[0].scrollTop = $(".messages")[0].scrollHeight;
        $("#scrollToBottom").fadeOut();
    }, 100);
}

function fixScroll(isChatMessage) {
    var distanceFromBottom = $(".messages")[0].scrollHeight - ($(".messages")[0].clientHeight + $(".messages")[0].scrollTop);

    if (distanceFromBottom > 250 && isChatMessage) {
        $("#scrollToBottom").fadeIn();
    } else {
        if (distanceFromBottom > 250)
            return;
        $("#scrollToBottom").fadeOut();
        setTimeout(() => {
            $(".messages")[0].scrollTop = $(".messages")[0].scrollHeight;
        }, 100);
    }
}

function fixKeyboardOpen() {
    $(".messages").on('scroll', () => {
        setTimeout(() => {
            var distanceFromBottom = $(".messages")[0].scrollHeight - ($(".messages")[0].clientHeight + $(".messages")[0].scrollTop);
            if (distanceFromBottom < 250)
                $("#scrollToBottom").fadeOut();
        }, 0);
    });
    $(window).on('resize', fixScroll);
}

function handleBeforeUnload() {
    window.onbeforeunload = () => {
        return "I am a message";
    };
}

function handleHashChange() {
    $(window).on('hashchange', () => {
        window.location.reload();
    });
}


function fileToBase64(myFile) {
    return new Promise((resolve, reject) => {
        var coolFile = {};

        function readerOnload(e) {
            var base64 = btoa(e.target.result);
            coolFile.base64 = base64;
            resolve(coolFile);
        };

        var reader = new FileReader();
        reader.onload = readerOnload;

        var file = myFile[0].files[0];
        coolFile.filetype = file.type;
        coolFile.size = file.size;
        coolFile.filename = file.name;
        reader.readAsBinaryString(file);
    });
}

function handleImagePaste() {
    $(".progress").on('animationend webkitanimationend', () => {
        $(".progress").removeClass('progressing');
        $(".progress").css('opacity', '0');
    });

    document.onpaste = function (event) {
        var items = (event.clipboardData || event.originalEvent.clipboardData).items;
        for (index in items) {
            var item = items[index];
            if (item.kind === 'file') {
                $(".progress").css('background-color', userColor);
                $(".progress").css('opacity', '1');
                $(".progress").addClass('progressing');

                var blob = item.getAsFile();
                var reader = new FileReader();
                socket.emit('i am writing');
                reader.onload = (event) => {
                    var imageDataUrl = event.target.result;
                    sendMessage(imageDataUrl);
                };
                reader.readAsDataURL(blob);
            }
        }
    }
}

function copyLink() {
    let α = document.createRange(),
        ρ = window.getSelection();
    α.selectNodeContents($(`#pageLink`)[0]);
    ρ.removeAllRanges();
    ρ.addRange(α);
    document.execCommand('copy');
}

function setupShareMethod() {
    if (navigator.share) {
        $(".share-enabled").show();
    } else {
        $(".share-disabled").show();
    }
}

function isMobileDevice() {
    if (/Mobi/.test(navigator.userAgent)) {
        return true;
    }
}

function greetDevs() {
    console.log(`Hello! Thank you for using conversatie.online! In case you didn't know, this is the developer console!
    Glad to see people are interested in hacking / learning from this application.
    I suggest you visit its github page (https://github.com/iuliuvisovan/conversatie.online). If you would like to see new features, fix buggy
    existing ones, or really just straight out hate existing ones, I suggest you fork the shit out of the repo, clone it, make your changes, and then submit a pull request.
    And who knows, it may even be YOU (amongsts thousands, maybe millions of others) who is declared the winner and receives a review and a merge. 
    Hugs! 🤗`);
}