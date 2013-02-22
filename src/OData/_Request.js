/**
 * The ODataRequest module is designed to act as the interface between the "global" connection and the endpoint you are
 * trying to request. Requests are constructed with the connection and clones the connections uri that serves as a starting
 * point for this requests' uri.
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
        /**
         * {ODataConnection} The ODataConnection instance associated with this request
         */
        connection: null,

        /**
         * {ODataUri} The ODataURI instance associated with this request, this is the property that will accessed for
         * adding resourcekind, query options, etc.
         */
        uri: null,

        /**
         * Requires a passed ODataConnection instance to be used for the `this.connection` without it an error will be
         * thrown.
         * It will also clone the connections uri to serve as a starting point.
         * @param {ODataConnection} connection
         */
        constructor: function(connection) {
            if (!connection)
                throw "All requests require an OData connection";

            this.connection = connection;
            this.uri = lang.clone(this.connection.uri);
        },

        /**
         * Returns the ODataUri for this request, as you may make many adjustments to the Uri you may end up with:
         *
         *     var requestUri = request.getUri();
         *     requestUri.setResourceKind('mail');
         *     requestUri.setQueryOption('$filter', 'inbox');
         *     // etc
         *
         * @return {ODataUri}
         */
        getUri: function() {
            return this.uri;
        },

        /**
         * Completely replaces the ODataUri instance with the given ODataUri
         * @chainable
         * @param {ODataUri} value ODataUri instance to replace the existing one with.
         */
        setUri: function(value) {
            this.uri = value;
            return this;
        }
    });
});