/**
 * User: thomas
 * Date: 9/15/13
 * Time: 1:22 PM
 */


var mapper = require('../lib/main');
var db = mapper(6379, '127.0.0.1');




CustomerModel = db.modelFactory('Customer',
    {
        first_name: String,
        last_name:  String
    }
);


var thomas = {
    first_name: 'thomas',
    last_name:  'silva'
};

CustomerModel.save(thomas, function(error, id) {

    if (error)
        return console.log(error);

    console.log('new customer id', id);
    CustomerModel.find({first_name: 'thomas'}, function(error, results) {

        if (error)
            return console.log(error);

        console.log(JSON.stringify(results));
    })
});
