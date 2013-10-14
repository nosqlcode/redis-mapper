/**
 * User: thomassilva
 * Date: 6/6/13
 * Time: 8:37 PM
 */


var redis = require('redis'),
    _ = require('underscore'),
    async = require('async');


module.exports = function(port, address) {


    // create a new redis client
    var clientFactory = function() {
        return redis.createClient(port, address, null);
    };


    // build object with its members from the db
    var Find = function(model) {

        return function(parameters, callback) {

            search(model, parameters, function(error, ids) {

                if (error)
                    return callback(error);

                var client = clientFactory();


                var resultsArray = [];
                var retrieveFunctions = [];


                ids.forEach(function(id) {

                    var resultObject = {};
                    resultsArray.push(resultObject);

                    for (var attr in model.members) {
                        var member = model.members[attr];

                        retrieveFunctions.push(member.retrieve(id, resultObject, client));
                    }
                });

                async.parallel(retrieveFunctions, function(error, results) {
                    callback(null, resultsArray);
                });

            });

        }
    };




    function search(model, parameters, callback) {



        var multi = clientFactory().multi();


        var addRange = function(attr, value) {
            var start, stop;
            var key = 'index:' + model.type + ':' + attr;

            if (typeof value === 'string')
                start = stop = indexString(value);
            else
                start = stop = value;

            multi.zrangebyscore(key, start, stop);
        };

        for (var attr in parameters) {
            var value = parameters[attr];

            if (!(attr in model.members))
                return callback(new Error(attr, 'is not an attribute in this model...'));

            addRange(attr, value);
        }


        multi.exec(function(error, ids) {

            if (error)
                return callback(error);

            var scores = {};
            ids.forEach(function(list) {

                list.forEach(function(id) {

                    if (id in scores)
                        scores[id]++;
                    else
                        scores[id] = 1;
                });
            });

            var results = [];
            for (var index in scores) {
                var score = scores[index];

                if (score == ids.length)
                    results.push(index);
            }

            callback(null, results);
        });

    }


    var Save = function(model) {

        return function(info, callback) {

            init(model, info, function(error) {

                if (error)
                    return callback(error);

                save(model, function(error, id) {

                    if (error)
                        return callback(error);

                    callback(null, id);
                });
            });
        }
    };


    // create an object in node, which can later be used to save in the db
    var init = function(model, info, callback) {

        if (!_.isObject(info))
            return callback(new Error('not an object...'));


        for (var attr in info) {

            if (!(attr in model.members))
                return callback(new Error(attr + ' is not in model...'));

            if (!model.members[attr].init(info[attr]))
                return callback(new Error(attr + ' is not compatible with model...'));
        }

        callback(null);
    };



    // save object in redis
    var save = function(model, callback) {


        var client = clientFactory();

        client.incr(model.type, function(error, id) {

            id = model.type + ':' + id;
            var multi = client.multi();

            for (var attr in model.members) {
                var member = model.members[attr];
                member.save(multi, id);
            }

            multi.exec(function(error, result) {

                client.end();

                if (error)
                    return callback(error);

                callback(null, id);
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



    var stringFactory = function(model, attr) {

        return  {
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
                index(multi, model.type, attr, indexString(this.value), id);
            },
            retrieve:   function(id, resultObject, client) {
                return function(callback) {
                    client.hget(id, attr, function(error, result) {
                        resultObject[attr] = result;
                        callback();
                    }.bind(this));
                }.bind(this);
            },
            save:       function(multi, id) {
                multi.hset(id, attr, this.value);
                this.index(multi, id);
            }
        }

    };


    return {

        modelFactory : function(type, schema) {

            var model = {
                type:           type,
                members:        {}
            };

            for (var attr in schema) {
                var field = schema[attr];

                if (field === String)
                    model.members[attr] = stringFactory(model, attr);
            }

            return {
                find:   Find(model),
                save:   Save(model)
            };
        }
    };
};









