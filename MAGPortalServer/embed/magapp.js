//ECMA 262 5 - do not support let and const

var playerNo = 0;
var stb = null;
var lastStreamsAsString = null;
var deviceInfo = null;
var intervalObject = null;
var playerPosition = -1.0;
var interval = null;

    function getPlayer() {
    return stbPlayerManager.list[playerNo];
}


function LogMessage(message) {
    var now = new Date().toUTCString();
    var logging = document.getElementById("logging");
    if ((typeof logging === 'undefined') || logging === null) {
        //document.body.innerHTML += now + "\t" + message + "\n";
        return;
    }
    logging.innerText += now + "\t" + message + "\n";
}

function clearlog() {
    document.getElementById("logging").innerText = "";
    LogMessage("Log cleared");
}

function RestartStream() {
    LogMessage("Stream Restart");
    clearInterval(interval );
    clearTimeout(intervalObject);
    lastStreamsAsString = null;
    getPlayer().stop();
    GetRequest("http://10.10.10.198:13001/streams?device=" + btoa(JSON.stringify(deviceInfo)), "GET", newStreamUrlHandler);
}

function getStateString(state)
{
switch (state) {
    case 0:	return "idle";
    case 1:	return "opening (between stbPlayer.play method call and event 4)";
    case 2:	return "currently is playing";
    case 3:	return "paused";
    default:
        return "unknown";
}


}

function CheckPosition()
{
    var pos = getPlayer().positionMs/1000;
    var state = getPlayer().state;
    if (playerPosition !== pos)
    {
        document.getElementById("time").innerText = "Time: "+pos.toFixed(3)+"   State: "+getStateString( state);
        playerPosition = pos;
        return;
    }

    LogMessage("Detected Frozen Player");
    RestartStream();
}


function runPlayer(url) {

    var player = getPlayer();

    LogMessage("Run Player - " + url);
    player.stop();
    player.volume = 100;
    var output = stbAudioManager.list[0];
    output.add(player);


    player.onPlayEnd = function () //event1
    {
        LogMessage("Player PlayEnd");
        RestartStream();

    };

    // player.onTracksInfo = function () //event2
    // {
    //     LogMessage("Player onTracksInfo");
    // };
    //
    // player.onContentInfo = function () //event7
    // {
    //     LogMessage("Content Info");
    // };


    player.onPlayStart = function () //event4
    {
        LogMessage("Player Start");
        interval = setInterval(CheckPosition, 500);
        //getPlayer().fullscreen = true;
    };

    player.onPlayError = function () //event 5
    {
        LogMessage("Player Error");
        RestartStream();
    };

    player.onTracksError = function () //event8
    {
        LogMessage("Player onTracksError");
        RestartStream();
    };

    // player.onDualMono = function () //event6
    // {
    //     LogMessage("Player onDualMono");
    // };

    // player.onTracksUpdate = function () //event9
    // {
    //     LogMessage("Player onTracksUpdate")();
    // };
    //
    // player.onRTPBreak = function () //event129
    // {
    //     LogMessage("Player onRTPBreak");
    // };


    player.setViewport({x: 800, y: 500, width: 800, height: 600});
    player.play({
        uri: url,
        solution: 'auto'
    });
    player.aspectConversion = 3;
    player.videoWindowMode = 1; //always have video window
    player.loop = true;
}


function volumeUp() {
    var oldVolume = stb.GetVolume();
    if (oldVolume < 100) stb.SetVolume(oldVolume + 1);
}


function volumeDown() {
    var oldVolume = stb.GetVolume();
    if (oldVolume > 0) stb.SetVolume(oldVolume - 1);
}

function keyDownEventHandler(event) {

    // noinspection JSDeprecatedSymbols
    const keyCode = event.keyCode;

    switch (keyCode) {
        case 107:
            volumeUp();
            break; //Volume Up
        case 109:
            volumeDown();
            break; //Volume Down
        case 116:
            window.location.reload(true);
            break;//Bottom line rightmost key something like loop
        case 117:
            var player = getPlayer();
            var x = !player.fullscreen;

            if (x === false) {
                player.setViewport({x: 800, y: 500, width: 800, height: 600});
            }
            player.fullscreen = x;
            break;
        case 8:
            clearlog();
            LogMessage("Supported device Model: " + stb.GetDeviceModel());
            break;//Back key
    }

    LogMessage("Key Down Code: " + keyCode);
}

function onPortalEvent(txt) {
    LogMessage("Portal Event " + txt);
}


function newStreamUrlHandler(response) {

    if (lastStreamsAsString === response) return;
    try {
        var js = JSON.parse(response);

        try {
            runPlayer(js.mainUrl);
        }
        catch (e) {
            LogMessage("runPlayer Failed " + e.message);
        }

        lastStreamsAsString = response;
    }
    catch (e) {
        LogMessage("Response is not a json::: " + response);
    }

}


function GetRequest(url, method, fn) {
    var xmlhttp = new XMLHttpRequest();
    xmlhttp.onreadystatechange = function () {
        if (xmlhttp.readyState === XMLHttpRequest.DONE) {
            if (xmlhttp.status === 200) {
                fn(xmlhttp.response);
            }

            intervalObject = setTimeout(function () {
                GetRequest("http://10.10.10.198:13001/streams?device=" + btoa(JSON.stringify(deviceInfo)), "GET", fn)
            }, 5000);
        }
    };

    xmlhttp.ontimeout = function () {
        LogMessage("TimeOut");
    };

    xmlhttp.timeout = 1000;

    xmlhttp.open(method, url, true);
    xmlhttp.send();
}


function magBootUp() {
    clearlog();
    try {
        var validDevice = (typeof gSTB !== 'undefined')
            && (typeof stbPlayerManager !== 'undefined')
            && (typeof stbAudioManager !== 'undefined');


        if (validDevice) {
            stb = gSTB;
        }


        if (stb === null) {
            document.body.style.backgroundColor = "#FF0000";
            document.body.style.color = "#000000";
            document.body.innerHTML = "Unsupported device. No gSTB";

            //We have to put the hls.js code here <MAYBE>
        }
        else {


            document.addEventListener("keydown", keyDownEventHandler);
            document.addEventListener("newstreamurl", newStreamUrlHandler);

            stb.DeinitPlayer();
            stb.InitPlayer();

            stbPlayerManager.list.forEach(function (player) {
                player.stop();
            });

            stb.onPortalEvent = onPortalEvent;

            deviceInfo = {
                deviceVendor: stb.GetDeviceVendor(),
                deviceModel: stb.GetDeviceModel(),
                deviceModelExt: stb.GetDeviceModelExt(),
                deviceHardware: stb.GetDeviceVersionHardware(),
                deviceSerial: stb.GetDeviceSerialNumber(),
                portalName: "MapAppPortal"
            };

            GetRequest("http://10.10.10.198:13001/streams?device=" + btoa(JSON.stringify(deviceInfo)), "GET", newStreamUrlHandler);

        }
    }
    catch (e) {
        LogMessage("Error " + e.message);
    }
}



