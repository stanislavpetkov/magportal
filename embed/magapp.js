//ECMA 262 5 - do not support let and const

var backendIP;
var backendPort;
var backendUrl;
var aspectConversion = 1;

var playerNo = 0; //it is in fact constant


var stb = null;
var stbDisplay = null;
var lastStreamsAsString = null;
var deviceInfo = null;
var intervalObject = null;
var playerPosition = -1.0;
var playerAliveInterval = null;
var playerWaitingForStartTimeOut = null;
var weHadNetworkIssue = false;
var NetworkCheckInterval = null;
var APIError = false;
var AliveCounter = 0;


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
    LogMessageInt(message);
}

function clearlog() {
    document.getElementById("logging").innerText = "";
    if (doVisualLog)
    {
        LogMessage("Log cleared");
    }
    else
    {
        LogMessage("Visual Logging is disabled");
    }

}

function RestartStream() {
    LogMessage("Stream Restart");
    clearInterval(playerAliveInterval );
    clearTimeout(intervalObject);
    clearInterval(playerWaitingForStartTimeOut);
    lastStreamsAsString = null;
    getPlayer().loop = false;
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

function displayUINotification(text)
{

    if (text.trim().length<1) return;

    var elm = document.getElementById("Notification");

    elm.innerText = text.trim();
    elm.style.display = "block";

    setTimeout(function(){
        document.getElementById("Notification").style.display = "none";
    }, 2000);
}

function CheckNetwork()
{

    if (AliveCounter <= 1)
    {
        LogMessage("JS Alive!!! -- DEBUG");
        AliveCounter = 7200;
    }
    AliveCounter--;
    var noGW = (isStringEmpty(stb.GetNetworkGateways()));
    var linkStatus = stb.GetLanLinkStatus();

    var elm = document.getElementById("LAN");
    if (!linkStatus)
    {
        elm.style.display = "block";
        elm.innerText = "Network is Down";
    }
    else if (noGW)
    {
        elm.style.display = "block";
        elm.innerText = "Network Gateway is not assigned yet";
    } else if (APIError)
    {
        elm.style.display = "block";
        elm.innerText = "API Server Communication Error";
    } else
    {
        elm.style.display = "none";
        elm.innerText = "";
    }


}
function CheckPosition()
{
    var pos = getPlayer().positionMs/1000;
    var state = getPlayer().state;
    if (playerPosition !== pos)
    {
        var days = pos / 86400.0;
        var rest = pos % 86400.0;
        var date = new Date(null);
        date.setSeconds(rest); // specify value for SECONDS here
        var timeString = date.toISOString().substr(11, 8);

        var vis = days.toFixed(0)+" day(s), "+timeString;


        document.getElementById("time").innerText = "Media position: " + vis + ", State: " + getStateString(state);

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
    getPlayer().loop = false;
    player.volume = 100;
    var output = stbAudioManager.list[0];
    output.add(player);


    player.onPlayEnd = function () //event1
    {
        LogMessage("Player PlayEnd");
        RestartStream();

    };

    player.onTracksInfo = function () //event2
    {

        var atr  = player.audioTracks;
        if (!Array.isArray(atr) || !atr.length) {
            LogMessage("Player onTracksInfo Invalid audio");
            // array does not exist, is not an array, or is empty
            // ⇒ do not attempt to process array
            RestartStream();
            return;
        }

        LogMessage("Player onTracksInfo  "+JSON.stringify(atr));



        if (player.audioPID !== atr[0].pid)
        {
            LogMessage("Force Audio PID");
            player.audioPID = atr[0].pid;

            if (atr.type === 0 )
            {
                LogMessage("Audio not recognized.");
                RestartStream();
                return;
            }
        }
        else {
            LogMessage("Audio is selected. PID "+player.audioPID.toString());
        }


    };

    player.onContentInfo = function () //event7
    {
        LogMessage("Content Info");
    };


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
    player.aspectConversion = aspectConversion;
    player.videoWindowMode = 1; //always have video window
    player.loop = false;

    playerWaitingForStartTimeOut = setTimeout(function ()
    {
        LogMessage("Player Didn't Start For allowed time");
        RestartStream();
    }, 12000);
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


function aspectConvertionToString(arc)
{
    switch (arc)
    {
        case 0: return "anamorphic (video is stretched for the whole screen)";
        case 1: return "Letter box mode";
        case 2: return "Pan&Scan mode";
        case 3: return "between Letter Box Box and Pan&Scan";
        case 4: return "enlarged mode";
        case 5: return "optimal mode";
    }
    return "Unknown"
}

function keyDownEventHandler(event) {

    // noinspection JSDeprecatedSymbols
    const keyCode = event.keyCode;
    var player = getPlayer();

    switch (keyCode) {
        case 76:
        {
            if (stb.IsVirtualKeyboardActive())
            {
                stb.HideVirtualKeyboard();
            }
            else
            {
                stb.ShowVirtualKeyboard();
            }
            break;
        }
        case 89:
        {
            var tmelm = document.getElementById("time");
            var log = document.getElementById("logging");

            if (tmelm.style.display === "block")
            {
                tmelm.style.display = "none";
                log.style.display = "none"
            }
            else
            {
                tmelm.style.display = "block";
                log.style.display = "block"
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

            player.aspectConversion = (player.aspectConversion+1) % 6;

            displayUINotification(aspectConvertionToString(player.aspectConversion));
            aspectConversion = player.aspectConversion;
            SaveSettings();
            //player.fullscreen? setQuarterScreen(): setFullScreen();


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

            runPlayer(js.url);
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

function isStringEmpty(str) {
    if (!str) return true;
    return str.trim().length <= 0;

}


function RetryGetUrl(timeOutSeconds, fn)
{
    clearTimeout(intervalObject);
    intervalObject = setTimeout(function () {
        GetRequest(backendUrl+"/streams?device=" + btoa(JSON.stringify(deviceInfo)), "GET", fn)
    }, timeOutSeconds*1000);
}

function GetRequest(url, method, fn) {

    var noGW = (isStringEmpty(stb.GetNetworkGateways()));
    var linkStatus = stb.GetLanLinkStatus();

    if ((linkStatus === false) || noGW)
    {
        weHadNetworkIssue = true;
        if (noGW && linkStatus)
        {
            LogMessage("Network ::: No Gateway");
        }
        else
        {
            LogMessage("Network ::: Link is Down");
        }


        RetryGetUrl(5, fn);
        return;
    }


    if (weHadNetworkIssue)
    {
        weHadNetworkIssue = false;
        LogMessage("Network ::: Network issue resolved");
    }

    var xmlhttp = new XMLHttpRequest();
    xmlhttp.onreadystatechange = function () {
        if (this.readyState === XMLHttpRequest.DONE) {
            if (this.status === 200) {
                APIError = false;
                fn(this.response);
                RetryGetUrl(300, fn);
            }
            else {
                RetryGetUrl(5, fn);
            }
        }
    };

    xmlhttp.ontimeout = function () {
        LogMessage("TimeOut");
        APIError = true;
    };
    xmlhttp.onerror = function ()
    {
        LogMessage("Http communication error::: API Error ");
        APIError = true;
    };

    xmlhttp.timeout = 10000;

    xmlhttp.open(method, url, true);
    xmlhttp.send();
}


function getCurrentSettings()
{
    return {
        backendServerIp : backendIP,
        backendServerPort: backendPort,
        backendServerUrl: backendUrl,
        aspectConversion: aspectConversion
    };
}


function getDefaultSettings()
{
    backendIP = "10.10.10.198";
    backendPort = 3000;
    backendUrl = "http://"+backendIP+":"+backendPort;
    aspectConversion = 1;
    return getCurrentSettings();
}



function setSettings(config)
{
    backendIP = config.backendServerIp;
    backendPort = config.backendServerPort;
    backendUrl = config.backendServerUrl;
    aspectConversion = config.aspectConversion;
    getPlayer().aspectConversion = config.aspectConversion;
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
            LogMessage("Unsupported device. No gSTB");


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


    NetworkCheckInterval = setInterval(CheckNetwork, 500);


}



