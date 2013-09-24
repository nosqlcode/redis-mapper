/**
 * User: thomas
 * Date: 9/15/13
 * Time: 1:22 PM
 */


var mapper = require('./../redis-mapper/mapper');




CustomerModel = mapper.modelFactory('Customer',
    {
        first_name: '',
        last_name:  ''
    }
);

CustomerModel.save(
    {
        first_name: 'thomas',
        last_name:  'silva'
    },
    function(id) {

        CustomerModel.find([{type: 'string', attribute: 'first_name', value: 'thomas'}], function(results) {

            console.log(JSON.stringify(results));
        })
    }
);
