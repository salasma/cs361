var mysql = require('mysql');
var thesaurus = require('thesaurus-synonyms');

module.exports.pool = pool;

var express = require('express');

var app = express();

var handlebars = require('express-handlebars');

var bodyParser = require('body-parser');

app.use(bodyParser.urlencoded({extended: true}));
app.use(bodyParser.json());

app.engine('handlebars', handlebars({defaultLayout: 'main', extname: '.handlebars'}));
app.set('view engine', 'handlebars');
app.set('port', 6976);

app.listen(app.get('port'), function(){
    console.log('Express started on http://localhost:' + app.get('port') + '; press Ctrl-C to terminate.');
});



app.get('/users/:userID', function(req, res){
    callbackCount = 0;

    var context = {};

    var mysql = req.app.get('mysql');

    getUser(res, mysql, context, req.params.userID, complete);
    getDiagnoses(res, mysql, context, complete);
    getStates(res, mysql, context, complete);

    function complete(){
        callbackCount++;
        if(callbackCount >= 3){
            res.render('user', context);
        }

    }
});

/* ******************************************************************************

2. INSERT handling.


 ************************************************************************ */
//adds a user to the user table then refreshed / redirects to the user page to display the updated table

app.post('/users', function(req, res){
    var mysql = req.app.get('mysql');
    var sql = "INSERT INTO users (email, stateID, sicknessID) VALUES (?,?,?)";
    var inserts = [req.body.email, req.body.stateID, req.body.sicknessID];
    sql = pool.query(sql,inserts,function(error, results, fields){
        if(error){
            res.write(JSON.stringify(error));
            res.end();
        }else{
            res.redirect('/users');
        }
    });
});

//adds an instances to the instances table for a specific user

app.post('/instances/:userID', function(req, res){
    var sql = "INSERT INTO instances (startDate, endDate, userID, sicknessID) VALUES (?,?,?,?)";
    var thisUser = req.params.userID;

    thisUser = thisUser.replace(":", "");    //removes the : so that SQL doesn't freak out when it tries to insert the userID

    var inserts = [req.body.startDate, req.body.endDate, thisUser, req.body.sicknessID];
    sql = pool.query(sql,inserts,function(error, results, fields){
        if(error){
            res.write(JSON.stringify(error));
            res.end();
        }else{
            var redirectString = '/instances/'+ thisUser;
            res.redirect(redirectString);
        }
    });
});

/* ******************************************************************************

3. UPDATE handling.


 ************************************************************************ */
//update data is sent here to update a person

app.post('/users/:userID', function (req, res, next){
    var sql = "UPDATE users SET email=?, stateID=?, sicknessID=? WHERE userID=?";

    var thisUser = req.params.userID;

    thisUser = thisUser.replace(":", "");

    var inserts = [req.body.email, req.body.stateID, req.body.sicknessID,  thisUser];

    sql = pool.query(sql,inserts,function(error, results, fields){
        if(error){
            res.write(JSON.stringify(error));
            res.end();
        }else{
            var redirectString = '/users/'+ thisUser;

            res.redirect(redirectString)
        }
    });
});

/* ******************************************************************************

4. DELETE handling.


 ************************************************************************ */
app.post('/deleteUser/:userID', function (req, res, next){
    var callbackCount = 0;

    var thisUser = req.params.userID;

    thisUser = thisUser.replace(":", "");

    deleteInstances(res, mysql, thisUser, complete);
    deleteUser(res, mysql, thisUser, complete);

    function complete(){
        callbackCount++;
        if(callbackCount >= 2){
            res.redirect('/users');
        }

    }

});



/* ******************************************************************************

5. ERROR handling.


 ************************************************************************ */

app.use(function(req, res){
    res.status(404);
    res.render('404');
});

app.use(function( err, req, res, next){
    console.error(err.stack);
    res.status(500);
    res.render('500');
});



//selects a specific user

function getUser(res,mysql, context, userID, complete){
    var sql = "SELECT userID, email, stateID, diagnosisName, diagnoses.sicknessID FROM diagnoses JOIN users ON diagnoses.sicknessID = users.sicknessID WHERE userID = ?";
    var inserts = [userID];
    pool.query(sql, inserts, function(error, results, fields){
        if(error){
            res.write(JSON.stringify(error));
            res.end();
        }
        context.user = results[0];
        complete();
    });
};





//deletes a user

function deleteUser(res, mysql, userID, complete){
    var sql = "DELETE FROM users WHERE userID=?";
    var inserts = [userID];

    pool.query(sql, inserts, function(error, results, fields){
        if(error){
            res.write(JSON.stringify(error));
            res.end();
        }
        complete();
    });
};


//for testing purposes only

function alertMe(){
    alert("This function was called properly.")
}


