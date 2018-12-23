var express = require('express');
var router = express.Router();

/* GET users listing. */
router.get('/', function (req, res, next) {

    var ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
console.log("Remote IP: ", ip);

    const streams = {
        version: "1.0",
        url: "http://10.10.10.198:3000/hls/playlist.m3u8"
    };

    res.send(streams);



});

module.exports = router;
