/**
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
    'dojox/encoding/digests/_base',
    './Uri'
], function(
    declare,
    JSON,
    lang,
    request,
    notify,
    string,
    topic,
    digests,
    Uri
) {
    return declare('argos.OData.Connection', [], {
        uri: null,
        useCredentialRequest: false,
        userName: false,
        password: '',
        batchScope: null,
        json: true,

        constructor: function(options) {
            this.uri = new Uri(options);

            if (typeof options.userName !== 'undefined')
                this.setUserName(options.userName);
            if (typeof options.password !== 'undefined')
                this.setPassword(options.password);
            if (typeof options.json !== 'undefined')
                this.setJson(options.json);
        },

        /**
         * Sets the json flag for data type
         * @param {Boolean} value
         * @return {*}
         */
        setJson: function(value) {
            this.json = value;
            return this;
        },
        getUri: function() {
            return this.uri;
        },
        setUserName: function(value) {
            this.userName = value;
            return this;
        },
        setPassword: function(value) {
            this.password = value;
            return this;
        },
        setBatchScope: function(value) {
            this.batchScope = value;
        },
        clearBatchScope: function() {
            this.batchScope = null;
        },
        createBasicAuthToken: function() {
            return 'Basic ' + Base64.encode(this.userName + ':' + this.password);
        },
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
                url: req.uri.constructUrl(),
                sync: options.sync || false,
                method: 'GET',
                data: {},
                preventCache: true,
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
        processResponse: function(response) {
            if (this.json)
                return response.d;
            else
                return this.processXml(response);
        },
        processXml: function(response) {
            // todo: parse xml
            return response;
        },
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
        prepareJson: function(entry) {
            return JSON.stringify(entry);
        },
        prepareXml: function(entry) {
            //todo stringify XML
            return entry;
        },
        extractETagFromEntry: function(entry) {
            return entry['etag'];
        },
        readFeed: function(request, options) {
            if (this.batchScope)
            {
                this.batchScope.add( {
                    url: request.constructUrl(),
                    method: 'GET'
                });
                return;
            }

            var xhrOptions = {
                headers: {}
            };

            if (options.httpMethodOverride)
            {
                xhrOptions.headers['X-HTTP-Method-Override'] = 'GET';
                xhrOptions.method = 'POST';
                xhrOptions.data = request.constructUrl();
                xhrOptions.url = request.constructUrl(true); // exclude query
            }

            this.executeRequest(request, options, xhrOptions);
        },
        readEntry: function(request, options) {
            if (this.batchScope)
            {
                this.batchScope.add( {
                    url: request.constructUrl(),
                    method: 'GET'
                });
                return;
            }

            var xhrOptions = {};

            this.executeRequest(request, options, xhrOptions);
        },
        createEntry: function(request, entry, options) {
            if (this.batchScope)
            {
                this.batchScope.add( {
                    url: request.constructUrl(),
                    data: entry,
                    method: 'POST',
                    etag: this.extractETagFromEntry(entry)
                });
                return;
            }

            var xhrOptions = {
                method: 'POST',
                etag: this.extractETagFromEntry(entry),
                data: this.prepareEntry(entry)
            };

            this.executeRequest(request, options, xhrOptions);
        },
        updateEntry: function(request, entry, options) {
            if (this.batchScope)
            {
                this.batchScope.add( {
                    url: request.constructUrl(),
                    data: entry,
                    method: 'PUT',
                    etag: this.extractETagFromEntry(entry)
                });
                return;
            }

            var xhrOptions = {
                method: 'PUT',
                etag: this.extractETagFromEntry(entry),
                data: this.prepareEntry(entry)
            };

            this.executeRequest(request, options, xhrOptions);
        },
        deleteEntry: function(request, entry, options) {
            if (this.batchScope)
            {
                this.batchScope.add( {
                    url: request.constructUrl(),
                    method: 'DELETE',
                    etag: this.extractETagFromEntry(entry)
                });
                return;
            }

            var xhrOptions = {
                method: 'DELETE',
                etag: this.extractETagFromEntry(entry)
            };

            this.executeRequest(request, options, xhrOptions);
        },
        executeServiceOperation: function(request, entry, options) {
            var xhrOptions = {
                method: 'POST',
                data: this.prepareEntry(entry)
            };

            this.executeRequest(request, options, xhrOptions);
        },
        commitBatch: function(request, options) {
            // todo: implement batch

            var xhrOptions = {
                method: 'POST'
            };

            this.executeRequest(request, options, xhrOptions);
        }
    });
});