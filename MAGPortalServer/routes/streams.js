var express = require('express');
var router = express.Router();

/* GET users listing. */
router.get('/', function (req, res, next) {



    const streams = {
        version: "1.0",
        mainUrl: "http://qthttp.apple.com.edgesuite.net/1010qwoeiuryfg/sl.m3u8",
        backupUrl:"http://devimages.apple.com/iphone/samples/bipbop/bipbopall.m3u8"
    };
    res.send(streams);



});

module.exports = router;
