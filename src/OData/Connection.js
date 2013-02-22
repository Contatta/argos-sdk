/**
 * Connection defines the base interface for the actual AJAX call
 * @alternateClassName ODataConnection
 * @requires ODataUri
 */
define('argos/OData/Connection', [
    'dojo/_base/declare',
    'dojo/_base/json',
    'dojo/_base/lang',
    'dojo/request',
    'dojo/request/notify',
    'dojo/string',
    'dojo/topic',
    './Uri'
], function(
    declare,
    JSON,
    lang,
    request,
    notify,
    string,
    topic,
    Uri
) {
    return declare('argos.OData.Connection', [], {
        /**
         * The base OData/Uri instance that only contains the root url
         */
        uri: null,

        useCredentialRequest: false,

        /**
         * {String} If set it will be Base64'd into the Authorization header along with password
         */
        userName: false,

        /**
         * {String} If set it will be Base64'd into the Authorization header along with userName
         */
        password: '',

        /**
         * {Boolean} Determines if the connection should send JSON headers and expect JSON in return. Setting
         * to false will then switch to ATOM+XML expectations.
         */
        json: true,

        /**
         * {Boolean} Determines if a unique token should be appended to the URL forcing a non-cached response
         */
        preventCache: true,

        constructor: function(options) {
            this.uri = new Uri(options);

            if (typeof options.userName !== 'undefined')
                this.setUserName(options.userName);
            if (typeof options.password !== 'undefined')
                this.setPassword(options.password);
            if (typeof options.json !== 'undefined')
                this.setJson(options.json);
            if (typeof options.preventCache !== 'undefined')
                this.setPreventCache(options.preventCache);
        },

        /**
         * Sets the json flag for content type
         * @chainable
         * @param {Boolean} value
         */
        setJson: function(value) {
            this.json = value;
            return this;
        },
        /**
         * Sets the prevent cache flag that if true forces a request to not used any cached requests stored.
         * @chainable
         * @param {Boolean} value
         */
        setPreventCache: function(value) {
            this.preventCache = value;
            return this;
        },

        /**
         * Returns the URI instance assigned
         * @return {Object} OData/Uri instance
         */
        getUri: function() {
            return this.uri;
        },

        /**
         * Sets the username to the connection that will be Base64'd into the Authorization headers
         * @chainable
         * @param {String} value User name
         */
        setUserName: function(value) {
            this.userName = value;
            return this;
        },

        /**
         * Sets the password to the connection that will be Base64'd into the Authorizations headers
         * @chainable
         * @param {String} value Password
         */
        setPassword: function(value) {
            this.password = value;
            return this;
        },

        /**
         * Creates the Basic Authorization string to be used in the Auth headers
         * @return {String}
         */
        createBasicAuthToken: function() {
            return 'Basic ' + Base64.encode(this.userName + ':' + this.password);
        },

        /**
         * Creates the base headers to be included in all requests, notably the Auth headers and
         * the content type/accept headers.
         *
         * @return {Object} Headers as a key/value list
         */
        createHeadersForRequest: function() {
            var headers = {
                'X-Authorization-Mode': 'no-challenge'
            };

            if (this.userName && !this.useCredentialedRequest)
                headers['Authorization'] = headers['X-Authorization'] = this.createBasicAuthToken();

            if (this.json)
            {
                headers['Content-Type'] = 'application/json';
                headers['Accept'] = 'application/json, */*'
            }
            else
            {
                //todo: headers for atom/xml
            }

            return headers;
        },

        /**
         * Performs the given request, merging in options and calls the provided callbacks.
         * @param {ODataRequest} req The _Request instance that holds the uri
         * @param {Object} options The request options from the code calling read (etc) on the _Request, holds the
         * callbacks and other minor flags
         * @param {Object} xhrOptions Options from the _Request such as header overrides, method, data to send, etc.
         */
        executeRequest: function(req, options, xhrOptions) {
            var onSuccess = function(response) {
                var results = this.processResponse(response);
                topic.publish('/request/complete', req, results);

                if (options.success)
                    options.success.call(options.scope || this, results);
            },
            onFailure = function(err) {
                topic.publish('/request/failure', req, err);

                if (options.failure)
                    options.failure.call(options.scope || this, err);
            },
            onProgress = function(progress) {
                if (options.progress)
                    options.progress.call(options.scope || this, progress);
            };

            var o = lang.mixin({
                url: req.getUri().constructUrl(),
                sync: options.sync || false,
                method: 'GET',
                data: {},
                preventCache: this.preventCache,
                withCredentials: this.useCredentialRequest && this.userName,
                user: this.userName,
                password: this.password,
                handleAs: options.handleAs || 'json'
            }, xhrOptions);

            o.headers = lang.mixin(this.createHeadersForRequest(), xhrOptions.headers || {});

            // if we are provided a result, fire success immediately and do not make xhr request
            if (typeof o.result !== 'undefined')
            {
                onSuccess(o.result);
                return;
            }

            if (o.etag)
                o.headers['If-Match'] = o.etag;

            request.get(o.url, o).then(
                lang.hitch(this, onSuccess),
                lang.hitch(this, onFailure),
                lang.hitch(this, onProgress)
            );
        },

        /**
         * Takes the successful response and processes it for json/xml. Note that dojo request does some handling
         * based on `handleAs`.
         * @param response Successful response from the dojo.request
         * @return {Object} Javascript object for json string, XML tree for xml string
         */
        processResponse: function(response) {
            if (this.json)
                return response.d;
            else
                return this.processXml(response);
        },

        /**
         * Further processes the XML response into a usable form
         * @param response
         * @return {*}
         */
        processXml: function(response) {
            // todo: parse xml
            return response;
        },

        /**
         * Takes a data body (javascript object) and prepares it for transmission based on if the connection is json enabled
         * @param {Object} entry
         * @return {String} Stringified json or xml
         */
        prepareEntry: function(entry) {
            if (this.json)
            {
                return this.prepareJson(entry);
            }
            else
            {
                return this.prepareXml(entry);
            }
        },

        /**
         * Stringifies the entry into a json string
         * @param {Object} entry
         * @return {String}
         */
        prepareJson: function(entry) {
            return JSON.stringify(entry);
        },

        /**
         * Stringifies the entry into xml
         * @param {Object} entry
         * @return {String}
         */
        prepareXml: function(entry) {
            //todo stringify XML
            return entry;
        },

        /**
         * Gets the etag of the entry to be included in a header
         * @param {Object} entry
         * @return {String}
         */
        extractETagFromEntry: function(entry) {
            return entry['etag'];
        },

        /**
         * Executes the given request as a readConnection request by optionally including `httpMethodOverride` xhr options if
         * given.
         * @param {ODataRequest} req _Request instance
         * @param {Object} options Options the read was executed with, if they include `httpMethodOverride` then it modifies
         * the xhr options greatly.
         */
        readCollection: function(req, options) {
            var xhrOptions = {
                headers: {}
            };

            if (options.httpMethodOverride)
            {
                xhrOptions.headers['X-HTTP-Method-Override'] = 'GET';
                xhrOptions.method = 'POST';
                xhrOptions.data = req.getUri().constructUrl();
                xhrOptions.url = req.getUri().constructUrl(true); // exclude query
            }

            this.executeRequest(req, options, xhrOptions);
        },

        /**
         * Executes the GET single resource request
         * @param {ODataRequest} req The _Request instance to run
         * @param {Object} options Options defined by the user when initiating the request
         */
        readEntry: function(req, options) {
            var xhrOptions = {};

            this.executeRequest(req, options, xhrOptions);
        },

        /**
         * Executes the POST single resource request
         * @param {ODataRequest} req The _Request instance to run
         * @param {Object} entry The POST body to be stringified and transmitted, should contain etag
         * @param {Object} options Options defined by the user when initiating the request
         */
        createEntry: function(req, entry, options) {
            var xhrOptions = {
                method: 'POST',
                etag: this.extractETagFromEntry(entry),
                data: this.prepareEntry(entry)
            };

            this.executeRequest(req, options, xhrOptions);
        },

        /**
         * Executes the PUT single resource request with the given entry
         * @param {ODataRequest} req The _Request instance to run
         * @param {Object} entry The PUT body to be stringified and transmitted, should contain etag
         * @param {Object} options Options defined by the user when initiating the request
         */
        updateEntry: function(req, entry, options) {
            var xhrOptions = {
                method: 'PUT',
                etag: this.extractETagFromEntry(entry),
                data: this.prepareEntry(entry)
            };

            this.executeRequest(req, options, xhrOptions);
        },

        /**
         * Executes the DELETE single resource request with the given entry
         * @param {ODataRequest} req The _Request instance to run
         * @param {Object} entry The entry should contain etag, as that's the only thing sent
         * @param {Object} options Options defined by the user when initiating the request
         */
        deleteEntry: function(req, entry, options) {
            var xhrOptions = {
                method: 'DELETE',
                etag: this.extractETagFromEntry(entry)
            };

            this.executeRequest(req, options, xhrOptions);
        },

        /**
         * Executes the POST single resource request, but does not include etag
         * @param {ODataRequest} req The _Request instance to run
         * @param {Object} entry The POST body to be stringified and transmitted
         * @param {Object} options Options defined by the user when initiating the request
         */
        executeServiceOperation: function(req, entry, options) {
            var xhrOptions = {
                method: 'POST',
                data: this.prepareEntry(entry)
            };

            this.executeRequest(req, options, xhrOptions);
        }
    });
});