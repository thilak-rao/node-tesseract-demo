var express = require('express'),
app         = express(),
tesseract   = require('node-tesseract'),
busboy      = require('connect-busboy'),
path        = require('path'), 
fs          = require('fs.extra');

// set up handlebars view engine
var handlebars = require('express-handlebars').create({
    defaultLayout:'main',
    helpers: {
        section: function(name, options){
            if(!this._sections) this._sections = {};
            this._sections[name] = options.fn(this);
            return null;
        }
    }
});
app.engine('handlebars', handlebars.engine);
app.set('view engine', 'handlebars');

app.set('port', process.env.PORT || 3000);

app.use(express.static(__dirname + '/public'));
app.use(busboy());

// set 'showTests' context property if the querystring contains test=1
app.use(function(req, res, next){
	res.locals.showTests = app.get('env') !== 'production' && 
		req.query.test === '1';
	next();
});

app.get('/', function(req, res) {
    res.render('home');
});

app.route('/upload').post(function (req, res, next) {
    var fstream;
    req.pipe(req.busboy);
    req.busboy.on('file', function(fieldname, file, filename) {
        console.log("Uploading: " + filename);
        var referenceName = randomStringGenerator();
        //Path where image will be uploaded
        fstream = fs.createWriteStream(__dirname + '/uploads/' + referenceName);
        file.pipe(fstream);
        fstream.on('close', function() {
            console.log("Upload Finished of " + referenceName);
            res.json({success: true});
            runOCR(referenceName);
        });
    });
});

app.get('/polling', function(req, res){
    if(outputQueue.length){
        res.json({
            response: outputQueue.pop()
        });    
    } else {
        res.json({
            response: false
        });    
    }
});

// 404 catch-all handler (middleware)
app.use(function(req, res, next){
	res.status(404);
	res.render('404');
});

// 500 error handler (middleware)
app.use(function(err, req, res, next){
	console.error(err.stack);
	res.status(500);
	res.render('500');
});

app.listen(app.get('port'), function(){
  console.log( 'Express started on http://localhost:' + 
    app.get('port') + '; press Ctrl-C to terminate.' );
});

var outputQueue = [];
function runOCR(filename){
    tesseract.process(__dirname + '/uploads/' + filename, function(err, text) {
        if(err) {
            console.error(err);
            outputQueue.push(err);
        } else {
            console.log(text);
            outputQueue.push(text);
        }
        fs.remove(__dirname + '/uploads/' + filename, function(err) {
            if (err) {
                return console.error(err);
            }
            console.log('success!');
        });
    });
}

function randomStringGenerator() {
    var text = "";
    var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

    for (var i = 0; i < 5; i++)
        text += possible.charAt(Math.floor(Math.random() * possible.length));

    return text;
}