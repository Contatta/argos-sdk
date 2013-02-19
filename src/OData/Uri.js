/**
 * @alternateClassName ODataUri
 */
define('argos/OData/Uri', [
    'dojo/_base/declare',
    'dojo/_base/lang'
], function(
    declare,
    lang
) {
    return declare('argos.OData.Uri', [], {
        scheme: 'https',
        host: null,
        port: null,
        api: 'api',
        version: null,
        document: null,

        queryOptions: null,
        pathSegments: null,

        resourceKindIndex: 0,

        constructor: function(urlOptions) {
            this.queryOptions = {};
            this.pathSegments = [];

            lang.mixin(this, urlOptions);
        },

        setScheme: function(value) {
            this.scheme = value;
            return this;
        },
        setHost: function(value) {
            this.host = value;
            return this;
        },
        setPort: function(value) {
            this.port = parseInt(value, 10);
            return this;
        },
        setApi: function(value) {
            this.api = value;
            return this;
        },
        setVersion: function(value) {
            this.version = value;
            return this;
        },
        setDocument: function(value) {
            this.document = value;
            return this;
        },
        setQueryOption: function(key, value) {
            this.queryOptions[key] = value;
            return this;
        },
        setQueryOptions: function(values, replace) {
            this.queryOptions = replace ? values : lang.mixin(this.queryOptions, values);
            return this;
        },
        setPathSegments: function(values) {
            this.pathSegments = values;
            return this;
        },
        setPathSegment: function(i, value, predicate) {
            var segment = value;

            if (typeof value !== 'object')
            {
                segment = {};
                if (value) segment['text'] = value;
                if (predicate) segment['predicate'] = predicate;
            }
            this.pathSegments[i] = lang.mixin({}, this.pathSegments[i], segment);

            return this;
        },
        removePathSegment: function(i) {
            if (i < this.pathSegments.length)
                this.pathSegments.splice(i, 1);

            return this;
        },
        appendPathSegment: function(value, predicate) {
            var index = this.pathSegments.length;

            this.setPathSegment(index, value, predicate);
        },
        getPathSegment: function(i) {
            return this.pathSegments[i] || false;
        },
        setResourceKind: function(kind) {
            this.setPathSegment(this.resourceKindIndex, kind);
            return this;
        },
        setResourceSelector: function(id) {
            this.setPathSegment(this.resourceKindIndex, false, id);
            return this;
        },
        build: function(excludeQuery) {
            var serviceRoot = this.buildServiceRoot(),
                pathSegments = this.buildPathSegments(),
                queryOptions = this.buildQueryOptions(),
                base = serviceRoot + '/' + pathSegments;

            return (excludeQuery) ? base : base + queryOptions;
        },
        buildServiceRoot: function() {
            var url = [];

            url.push(this.scheme + ':/');
            url.push(this.port ? this.host + ':' + this.port : this.host);
            url.push(this.api);
            url.push(this.version);
            url.push(this.document);

            return url.join('/');
        },
        buildPathSegments: function() {
            var url = [];
            for (var i = 0; i < this.pathSegments.length; i++)
            {
                var segment = this.pathSegments[i];
                if (segment && segment['text'])
                {
                    if (segment['predicate'])
                        url.push(encodeURIComponent(segment['text'] + '(' + segment['predicate'] + ')'));
                    else
                        url.push(encodeURIComponent(segment['text']));
                }
            }
            return url.join('/');
        },
        buildQueryOptions: function() {
            var options = [];
            for (var option in this.queryOptions)
            {
                options.push(encodeURIComponent(option) + '=' + encodeURIComponent(this.queryOptions[option]));
            }
            return (options.length > 0) ? '?' + options.join('&') : false;
        },
        getCount: function() {
            // todo: implement
            return -1;
        },
        setCount: function(i) {
            // todo: implement
            return this;
        },
        getStartIndex: function() {
            // todo: implement
            return -1;
        },
        setStartIndex: function(value) {
            // todo: implement
            return this;
        }



    });
});