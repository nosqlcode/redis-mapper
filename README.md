##redis-mapper




Create models, save objects, and find them later.


This project currently only works with objects one layer deep utilizing strings.
Other primitives will be added along with sub objects and arrays.



##Start
```javascript
var mapper = require('redis-mapper');
var db = mapper(6379, '127.0.0.1');
```


##Model
```javascript
CustomerModel = db.modelFactory('Customer',
    {
        first_name: String,
        last_name:  String
    }
);
```


##Save
```javascript
var thomas = {
    first_name: 'thomas',
    last_name:  'silva'
};

CustomerModel.save(thomas, function(error, id) {

    if (error)
        return console.log(error);

    console.log('new customer id', id);
});
```


##Find
```javascript
CustomerModel.find({first_name: 'thomas'}, function(error, results) {

    if (error)
        return console.log(error);

    console.log(JSON.stringify(results));
});
```