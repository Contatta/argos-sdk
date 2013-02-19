/**
 * @alternateClassName ODataRequest
 */
define('argos/OData/_Request', [
    'dojo/_base/declare',
    'dojo/_base/lang'
], function(
    declare,
    lang
){
    return declare('argos.OData._Request', [], {
        connection: null,
        uri: null,

        constructor: function(connection) {
            if (!connection)
                throw "All requests require an OData connection";

            this.connection = connection;
            this.uri = lang.clone(this.connection.uri);
        },
        getUri: function() {
            return this.uri;
        },
        setUri: function(value) {
            this.uri = value;
            return this;
        },
        build: function(excludeQuery) {
            return this.uri.build(excludeQuery);
        }
    });
});