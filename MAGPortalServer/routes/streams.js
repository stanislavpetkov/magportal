var express = require('express');
var router = express.Router();

/* GET users listing. */
router.get('/', function (req, res, next) {

    const streams = {
        version: "1.0",
        items: [
            {
                url: "http://qthttp.apple.com.edgesuite.net/1010qwoeiuryfg/sl.m3u8",
                isMain: true,
                title: "Apple 2010"
            },
            {
                url: "http://devimages.apple.com/iphone/samples/bipbop/bipbopall.m3u8",
                isMain: false,
                title: "Bip Bop"
            }
        ]
    };
    res.send(streams);



});

module.exports = router;
