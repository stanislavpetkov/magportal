var stb = null;

var stbEvent =
    {
        onEvent: function (event, info) {
            document.body.innerText += "event " + event + ", info " + info + "<p>";
        },
        onMessage: function (windowId, message, data) {
            document.body.innerText += "messaage " + message;
        },
        onBroadcastMessage: function (windowId, message, data) {
            document.body.innerText += "BCmessaage " + message;
        },
        onWebBrowserProgress: function (progress, status) {
            document.body.innerText += "Browser";
        },
        onWindowActivated: function () {
            document.body.innerText += "WindowActivated";
        },
        onMediaAvailable: function (mime, link) {
            document.body.innerText += "onMediaAvailable ";
        },
        event: 0
    };


function runPlayer(ndx, url)
{
    var otherplayer = stbPlayerManager.list[1-ndx];
    otherplayer.stop();


    var player = stbPlayerManager.list[ndx];
player.surface = stbSurfaceManager.list[2+ndx];
player.volume = 100;

    document.body.innerHTML += "Player "+ndx+ " caps "+ JSON.stringify( player.capabilities)+"<p> sfc "+player.surface+"<p><p><p>";


        player.onPlayError = function () {
        document.body.innerHTML += " Player Error";
    };

    player.onPlayStart = function () {
        document.body.innerHTML += " Player PlayStart";
    };

    player.onPlayStart = function () {
        document.body.innerHTML += " Player PlayStart";
    };

    player.onContentInfo = function(){
        document.body.innerHTML += " Content Info";
    };
    player.aspectConversion = 4;
    player.videoWindowMode = 0;
    player.setViewport({x: 800 * ndx, y: 500, width: 800, height: 600});

    player.play({
        uri: url,
        solution: 'auto'
    });


}

function keyDownEventHandler(event) {
    const keyCode = event.keyCode;

    if (keyCode === 116) //Bottom line rightmost key something like loop
    {

        window.location.reload(true);
        return;
    }

    if (keyCode === 9) //play pause key
    {
        var p0 = stbPlayerManager.list[0];
        var p1 = stbPlayerManager.list[1];
        stbPlayerManager.swap(p0,p1);
    }

    if (keyCode === 82) //play pause key
    {
       runPlayer(0, "http://devimages.apple.com/iphone/samples/bipbop/bipbopall.m3u8");
       return;

    }

    if (keyCode === 83)
    {
        runPlayer(1, "http://qthttp.apple.com.edgesuite.net/1010qwoeiuryfg/sl.m3u8");
        return;

    }

    document.body.innerHTML += "<p>Key Down Code: " + keyCode;
}

function bootUp() {
    if (typeof gSTB !== 'undefined') {
        stb = gSTB;
    }


    if (stb === null) {
        document.body.style.backgroundColor = "#000000";
        document.body.style.color = "#FFFFFF";
        document.body.innerHTML = "Unsupported device. No gSTB";
        //We have to put the hls.js code here
    }
    else {
        document.body.style.backgroundColor = "#AAAAFF";
        document.body.style.color = "#000000";
        document.body.innerHTML = "Supported device Model: " + stb.GetDeviceModel();
        document.addEventListener("keydown", keyDownEventHandler);
        stb.DeinitPlayer();
        stb.InitPlayer();
    }


}



