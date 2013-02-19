/**
 * @alternateClassName ODataEntryRequest
 * @requires ODataRequest
 */
define('argos/OData/EntryRequest', [
    'dojo/_base/declare',
    './_Request'
], function(
    declare,
    _Request
){
    return declare('argos.OData.EntryRequest', [_Request], {
        read: function(options) {
            return this.connection.readEntry(this, options);
        }
    });
});