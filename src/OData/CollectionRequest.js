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
        read: function(options) {
            return this.connection.readCollection(this, options);
        }
    });
});