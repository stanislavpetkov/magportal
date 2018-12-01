//ECMA 262 5 - do not support let


var stb = null;
var lastStreamsAsString = null;
var deviceInfo;

function runPlayer(ndx, url) {


    var otherplayer = stbPlayerManager.list[1 - ndx];
    otherplayer.stop();


    var player = stbPlayerManager.list[ndx];
    player.surface = stbSurfaceManager.list[2 + ndx];
    player.volume = 100;

    var output = stbAudioManager.list[0];
    output.add(player);

//    document.body.innerText += "\nPlayer " + ndx + " caps " + JSON.stringify(player.capabilities) + "\n sfc " + player.surface + "\n\n\n";
    //document.body.innerText += "\n Number of Audio Outputs = " + stbAudioManager.list.length + "\n";

    player.onPlayEnd = function () //event1
    {
        document.body.innerText += "\n Player PlayEnd";
    };

    player.onTracksInfo = function () //event2
    {
        document.body.innerText += "\n Player onTracksInfo";
    };

    player.onContentInfo = function () //event7
    {
        document.body.innerText += "\n Content Info";
    };


    player.onPlayStart = function () //event4
    {
        document.body.innerText += "\n Player PlayStart   " ;
    };

    player.onPlayError = function () //event 5
    {
        document.body.innerText += "\n Player Error";
    };

    player.onTracksError = function () //event8
    {
        document.body.innerText += "\n Player onTracksError";
    };

    player.onDualMono = function () //event6
    {
        document.body.innerText += "\n Player onDualMono";
    };

    player.onTracksUpdate = function () //event9
    {
        document.body.innerText += "\n Player onTracksUpdate";
    };

    player.onRTPBreak = function () //event129
    {
        document.body.innerText += "\n Player onRTPBreak";
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
            document.body.innerText = "Supported device Model: " + stb.GetDeviceModel();
            break;//Back key
    }

    document.body.innerText += "\nKey Down Code: " + keyCode;
}

function onPortalEvent(txt) {
    document.body.innerText += "\nPortal Event " + txt;
}


function newStreamUrlHandler(readyState, statusCode, responseType, response) {
    if (readyState === XMLHttpRequest.DONE) {
        document.body.innerText += "\nnewStreamUrlHandler Response::: " + responseType + "\n";

        if (statusCode === 200) {
            document.body.innerText += response;

            if (lastStreamsAsString !== response) {
                var js = JSON.parse(response);

                runPlayer(1, js.items[0].url);
                lastStreamsAsString = response;
            }


        }
        else if (statusCode === 400) {
            document.body.innerText += '\nThere was an error 400';
        }
        else {
            document.body.innerText += '\nStatusCode ' + statusCode + " returned";
        }
    }
    else {
        document.body.innerText += "\nreadyState " + readyState;
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
        document.body.style.backgroundColor = "#000000";
        document.body.style.color = "#FFFFFF";
        document.body.innerText = "Unsupported device. No gSTB";
        //We have to put the hls.js code here
    }
    else {
        document.body.style.backgroundColor = "#AAAAFF";
        document.body.style.color = "#000000";
        document.body.innerText = "Supported device Model: " + stb.GetDeviceModel();
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

        GetRequest("/streams?device=" + btoa(JSON.stringify(deviceInfo)), "GET", newStreamUrlHandler);
    }
}



