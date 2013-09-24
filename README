##redis-mapper




Create models, save objects, and find them later.


This project currently only works with objects one layer deep utilizing strings.
Other primitives will be added along with sub objects and arrays.




##Model
```javascript
CustomerModel = mapper.modelFactory('Customer',
    {
        first_name: '',
        last_name:  ''
    }
);
```


##Save
```javascript
CustomerModel.save(
    {
        first_name: 'thomas',
        last_name:  'silva'
    },
    function(id) {

    }
);
```


##Find
```javascript
CustomerModel.find(
    [{type: 'string', attribute: 'first_name', value: 'thomas'}], function(customer) {

        console.log(customer.first_name);
    }
);
```