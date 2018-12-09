var express = require('express');
var router = express.Router();

/* GET users listing. */
router.get('/', function (req, res, next) {



    const streams = {
        version: "1.0",
        mainUrl: "http://10.10.10.198:3000/hls/playlist.m3u8",
        backupUrl:"http://devimages.apple.com/iphone/samples/bipbop/bipbopall.m3u8"
    };

    //
    // const streams = {
    //     version: "1.0",
    //     mainUrl: "http://devimages.apple.com/iphone/samples/bipbop/bipbopall.m3u8",
    //     backupUrl:"http://qthttp.apple.com.edgesuite.net/1010qwoeiuryfg/sl.m3u8"
    // };
    res.send(streams);



});

module.exports = router;
