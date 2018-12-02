//ECMA 262 5 - do not support let


var stb = null;
var lastStreamsAsString = null;
var deviceInfo = null;
var loading_element = null;
var logging_element = null;


function logmessage(message) {
    var now = new Date().toUTCString();
    logging_element.innerText += now + "<pre>" + message + "</pre>\n";
}

function clearlog(message) {
    logging_element.innerText = "";
    logmessage("Log cleared");
}

function runPlayer(ndx, url) {


    var otherplayer = stbPlayerManager.list[1 - ndx];
    otherplayer.stop();


    var player = stbPlayerManager.list[ndx];
    player.surface = stbSurfaceManager.list[2 + ndx];
    player.volume = 100;

    var output = stbAudioManager.list[0];
    output.add(player);


    player.onPlayEnd = function () //event1
    {
        logmessage("Player PlayEnd");
    };

    player.onTracksInfo = function () //event2
    {
        logmessage("Player onTracksInfo");
    };

    player.onContentInfo = function () //event7
    {
        logmessage("Content Info");
    };


    player.onPlayStart = function () //event4
    {

        logmessage("Player PlayStart");
        loading_element.style.display = "none";
    };

    player.onPlayError = function () //event 5
    {
        logmessage("Player Error");
    };

    player.onTracksError = function () //event8
    {
        logmessage("Player onTracksError");
    };

    player.onDualMono = function () //event6
    {
        logmessage("Player onDualMono");
    };

    player.onTracksUpdate = function () //event9
    {
        logmessage("Player onTracksUpdate")();
    };

    player.onRTPBreak = function () //event129
    {
        logmessage("Player onRTPBreak");
    };


    player.aspectConversion = 4;
    player.videoWindowMode = 0;
    player.setViewport({x: 800 * ndx, y: 500, width: 800, height: 600});

    player.play({
        uri: url,
        solution: 'auto'
    });


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
        case 82:
            runPlayer(0, "http://devimages.apple.com/iphone/samples/bipbop/bipbopall.m3u8");
            break;//PlayPause Key
        case 83:
            runPlayer(1, "http://qthttp.apple.com.edgesuite.net/1010qwoeiuryfg/sl.m3u8");
            break;//Stop key
        case 8:
            clearlog();
            logmessage("Supported device Model: " + stb.GetDeviceModel());
            break;//Back key
    }

    logmessage("Key Down Code: " + keyCode);
}

function onPortalEvent(txt) {
    logmessage("Portal Event " + txt);
}


function newStreamUrlHandler(readyState, statusCode, responseType, response) {
    if (readyState === XMLHttpRequest.DONE) {
        logmessage("newStreamUrlHandler Response::: " + responseType);

        if (statusCode === 200) {

            logmessage(response);

            if (lastStreamsAsString !== response) {
                var js = JSON.parse(response);

                runPlayer(1, js.items[0].url);
                lastStreamsAsString = response;
            }


        }
        else if (statusCode === 400) {
            logmessage('There was an error 400');
        }
        else {
            logmessage('StatusCode ' + statusCode + " returned");
        }
    }
    else {
        logmessage("readyState " + readyState);
    }

}


function GetRequest(url, method, callback) {
    var xmlhttp = new XMLHttpRequest();

    xmlhttp.onreadystatechange = function () {

        callback(xmlhttp.readyState, xmlhttp.status, xmlhttp.responseType, xmlhttp.responseText);
    };

    xmlhttp.open(method, url, true);
    xmlhttp.send();
}


function bootUp() {


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
        loading_element = document.getElementById("loading");
        logging_element = document.getElementById("logging");


        logging_element.style.display = "block";


        loading_element.style.display = "block";


        document.addEventListener("keydown", keyDownEventHandler);
        document.addEventListener("newstreamurl", newStreamUrlHandler);

        stb.DeinitPlayer();
        stb.InitPlayer();

        stbPlayerManager.list.forEach(function (player) {
            player.stop();
        });


        stbSurfaceManager.list.forEach(function (surface) {

            logmessage("surface ID: " + surface.id + ", type: " + surface.type);
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

        GetRequest("/streams?device=" + btoa(JSON.stringify(deviceInfo)), "GET", newStreamUrlHandler);
    }
}



