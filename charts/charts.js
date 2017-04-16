var express = require('express');
var mongojs = require('mongojs');

var app = express();
var url = 'mongodb://localhost:27017/stock_market_analysis';

app.use(express.static(__dirname + '/'));

app.get('/chart_data', function(req, res) {

    var stock_history = mongojs(url).collection('stocks.nse.history.' + req.query.stockId);
    console.log(req.query);
    var result = stock_history.find(function(err, history) {
        res.send(history);
    });
});

app.listen(3000);
