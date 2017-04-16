var express = require('express');
var router = express.Router();
var mongodb = require('mongodb');
var session = require('client-sessions');
var mongojs = require('mongojs');
 var MongoClient = mongodb.MongoClient;

var server = require('http').createServer(router).listen(3001);
var io = require('socket.io')(server);

var url = 'mongodb://localhost:27017/stock_market_analysis';
var User = mongojs(url).collection('investor');
var purchases = mongojs(url).collection("purchases");

/* GET home page. */

io.on("connection", function(socket) {
    socket.on("stock_data", function(data) {
        // console.log(data);
        socket.broadcast.emit("thelist_data", data);
    });
});

router.use(session({
  cookieName: 'session',
  secret: 'random_string_goes_here',
  duration: 30 * 60 * 1000,
  activeDuration: 5 * 60 * 1000,
}));

router.use(express.static(__dirname + '/libs/'));

router.use(function(req, res, next) {
    console.log(req.session);
  if (req.session && req.session.user) {
    //   console.log(req.session.user.username);
    User.findOne({ "username": req.session.user.username }, function(err, user) {

      if (user) {
        req.user = user;
        delete req.user.password; // delete the password from the session
        req.session.user = user;  //refresh the session value
        res.locals.user = user;
      }
      // finishing processing the middleware and run the route
      next();
    });
  } else {
    //   res.redirect('/')
    next();
  }
});

router.get('/', function(req, res) {
  res.render('index', { title: 'Stocks' });
});

router.get('/thelist', function(req, res) {
  var MongoClient = mongodb.MongoClient;

 MongoClient.connect(url, function(err, db) {
    if(err){
      console.log('Unable To connect :', err);
    } else {
      var collection = db.collection('stocks.nse.data');
      collection.find({}).sort({"name":1}).toArray(function(err, result) {
        if(err){
          console.log(err);
        } else if(result.length){
          res.render('stocks',{
            "stocks_list": result,
            "user": JSON.stringify(req.session.user)

          });
        } else {
        //   res.send("No Documents Found");
        }

        db.close();
      });
    }
  });
});

router.get('/newstock', function(req, res) {
  res.render('newstock', {title: "ADD STOCK"});
});

router.get('/login', function(req, res) {
  res.render('login', {title: "LOGIN"});
});

router.post('/loginauth', function(req,res) {

    // console.log(req.body);
    var MongoClient = mongodb.MongoClient;

    MongoClient.connect(url, function(err, db) {
      if(err){
        console.log("Unable to connect ",err );
      } else {
        //   console.log("connected to server");

          collection = db.collection("investor");

         collection.findOne({"username": req.body.username}, function(err, user) {
            //  console.log("dawda", user);
             if(err){
                 console.log("Error While Loging In :", err);
             } else {
                 if(!user){
                     res.render('login.jade', { error: 'Invalid email or password.' });
                 }
                //  console.log(user)
                 if(req.body.password === user.password) {
                        // console.log("logged in !!");
                        req.session.user = user;
                        res.redirect('/dashboard' );
                 } else {
                     res.render('login.jade', {error : "Invalid Username or password"});
                 }
             }
         });
      }
  });
});

router.get('/dashboard', function(req, res) {
    if(req.session && req.session.user) {

         //user:req.session.user });
        // console.log("dash"+req.session.user.username);
        var pan=req.session.user._id;
        // console.log(pan);


        var investors = mongojs(url).collection('investor');
        var purchases= mongojs(url).collection('purchases');


        purchases.aggregate([  {"$match": {"i_id":pan}}, {"$group" : {"_id": "$s_id", tot: {$sum : {$multiply : ["$rate", "$qty"]  }} , qty: {$sum: "$qty"}, rate: {$avg:"$rate"}  }}   ]).toArray(function(err, result) {
            if(err){
                console.log(err);
            }  else{
                purchase(result, pan, res, req);
            }

        });

        // console.log(res);
        // purchases.find({"i_id": pan}).toArray(function(err, result2) {
        //   if(err){
        //     console.log(err);
        //   } else if(result.length){
        //
        //     res.render('dashboard.jade',{
        //       stock_list: result2, title: "Dashboard", user:req.session.user, stocks: JSON.stringify(result)
        //     });
        //   //   console.log(result);
        //   //   console.log(result.length);
        //   } else {
        //     console.log("No Documents Found");
        //     res.render('dashboard.jade', {title: "Dashboard", user:req.session.user, "stock_list": null});
        //   }
        //
        // });



  }
  });


router.post('/addstock', function(req, res) {

  MongoClient.connect(url, function(err, db) {
    if(err){
      console.log("Unable to connect ",err );
    } else {
    //   console.log("connected to server");

      var collection = db.collection("stocks.nse.data");

      var stock = {name : req.body.stock, value: req.body.value};

      collection.insert([stock], function(err, result) {
        if (err){
          console.log(err);
        } else {
          res.redirect("thelist");
        }
      db.close();
      });
    }
  });
});

router.get('/logout', function(req, res) {
    req.session.destroy(function(err) {
        if(err){
            console.log("Error Ocurred while logging out :", err);
        } else{
        res.redirect('/');
        }
    });
    res.redirect('/');
});

router.get('/queries', function(req, res) {
    var investors = mongojs(url).collection('investor');
    var nse = mongojs(url).collection('stocks.nse.data');
    var purchases = mongojs(url).collection('purchases');
    var his_ABB = mongojs(url).collection('history.ABB');

    investors.findOne({"_id": "1"}, function(err, inv) {
        if(err){
            console.log("Error in investor :", err);
        }else {
            console.log(inv);
            purchases.findOne({"i_id": inv._id} , function(err, det) {
                // res.send(`<p> Get 1st Purchase by the investor having id = 1  </p>`);
                res.send(det);
            } );
        }


    });
        his_ABB.aggregate( {"$group": {"_id": "", "l_fix": {"$max" :"$l_fix" }}} , function(err, det) {
            console.log(det);
    } );

    nse.aggregate({"$group": {"_id": "$industry" } }, function(err, det) {
        console.log(det);
    });


});

router.get('/register', function(req, res) {
    res.render('register');
});

router.post('/registerauth', function(req, res) {
    console.log("passed");
    console.log(req.body);
    var investor = mongojs(url).collection('investor');
    // var x = investor.count()
    var document ={_id:req.body.pan,name:req.body.name,username:req.body.username,email:req.body.email,password:req.body.password,phno:req.body.contact,address:req.body.address};


    investor.insert(document, function(err, records) {
      if (err) {
      	res.redirect("/register");
      	console.log("User has already registered with this pan , insert aborted");
      	//throw err;
      }
      console.log("Record added as ");
      res.redirect("/login");
    });



    //   res.redirect("/register");


});

router.post('/registerauth', function(req, res) {
    console.log(req.body);
    // var investor = mongojs(url).collection('investor');
    // investor.update();
    res.redirect('/login');
});

var stock_data;

router.get('/stock_chart', function(req, res) {

    var stock_history = mongojs(url).collection('stocks.nse.history.' + req.query.stockId);

    stock_history.find(function(err, data){
        stock_data = data;
    });

    res.render('stock_chart',  {"stockId" : req.query.stockId});

});

router.get('/chart_data', function(req, res) {
    if(stock_data[0].t === req.query.stockId){
        res.send(stock_data);
    } else {
        res.send({"status" : 404, "Error": "this page is not available"});
    }
});

router.post('/buyStocks', function(req, res) {
    // var purchases = mongojs(url).collection("purchases");
    MongoClient.connect(url, function(err, db) {
        if(err){
            console.log(err);
        } else {
            var purchases = db.collection("purchases");
            var id = purchases.count(function(err, data) {
                            var x =req.body;
                            x.rate = parseFloat(x.rate);
                            x.qty = parseInt(x.qty);
                            purchases.save(x, function(err, data){
                                if(err) console.log(err);
                            });
            }) ;

        }
    });

});

function purchase(result2, pan, res, req){
    purchases.find({"i_id": pan}).toArray(function(err, result) {
      if(err){
        console.log(err);
      } else if(result.length){
        //   console.log("result :", result);
        //   console.log("result2:", result2);
        console.log("dadwawf avfawffawfwa");
        res.render('dashboard',{
          stock_list: result, title: "Dashboard", user:req.session.user, stocks: JSON.stringify(result), stocks_agg: result2, stocks2: JSON.stringify(result2)
        });
      //   console.log(result);
      //   console.log(result.length);
      } else {
        console.log("No Documents Found");
        res.render('dashboard.jade', {title: "Dashboard", user:req.session.user, "stock_list": null});
      }

    });
}

module.exports = router;
