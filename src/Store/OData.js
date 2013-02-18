/**
 * OData is an extension of dojo.store that is tailored to handling OData parameters, requests,
 * and pre-handling the responses.
 * @alternateClassName OData
 * @requires convert
 * @requires utility
 */
define('argos/Store/OData', [
    'dojo/_base/declare',
    'dojo/_base/lang',
    'dojo/_base/array',
    'dojo/_base/Deferred',
    'dojo/store/util/QueryResults',
    'dojo/string',
    'dojo/_base/json',
    '../OData/CollectionRequest',
    '../convert',
    '../utility'
], function (
    declare,
    lang,
    array,
    Deferred,
    QueryResults,
    string,
    json,
    CollectionRequest,
    convert,
    utility
) {

    return declare('argos.Store.OData', null, {
        doDateConversion: false,

        /* todo: is this the appropriate name for the expansion scope? */
        scope: null,
        where: null,
        select: null,
        include: null,
        orderBy: null,
        service: null,
        request: null,
        queryName: null,
        queryArgs: null,
        entityName: null,
        contractName: null,
        dataSet: null,
        resourceKind: null,
        resourceProperty: null,
        resourcePredicate: null,
        applicationName: null,
        executeQueryAs: null,
        executeGetAs: null,

        itemsProperty: 'results',
        idProperty: 'id',
        entityProperty: 'type',
        versionProperty: 'etag',

        constructor: function(props) {
            lang.mixin(this, props);
        },
        _createEntryRequest: function(id, getOptions) {
            var request = utility.expand(this, getOptions.request || this.request);
            if (request)
            {
                request = request.clone();
            }
            else
            {
                id = id || utility.expand(this.scope || this, getOptions.resourcePredicate || this.resourcePredicate);

                var contractName = utility.expand(this.scope || this, getOptions.contractName || this.contractName),
                    dataSet = utility.expand(this.scope || this, getOptions.dataSet || this.dataSet),
                    resourceKind = utility.expand(this.scope || this, getOptions.resourceKind || this.resourceKind),
                    resourceProperty = utility.expand(this.scope || this, getOptions.resourceProperty || this.resourceProperty),
                    resourcePredicate = /\s+/.test(id) ? id : (id) ? string.substitute("'${0}'", [id]) : null;

                if (resourceProperty)
                {
                    request = new Sage.SData.Client.SDataResourcePropertyRequest(this.service)
                        .setResourceProperty(resourceProperty)
                        .setResourceSelector(resourcePredicate);
                }
                else
                {
                    request = new Sage.SData.Client.SDataSingleResourceRequest(this.service)
                        .setResourceSelector(resourcePredicate);
                }

                if (contractName) request.setContractName(contractName);
                if (dataSet) request.setDataSet(dataSet);
                if (resourceKind) request.setResourceKind(resourceKind);
            }

            var select = utility.expand(this.scope || this, getOptions.select || this.select),
                include = utility.expand(this.scope || this, getOptions.include || this.include);

            if (select && select.length > 0)
                request.setQueryOption('select', select.join(','));

            if (include && include.length > 0)
                request.setQueryOption('include', include.join(','));

            return request;
        },
        _createFeedRequest: function(query, queryOptions) {
            var request = utility.expand(this, queryOptions.request || this.request);
            if (request)
            {
                request = request.clone();
            }
            else
            {
                var queryName = utility.expand(this.scope || this, queryOptions.queryName || this.queryName),
                    resourceKind = utility.expand(this.scope || this, queryOptions.resourceKind || this.resourceKind),
                    resourceProperty = utility.expand(this.scope || this, queryOptions.resourceProperty || this.resourceProperty),
                    resourcePredicate = utility.expand(this.scope || this, queryOptions.resourcePredicate || this.resourcePredicate),
                    queryArgs = utility.expand(this.scope || this, queryOptions.queryArgs || this.queryArgs);

                if (queryName)
                {
                    //todo: implement
                }
                else if (resourceProperty)
                {
                    //todo: implement
                }
                else
                {
                    request = new CollectionRequest(this.service);
                }

console.log(request);
                if (resourceKind) request.uri.setResourceKind(resourceKind);
                if (queryArgs)
                    for (var arg in queryArgs) request.uri.setQueryOption(arg, queryArgs[arg]);
            }

            var select = utility.expand(this.scope || this, queryOptions.select || this.select),
                include = utility.expand(this.scope || this, queryOptions.include || this.include),
                orderBy = utility.expand(this.scope || this, queryOptions.sort || this.orderBy);

            var requestUri = request.uri;

            if (select && select.length > 0)
                requestUri.setQueryOption('$select', select.join(','));

            if (include && include.length > 0)
                requestUri.setQueryOption('$expand', include.join(','));

            if (orderBy)
            {
                if (typeof orderBy === 'string')
                {
                    requestUri.setQueryOption('$orderby', orderBy);
                }
                else if (orderBy.length > 0)
                {
                    requestUri.setQueryOption('$orderby', orderBy.join(','));
                }
            }

            var where = utility.expand(this.scope || this, this.where),
                query = utility.expand(this.scope || this, query),
                conditions = [];

            if (where)
                conditions.push(where);

            if (query)
                conditions.push(query);

            if (conditions.length > 0)
                requestUri.setQueryOption('$filter', '(' + conditions.join(') and (') + ')');

            /*
            if (typeof queryOptions.start !== 'undefined')
                request.setQueryOption(Sage.SData.Client.SDataUri.QueryArgNames.StartIndex, queryOptions.start + 1);

            if (typeof queryOptions.count !== 'undefined')
                request.setQueryOption(Sage.SData.Client.SDataUri.QueryArgNames.Count, queryOptions.count);
            */
            requestUri.setQueryOption('$inlinecount', 'allpages');

            return request;
        },
        _onRequestFeedSuccess: function(queryDeferred, feed) {
            console.log('**** FEED SUCCESS ****', arguments);
            if (feed)
            {
                var items = lang.getObject(this.itemsProperty, false, feed),
                    total = typeof feed['$totalResults'] === 'number' ? feed['$totalResults'] : -1;

                queryDeferred.total = total;
                queryDeferred.resolve(items);
            }
            else
            {
                var error = new Error('The feed result is invalid.');

                queryDeferred.reject(error);
            }
        },
        _onRequestEntrySuccess: function(deferred, entry) {
            if (entry)
            {
                deferred.resolve(this.doDateConversion ? this._handleDateConversion(entry) : entry);
            }
            else
            {
                var error = new Error('The entry result is invalid.');

                deferred.reject(error);
            }
        },
        _onRequestFailure: function(deferred, xhr, xhrOptions) {
            var error = new Error('An error occurred requesting: ' + xhrOptions.url);

            error.xhr = xhr;
            error.status = xhr.status;
            error.aborted = false;
            error.url = xhrOptions.url;

            deferred.reject(error);
        },
        _onRequestAbort: function(deferred, xhr, xhrOptions) {
            var error = new Error('An error occurred requesting: ' + xhrOptions.url);

            error.xhr = xhr;
            error.status = 0;
            error.responseText = null;
            error.aborted = true;

            deferred.reject(error);
        },
        _onCancel: function(handle) {
            this.store.abort(handle.value);
        },
        _handleDateConversion: function(entry) {
            for (var prop in entry)
            {
                if (convert.isDateString(entry[prop]))
                {
                    entry[prop] = convert.toDateFromString(entry[prop]);
                }
            }

            return entry;
        },
        _handleDateSerialization: function(entry) {
            for (var prop in entry)
            {
                if (entry[prop] instanceof Date)
                {
                    entry[prop] = this.service.isJsonEnabled()
                        ? convert.toJsonStringFromDate(entry[prop])
                        : convert.toIsoStringFromDate(entry[prop]);
                }
            }

            return entry;
        },
        get: function(id, /* odata only */ getOptions) {
            // summary:
            //		Retrieves an object by its identity
            // id: Number
            //		The identity to use to lookup the object
            // returns: Object
            //		The object in the store that matches the given id.

            var handle = {},
                deferred = new Deferred(lang.hitch(this, this._onCancel, handle)),
                request = this._createEntryRequest(id, getOptions || {});

            var method = this.executeGetAs
                ? request[this.executeGetAs]
                : request.read;

            handle.value = method.call(request, {
                success: lang.hitch(this, this._onRequestEntrySuccess, deferred),
                failure: lang.hitch(this, this._onRequestFailure, deferred),
                abort: lang.hitch(this, this._onRequestAbort, deferred)
            });

            return deferred;
        },
        getIdentity: function(object) {
            // summary:
            //		Returns an object's identity
            // object: Object
            //		The object to get the identity from
            // returns: String|Number

            return lang.getObject(this.idProperty, false, object);
        },
        getEntity: function(object) {
            return lang.getObject(this.entityProperty, false, object);
        },
        getVersion: function(object) {
            return lang.getObject(this.versionProperty, false, object);
        },
        put: function(object, putOptions) {
            // summary:
            //		Stores an object
            // object: Object
            //		The object to store.
            // directives: dojo.store.api.Store.PutDirectives?
            //		Additional directives for storing objects.
            // returns: Number|String

            putOptions = putOptions || {};

            var id = putOptions.id || this.getIdentity(object),
                entity = putOptions.entity || this.entityName,
                version = putOptions.version || this.getVersion(object),
                atom = !this.service.isJsonEnabled();

            if (id) object['$key'] = id;
            if (entity && atom) object['$name'] = entity;
            if (version) object['$etag'] = version;

            var handle = {},
                deferred = new Deferred(lang.hitch(this, this._onCancel, handle)),
                request = this._createEntryRequest(id, putOptions);

            var method = putOptions.overwrite
                ? request.update
                : request.create;

            handle.value = method.call(request, object, {
                success: lang.hitch(this, this._onTransmitEntrySuccess, deferred),
                failure: lang.hitch(this, this._onRequestFailure, deferred),
                abort: lang.hitch(this, this._onRequestAbort, deferred)
            });

            return deferred;
        },
        _onTransmitEntrySuccess: function(deferred, entry) {
            deferred.resolve(this.doDateConversion ? this._handleDateConversion(entry) : entry);
        },
        add: function(object, addOptions) {
            // summary:
            //		Creates an object, throws an error if the object already exists
            // object: Object
            //		The object to store.
            // directives: dojo.store.api.Store.PutDirectives?
            //		Additional directives for creating objects.
            // returns: Number|String
            addOptions = addOptions || {};
            addOptions.overwrite = false;

            return this.put(object, addOptions);
        },
        remove: function(id) {
            // summary:
            //		Deletes an object by its identity
            // id: Number
            //		The identity to use to delete the object

        },
        query: function(query, queryOptions) {
            // summary:
            //		Queries the store for objects. This does not alter the store, but returns a
            //		set of data from the store.
            // query: String|Object|Function
            //		The query to use for retrieving objects from the store.
            // options: dojo.store.api.Store.QueryOptions
            //		The optional arguments to apply to the resultset.
            // returns: dojo.store.api.Store.QueryResults
            //		The results of the query, extended with iterative methods.
            //
            // example:
            //		Given the following store:
            //
            //	...find all items where "prime" is true:
            //
            //	|	store.query({ prime: true }).forEach(function(object){
            //	|		// handle each object
            //	|	});

            var handle = {},
                queryDeferred = new Deferred(lang.hitch(this, this._onCancel, handle)),
                request = this._createFeedRequest(query, queryOptions || {});

            queryDeferred.total = -1;

            var method = this.executeQueryAs
                ? request[this.executeQueryAs]
                : request instanceof Sage.SData.Client.SDataResourcePropertyRequest
                ? request.readFeed
                : request.read;

            handle.value = method.call(request, {
                success: lang.hitch(this, this._onRequestFeedSuccess, queryDeferred),
                failure: lang.hitch(this, this._onRequestFailure, queryDeferred),
                abort: lang.hitch(this, this._onRequestAbort, queryDeferred),
                httpMethodOverride: queryOptions && queryOptions['httpMethodOverride']
            });

            return QueryResults(queryDeferred);
        },
        transaction: function() {
            // summary:
            //		Starts a new transaction.
            //		Note that a store user might not call transaction() prior to using put,
            //		delete, etc. in which case these operations effectively could be thought of
            //		as "auto-commit" style actions.
            // returns: dojo.store.api.Store.Transaction
            //		This represents the new current transaction.
        },
        getChildren: function(parent, options){
            // summary:
            //		Retrieves the children of an object.
            // parent: Object
            //		The object to find the children of.
            // options: dojo.store.api.Store.QueryOptions?
            //		Additional options to apply to the retrieval of the children.
            // returns: dojo.store.api.Store.QueryResults
            //		A result set of the children of the parent object.
        },
        getMetadata: function(object) {
            if (object)
            {
                return {
                    id: this.getIdentity(object),
                    entity: this.getEntity(object),
                    version: this.getVersion(object)
                };
            }

            return null;

            // summary:
            //		Returns any metadata about the object. This may include attribution,
            //		cache directives, history, or version information.
            // object: Object
            //		The object to return metadata for.
            // returns: Object
            //		An object containing metadata.
        }
    });
});
