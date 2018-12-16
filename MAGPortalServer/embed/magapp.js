//ECMA 262 5 - do not support let and const

var backendIP;
var backendPort;
var backendUrl;

var playerNo = 0; //it is in fact constant


var stb = null;
var stbDisplay = null;
var lastStreamsAsString = null;
var deviceInfo = null;
var intervalObject = null;
var playerPosition = -1.0;
var playerAliveInterval = null;
var playerWaitingForStartTimeOut = null;

var runMain = true;

function getPlayer() {
    return stbPlayerManager.list[playerNo];
}


function setFullScreen()
{
    var player = getPlayer();
    player.fullscreen = true;
}

function setQuarterScreen()
{
    var player = getPlayer();
    player.fullscreen = false;
    player.setViewport({x: stbDisplay.width/2, y: stbDisplay.height/2, width: stbDisplay.width/2, height: stbDisplay.height/2 });
}

function LogMessage(message) {
    var now = new Date().toUTCString();
    var logging = document.getElementById("logging");
    if ((typeof logging === 'undefined') || logging === null) {
        //document.body.innerHTML += now + "\t" + message + "\n";
        return;
    }
    var logM = now + "\t" + message + "\n";
    console.log(logM);
    logging.innerText += logM;
}

function clearlog() {
    document.getElementById("logging").innerText = "";
    LogMessage("Log cleared");
}

function RestartStream() {
    LogMessage("Stream Restart");
    clearInterval(playerAliveInterval );
    clearTimeout(intervalObject);
    lastStreamsAsString = null;
    getPlayer().stop();
    GetRequest(backendUrl+"/streams?device=" + btoa(JSON.stringify(deviceInfo)), "GET", newStreamUrlHandler);
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
        document.getElementById("time").innerText = "Time: " + pos.toFixed(3) + "   State: " + getStateString(state);
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
        playerAliveInterval = setInterval(CheckPosition, 500);
        clearInterval(playerWaitingForStartTimeOut);
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


    setFullScreen();
    player.play({
        uri: url,
        solution: 'auto'
    });
    player.aspectConversion = 3;
    player.videoWindowMode = 1; //always have video window
    player.loop = true;

    playerWaitingForStartTimeOut = setTimeout(function ()
    {
        LogMessage("Player Didn't Start For allowed time");
        RestartStream();
    }, 8000);
}




function volumeUp() {
    var oldVolume = stb.GetVolume();
    if (oldVolume < 100) stb.SetVolume(oldVolume + 1);
}


function volumeDown() {
    var oldVolume = stb.GetVolume();
    if (oldVolume > 0) stb.SetVolume(oldVolume - 1);
}

function isValidIPaddress(inputText)
{
    var ipformat = /^(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
    return (inputText.match(ipformat));
}

function keyDownEventHandler(event) {

    // noinspection JSDeprecatedSymbols
    const keyCode = event.keyCode;
    var player = getPlayer();

    switch (keyCode) {
        case 89:
        {
            var tmelm = document.getElementById("time");

            if (tmelm.style.display === "block")
            {
                tmelm.style.display = "none";
            }
            else
            {
                tmelm.style.display = "block";
            }
            break;
        }
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
            player.fullscreen? setQuarterScreen(): setFullScreen();
            break;
        case 122:
            var elm = document.getElementById("serveripform");

            if (elm.style.display === "block")
            {
                elm.style.display = "none";
                break;
            }

            //setQuarterScreen();


            elm.style.display="block";
            var edit = document.getElementById("SERVERIP");
            edit.focus();
            edit.value = backendIP;
            var ipval = document.getElementById("ipval");
            ipval.innerHTML = "";





            edit.addEventListener("keydown", function(event)
            {
                // noinspection JSDeprecatedSymbols
                const keyCode = event.keyCode;
                var form = document.getElementById("serveripform");
                var edit = document.getElementById("SERVERIP");
                var ipval = document.getElementById("ipval");

                switch (keyCode) {
                    case 13:
                    {
                            var x = edit.value.trim();
                            try {
                                if (isValidIPaddress(x)) {
                                    ipval.innerHTML = "";
                                    console.log(x);
                                    var prevIP = backendIP;
                                    backendIP = x;
                                    backendUrl = "http://" + backendIP + ":" + backendPort;
                                    SaveSettings();
                                    form.style.display = "none";
                                    if (prevIP!==backendIP) {
                                        RestartStream();
                                    }
                                    //setFullScreen();
                                    break;
                                }
                            }
                            catch(e)
                            {
                                console.log("Exception: "+e.message);
                            }
                        ipval.innerHTML = "Invalid IP";
                        break;
                    }

                    case 27:
                    {
                        form.style.display = "none";
                        //setFullScreen();
                        break;
                    }

                }

            });
            break;
        case 8:
            clearlog();
            LogMessage("Supported device Model: " + stb.GetDeviceModel());
            break;//Back key
        default:
            LogMessage("Key Down Code: " + keyCode);
    }


}

function onPortalEvent(txt) {
    LogMessage("Portal Event " + txt);
}


function newStreamUrlHandler(response) {

    if (lastStreamsAsString === response) return;
    try {
        var js = JSON.parse(response);

        try {

            runPlayer(runMain?js.mainUrl:js.backupUrl);
            runMain = !runMain;
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
                GetRequest(backendUrl+"/streams?device=" + btoa(JSON.stringify(deviceInfo)), "GET", fn)
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


function getCurrentSettings()
{
    return {
        backendServerIp : backendIP,
        backendServerPort: backendPort,
        backendServerUrl: backendUrl
    };
}


function getDefaultSettings()
{
    backendIP = "10.10.10.198";
    backendPort = 13001;
    backendUrl = "http://"+backendIP+":"+backendPort;

    return getCurrentSettings();
}



function setSettings(config)
{
    backendIP = config.backendServerIp;
    backendPort = config.backendServerPort;
    backendUrl = config.backendServerUrl;
}



function SaveSettings()
{
    var x = getCurrentSettings();
    stb.SaveUserData("magapp.json", JSON.stringify(x));
}

function magBootUp() {
    clearlog();
    try {
        var validDevice = (typeof gSTB !== 'undefined')
            && (typeof stbPlayerManager !== 'undefined')
            && (typeof stbAudioManager !== 'undefined');


        if (false === validDevice) {
            document.body.style.backgroundColor = "#FF0000";
            document.body.style.color = "#000000";
            document.body.innerHTML = "Unsupported device. No gSTB";

            //We have to put the hls.js code here <MAYBE>
        }
        else {
            stb = gSTB;
            stbDisplay = stbDisplayManager.list[0];

            var mySettings = stb.LoadUserData("magapp.json");



            var jsSettings = getDefaultSettings();

            if ((typeof mySettings !== 'string') || (mySettings === ""))
            {

                LogMessage("No valid settings saved");
                stb.SaveUserData("magapp.json", JSON.stringify(jsSettings));
            }
            else
            {
                try {
                    jsSettings = JSON.parse(mySettings);
                    setSettings(jsSettings);
                }
                catch(e)
                {
                    LogMessage("Exception parse settings: "+e.message);
                }


            }


            document.addEventListener("keydown", keyDownEventHandler);

            stbPlayerManager.list.forEach(function (player) {
                player.stop();
            });


var webLayer = null;
var playerLayer = getPlayer().surface;
var player2Layer = null;

try {
    stbSurfaceManager.list.forEach(function (surface)
    {
        if (surface.type === 1) {
            webLayer = surface;
        }
        if (surface.type === 2) //player
        {
            if (surface.id !== playerLayer.id) {
                player2Layer = surface;
            }
        }
    });


    if (!stbSurfaceManager.setOrder([player2Layer, playerLayer, webLayer])) {
        console.log("ORDER NOT SET");
    }
    else {
        console.log("ORDER SET");
    }
}
catch(e)
{
    console.log("Exception::: "+e.message);
}

            stb.onPortalEvent = onPortalEvent;

            deviceInfo = {
                deviceVendor: stb.GetDeviceVendor(),
                deviceModel: stb.GetDeviceModel(),
                deviceModelExt: stb.GetDeviceModelExt(),
                deviceHardware: stb.GetDeviceVersionHardware(),
                deviceSerial: stb.GetDeviceSerialNumber(),
                portalName: "magapp.js"
            };

            GetRequest(backendUrl+"/streams?device=" + btoa(JSON.stringify(deviceInfo)), "GET", newStreamUrlHandler);

        }
    }
    catch (e) {
        LogMessage("Error " + e.message);
    }
}



