/**
 * User: thomassilva
 * Date: 6/6/13
 * Time: 8:37 PM
 */


var redis = require('redis'),
    _ = require('underscore'),
    async = require('async');



module.exports = {

    modelFactory : function(type, schema) {

        var model = {
            type:           type,
            members:        {}
        };

        for (var element in schema) {

            if (!_.isObject(schema[element]))
                model.members[element] = stringFactory(model, element);
        }

        return {
            find:   Find(model),
            save:   Save(model)
        };
    }
};




// create a new redis client
var clientFactory = function() {
    return redis.createClient(6379, '165.225.150.104', null);
};




// build object with its members from the db
var Find = function(model) {

    return function(parameters, callback) {

        search(model.type, parameters, function(ids) {


            console.log(ids.length);

            var client = clientFactory();


            var resultsArray = [];
            var retrieveFunctions = [];


            for (var element in ids) {

                var id = ids[element];

                var resultObject = {};
                resultsArray.push(resultObject);

                for (element in model.members) {

                    var attribute = model.members[element];
                    retrieveFunctions.push(attribute.retrieve(id, resultObject, client));
                }

            }

            async.parallel(retrieveFunctions, function(error, results) {

                callback(resultsArray);
            });

        });

    }
};




function search(type, parameters, callback) {



    var multi = clientFactory().multi();


    for (var element in parameters) {

        var parameter = parameters[element];
        var key, start, stop;

        key = 'index:' + type + ':' + parameter.attribute;

        if (parameter.type == 'string') {
            start = stop = indexString(parameter.value);
        }

        multi.zrangebyscore(key, start, stop);
    }

    multi.exec(function(error, ids) {

        var scores = {};
        for (element in ids) {

            var list = ids[element];
            for (element in list) {
                var id = list[element];

                if (id in scores)
                    scores[id]++;
                else
                    scores[id] = 1;
            }
        }

        var results = [];
        for (element in scores) {
            var score = scores[element];
            if (score == ids.length) {
                results.push(element);
            }
        }

        callback(results);

    });

}



var Save = function(red) {

    return function(info, callback) {

        init(red, info, function(success) {

            if (success) {
                save(red, function(id) {
                    callback(id);
                });
            }
            else {
                callback(false);
            }
        });
    }
};


// create an object in node, which can later be used to save in the db
var init = function(red, info, callback) {


    // value to keep track of number of problems with info provided
    var faultTracker = 0;

    // make sure info is an object
    if (_.isObject(info)) {

        for (var attribute in info) {
            var status = red.members[attribute].init(info[attribute]);
            if (!status) {
                faultTracker++;
            }
        }
    }

    // make sure there were no issues creating this object
    if (faultTracker == 0) {
        console.log('successfully created object of type *' + red.type + '*');
        callback(true);
    }
    else {
        console.log('unable to create object of type *' + red.type + '*');
        callback(false);
    }
};



// save object in redis
var save = function(red, callback) {


    var client = clientFactory();

    client.incr(red.type, function(error, id) {

        id = red.type + ':' + id;
        var multi = client.multi();

        for (var element in red.members) {
            red.members[element].save(multi, id);
        }

        multi.exec(function(error, result) {

            if (error) {
                callback(false);
            }
            else {
                console.log('id of new ' + red.type + ': ' + id);
                callback(id);
            }
            client.end();
        });
    });
};



var indexString = function(string) {

    var score = 0;

    for (var i = 0; i < string.length; i++) {

        var multiplier = Math.pow(0.01, i);

        var add;
        switch (string.substring(i, i + 1)) {
            case 'a': add = 1; break;
            case 'b': add = 2; break;
            case 'c': add = 3; break;
            case 'd': add = 4; break;
            case 'e': add = 5; break;
            case 'f': add = 6; break;
            case 'g': add = 7; break;
            case 'h': add = 8; break;
            case 'i': add = 9; break;
            case 'j': add = 10; break;
            case 'k': add = 11; break;
            case 'l': add = 12; break;
            case 'm': add = 13; break;
            case 'n': add = 14; break;
            case 'o': add = 15; break;
            case 'p': add = 16; break;
            case 'q': add = 17; break;
            case 'r': add = 18; break;
            case 's': add = 19; break;
            case 't': add = 20; break;
            case 'u': add = 21; break;
            case 'v': add = 22; break;
            case 'w': add = 23; break;
            case 'x': add = 24; break;
            case 'y': add = 25; break;
            case 'z': add = 26; break;
            case '0': add = 27; break;
            case '1': add = 28; break;
            case '2': add = 29; break;
            case '3': add = 30; break;
            case '4': add = 31; break;
            case '5': add = 32; break;
            case '6': add = 33; break;
            case '7': add = 34; break;
            case '8': add = 35; break;
            case '9': add = 36; break;
            default: add = 0;
        }

        score += add * multiplier;
    }

    return score;

};



var index = function(multi, type, attribute, score, key) {
    multi.zadd('index:' + type + ':' + attribute, score, key);
};



var stringFactory = function(red, attribute) {

    return  {
        attribute:  attribute,
        value:      null,
        init:       function(value) {
                        var status = false;
                        if (!_.isObject(value)) {
                            this.value = value;
                            status = true;
                        }
                        return status;
                    },
        index:      function(multi, id) {
                        index(multi, red.type, this.attribute, indexString(this.value), id);
                    },
        retrieve:   function(id, resultObject, client) {
                        return function(callback) {
                            client.hget(id, this.attribute, function(error, result) {
                                resultObject[this.attribute] = result;
                                callback();
                            }.bind(this));
                        }.bind(this);
                    },
        save:       function(multi, id) {
                        multi.hset(id, this.attribute, this.value);
                        this.index(multi, id);
                    }
    }

};