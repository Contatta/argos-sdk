/**
 * @alternateClassName ODataCollectionRequest
 * @requires ODataRequest
 */
define('argos/OData/CollectionRequest', [
    'dojo/_base/declare',
    './_Request'
], function(
    declare,
    _Request
){
    return declare('argos.OData.CollectionRequest', [_Request], {
        getCount: function() {
            return this.uri.getCount();
        },
        setCount: function(value) {
            this.uri.setCount(value);
            return this;
        },
        getStartIndex: function() {
            return this.uri.getStartIndex();
        },
        setStartIndex: function(value) {
            this.uri.setStartIndex(value);
            return this;
        },
        read: function(options) {
            return this.connection.readFeed(this, options);
        }
    });
});