var googleStocks = require('google-stocks');
var mongodb = require('mongodb');
var fs = require('fs-extra');
var touch = require('touch');
var mongojs = require('mongojs');
var socket = require("socket.io-client")("http://localhost:3001");

var url = 'mongodb://localhost:27017/stock_market_analysis';
var MongoClient = mongodb.MongoClient;
var collection = mongojs(url).collection("stocks.nse.data") ;


function clear(recent) {
    var db = mongojs(url, []);
    recent.find({}).forEach(function(err, stock) {
        console.log(stock);
                    if(err){
                        throw err;
                    }
                    if(stock){
                        var stock_history = mongojs(url).collection("stocks.nse.history."+stock['t'] );
                        db.collection("stocks.nse.history."+stock['t']).drop();
                    }
        });
}

function getStocks(stock_ids){
    googleStocks(stock_ids)
                    .then(function(stock_data) {


                        console.log("# of stock details received :" +stock_data.length);
                        var recent = mongojs(url).collection("stocks.nse.history.recent");
                        var summary = mongojs(url).collection("stocks.nse.summary");

                        summary.findOne({"_id":0}, function(err, doc) {
                            console.log(doc);
                            if(doc){
                                if(doc.updates === 0){
                                    console.log("updates == 0");
                                    recent.save(stock_data);
                                } else {
                                    recent.find({}).forEach(function(err, stock) {
                                        if(err){
                                            console.log("AN error occured :", err);
                                        }
                                        if(stock){
                                            stock._id = doc.updates;
                                            var stock_history = mongojs(url).collection("stocks.nse.history."+stock['t'] );
                                            stock_history.save(stock);
                                            console.log(stock);
                                        }
                                    });

                                        recent.remove({});
                                        recent.save(stock_data);

                                }
                                summary.update({"_id" : 0}, { "updates": doc.updates+1, "stocks": doc.stocks });
                                socket.emit("stock_data", stock_data);
                            }
                        });

                        // clear(recent);

                    })
                    .catch(function(err) {
                        console.log("An error occured while fetching data :", err);
                    });
}

MongoClient.connect(url, function(err, db) {

  if(err){
    console.log('Unable to connect :', err);

  } else {

    var collection = db.collection('stocks.nse.data');
    collection.find({}, { "_id":1 }).toArray(function(err,result){

          if(err){
            console.log("ERROR while connecting to database :", err);
          }

          else if(result.length) {
            //   console.log(result);
            var stock_ids = [];
            for(var stock in result){
                stock_ids.push(result[stock]['_id']+':NSE');
            }
            setInterval(getStocks, 3000, stock_ids);

          } else {
              console.log("No Documents Found");
          }
    });
  }
  db.close();
});
