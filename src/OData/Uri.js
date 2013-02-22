/**
 * The ODataUri object is used in conjunction with ODataConnection and ODataRequest, it is the URL manager for
 * building and maintaining the various pieces that make up the full uri to a resource.
 * @alternateClassName ODataUri
 */
define('argos/OData/Uri', [
    'dojo/_base/declare',
    'dojo/_base/lang'
], function(
    declare,
    lang
) {

    // parseUri 1.2.2
    // (c) Steven Levithan <stevenlevithan.com>
    // MIT License
    var parseUri = function(str, o) {
        var	m   = o.parser[o.strictMode ? "strict" : "loose"].exec(str),
            uri = {},
            i   = 14;

        while (i--) uri[o.key[i]] = m[i] || "";

        uri[o.q.name] = {};
        uri[o.key[12]].replace(o.q.parser, function ($0, $1, $2) {
            if ($1) uri[o.q.name][$1] = $2;
        });

        return uri;
    };
    var parseUriOptions = {
        strictMode: false,
        key: ["source","scheme","authority","userInfo","user","password","host","port","relative","path","directory","file","query","anchor"],
        q:   {
            name:   "queryKey",
            parser: /(?:^|&)([^&=]*)=?([^&]*)/g
        },
        parser: {
            strict: /^(?:([^:\/?#]+):)?(?:\/\/((?:(([^:@]*)(?::([^:@]*))?)?@)?([^:\/?#]*)(?::(\d*))?))?((((?:[^?#\/]*\/)*)([^?#]*))(?:\?([^#]*))?(?:#(.*))?)/,
            loose:  /^(?:(?![^:@]+:[^:@\/]*@)([^:\/?#.]+):)?(?:\/\/)?((?:(([^:@]*)(?::([^:@]*))?)?@)?([^:\/?#]*)(?::(\d*))?)(((\/(?:[^?#](?![^?#\/]*\.[^?#\/.]+(?:[?#]|$)))*\/?)?([^?#\/]*))(?:\?([^#]*))?(?:#(.*))?)/
        }
    };

    return declare('argos.OData.Uri', [], {
        /**
         * {String} The front of the url: `http`, `https`
         */
        scheme: 'https',

        /**
         * {String} Domain/subdomain: `example.com`, `my.site.net`
         */
        host: null,

        /**
         * {Number} Optional. If provided will be appended to host, `example.com:4040`
         */
        port: null,

        /**
         * {String} The first directory, in odata this is the api and is often just `ap`.
         */
        api: 'api',

        /**
         * {Number|String} Second directory this translates to the what version of the api it is using, `api/1`, `api/5`
         */
        version: null,

        /**
         * {String} Third and last root directory, describes what odata doc, typically `odata.svc`
         */
        document: null,

        /**
         * {Object} Object map of key/values that will be set as the url parameters after the `?`.
         *
         *     uri.queryOptions = { foo: 'bar', test: 'pass'};
         *     // gets constructed as ?foo=bar&test=pass
         *
         */
        queryOptions: null,

        /**
         * {Object[]} Array of path segment objects. A path segment has up to two parts:
         *
         * * Just Text
         *
         *     var segment = { text: 'foo' };
         *     // will be set as /foo
         *
         * * Text and Predicate
         *
         *     var segment = { text: 'foo', predicate: 'id=bar' };
         *     // will be set as /foo(id=bar)
         *
         * Note that path segments will be constructed in the order they appear in the array. The one notable
         * exception/warning is that setting resourceKind/resourcePredicate will always override index 0.
         *
         */
        pathSegments: null,

        /**
         * {Number} Index that resourceKind/resourcePredicate overwrite within the `pathSegments` array.
         */
        resourceKindIndex: 0,

        /**
         * Extends constructor to not only mixin passed options but if `options.url` is passed it will be
         * split apart, parsed and applied to the Uri.
         * @param {Object} urlOptions
         */
        constructor: function(urlOptions) {
            this.queryOptions = {};
            this.pathSegments = [];

            lang.mixin(this, urlOptions);
            if (this.url)
                this.parseUrl();
        },

        /**
         * Takes a string url (or uses this.url) and splits it up into the respective pieces and
         * sets them on the Uri: port, schema, version, host, etc
         * @param {String} url Optional. Url string to split and set
         */
        parseUrl: function(url) {
            var parsed = parseUri(url || this.url, parseUriOptions);
            if (parsed)
            {
                if (parsed.scheme)
                    this.setScheme(parsed.scheme);
                if (parsed.host)
                    this.setHost(parsed.host);
                if (parsed.port)
                    this.setPort(parseInt(parsed.port, 10));
                if (parsed.file)
                    this.setDocument(parsed.file);

                if (parsed.directory)
                {
                    var trimmed = parsed.directory.replace(/^\/|\/$/g, ''),
                        dirs = trimmed.split('/');
                    if (dirs[0])
                        this.setApi(dirs[0]);
                    if (dirs[1])
                        this.setVersion(dirs[1]);
                }
            }
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

        /**
         * Sets a specific query parameter `?key=value&key=value` in the queryOptions object. Note that
         * each param/key must be unique or it will override the previous value.
         *
         * Example:
         *     var uri = new Uri({url: 'http://example.com/api/1/odata.svc');
         *
         *     // set resource kind
         *     uri.setResourceKind('myEntity');
         *     uri.constructUrl(); // now returns http://example.com/api/1/odata.svc/myEntity?
         *
         *     // set an option
         *     uri.setQueryOption('foo', 'bar');
         *     uri.constructUrl(); // now returns http://example.com/api/1/odata.svc/myEntity?foo=bar
         *
         *
         * @chainable
         * @param {String} key Left side of equal sign to be set
         * @param {String} value Right side of equal sign to be set
         */
        setQueryOption: function(key, value) {
            this.queryOptions[key] = value;
            return this;
        },

        /**
         * Similar to `setQueryOption` but takes an entire object of key/value pairs to be merged in or replace the
         * existing query options.
         * @chainable
         * @param {Object} values Object of key/value pairs to be set as query params, each key/value must be url ready
         * @param {Boolean} replace Optional. If true the passed values will completely replace the existing ones, else it will
         * merely merge them on top (overriding existing for duplicates).
         */
        setQueryOptions: function(values, replace) {
            this.queryOptions = replace ? values : lang.mixin(this.queryOptions, values);
            return this;
        },

        /**
         * Directly replaces the path segments with the provided array of segment objects (contains keys text/predicate)
         * @chainable
         * @param {Object[]} values Array of objects that have keys text/predicate
         */
        setPathSegments: function(values) {
            this.pathSegments = values;
            return this;
        },

        /**
         * Sets a single path segment directly given an index.
         *
         * The segment may be supplied with a single object as the value that contains the keys text/predicate or
         * separated out into two passed params, both strings.
         *
         * @chainable
         * @param {Number} i Index of path segment to set
         * @param {String|Object} value Object containing text/predicate keys whose values are strings. If a string is
         * provided then this is the equivalent of setting the text key.
         * @param {String} predicate If value is a non-object (string/null) then predicate will also be set at that index.
         */
        setPathSegment: function(i, value, predicate) {
            var segment = value;

            if (!lang.isObject(value))
            {
                segment = {};
                if (value) segment['text'] = value;
                if (predicate) segment['predicate'] = predicate;
            }
            this.pathSegments[i] = lang.mixin({}, this.pathSegments[i], segment);

            return this;
        },

        /**
         * Removes a given path segment by index. Path segments start after the base url and end before the `?`.
         * @chainable
         * @param {Number} i Index of path segment to remove
         */
        removePathSegment: function(i) {
            if (i < this.pathSegments.length)
                this.pathSegments.splice(i, 1);

            return this;
        },

        /**
         * Adds a path segment after the base URL and before the ? (see setQueryOption for after ?).
         *
         * Accepts 2 types of input:
         *
         * 1. string||null value, string||null predicate -- adds the given value/predicate to the end of the url
         * 2. object value -- adds the given object (that contains keys text and predicate) to the end of the url
         *
         * One caveat is that setResourceKind / setResourceSelector will always adjust the path segment at index 0.
         *
         *     var uri = new Uri({url: 'http://example.com/api/1/odata.svc');
         *
         *     // append segment
         *     uri.appendPathSegment({text: 'foo'});
         *     uri.constructUrl(); // returns http://example.com/api/1/odata.svc/foo?
         *
         *     // set resource kind
         *     uri.setResourceKind('myEntity');
         *     uri.constructUrl(); // now returns http://example.com/api/1/odata.svc/myEntity?
         *
         * Now if you reversed those operations, appendPath will append starting at the last position:
         *
         *     var uri = new Uri({url: 'http://example.com/api/1/odata.svc');
         *
         *     // set resource kind
         *     uri.setResourceKind('myEntity');
         *     uri.constructUrl(); // now returns http://example.com/api/1/odata.svc/myEntity?
         *
         *     // append  segment
         *     uri.appendPathSegment({text: 'foo'});
         *     uri.constructUrl(); // returns http://example.com/api/1/odata.svc/myEntity/foo?
         *
         * @param value
         * @param predicate
         */
        appendPathSegment: function(value, predicate) {
            var index = this.pathSegments.length;

            if (!lang.isArray(value))
            {
                this.setPathSegment(index, value, predicate);
                return;
            }

            for (var i = 0; i < value.length; i++)
            {
                this.setPathSegment(i + index, value[i]);
            }
        },

        /**
         * Similar to `appendPathSegment` except that this takes an array of path segment objects:
         *
         *     var segments = [
         *         { text: 'mail'},
         *         { text: 'box', predicate: 'name=sent'}
         *     ];
         *     uri.appendPathSegments(segments);
         *     uri.constructUrl();
         *     // outputs: serviceroot/mail/box(name=sent)
         *
         * @param {Object[]} segments Array of path segment objects (containing keys text and predicate)
         */
        appendPathSegments: function(segments) {
            var index = this.pathSegments.length;

            for (var i = 0; i < segments.length; i++)
            {
                this.setPathSegment(i + index, segments[i]);
            }
        },

        /**
         * Returns the segment at the given index, note that path segments are after the root URL and before the ?.
         * @param i
         * @return {*|Boolean}
         */
        getPathSegment: function(i) {
            return this.pathSegments[i] || false;
        },

        /**
         * Sets the resource kind, which is always the first path segment after the base url.
         *
         * Example
         *     var uri = new Uri({url: 'http://example.com/api/1/odata.svc');
         *
         *     // set resource kind
         *     uri.setResourceKind('myEntity');
         *     uri.constructUrl(); // now returns http://example.com/api/1/odata.svc/myEntity?
         *
         * @param kind
         * @return {*}
         */
        setResourceKind: function(kind) {
            this.setPathSegment(this.resourceKindIndex, kind);
            return this;
        },

        /**
         * Sets the resource kinds' predicate, since the resource kind is always the first path segment after the base
         * url this will modify that to have the `/resourceKind(id)`.
         *
         * Example:
         *
         *     var uri = new Uri({url: 'http://example.com/api/1/odata.svc');
         *
         *     // set resource kind
         *     uri.setResourceKind('myEntity');
         *     uri.constructUrl(); // now returns http://example.com/api/1/odata.svc/myEntity?
         *
         *     // set the resource selector/predicate
         *     uri.setResourcePredicate('id=3');
         *     uri.constructUrl(); // now returns http://example.com/api/1/odata.svc/myEntity(id=3)?
         *
         * @param id
         * @return {*}
         */
        setResourcePredicate: function(id) {
            this.setPathSegment(this.resourceKindIndex, false, id);
            return this;
        },

        /**
         * Constructs the URL, piecing together the:
         *
         * * serviceRoot (base URL)
         * * pathSegments (resourceKind, additional `/dirs/`)
         * * queryOptions (everything after the `?`)
         *
         * You may optionally exclude the query options so that it only returns everything up to the `?`
         *
         * @param {Boolean} excludeQuery Does not include any query options/params in the url
         * @return {String} Full URL string.
         */
        constructUrl: function(excludeQuery) {
            var serviceRoot = this.constructServiceRoot(),
                pathSegments = this.constructPathSegments(),
                queryOptions = this.constructQueryOptions(),
                base = serviceRoot + '/' + pathSegments;

            return (excludeQuery) ? base : base + queryOptions;
        },

        /**
         * Constructs the service root portion of the URL which is everything up to the OData document:
         *
         *     https://example.com/api/1/odata.svc /   path/seg/ments    ?     $format=json
         *     // [ ------ this function -------- ] [-- path segments --] [-- query options --]
         *
         * It combines the properties of this Uri object into:
         *
         *     scheme://host:port/api/version/odata.document
         *
         * @return {String} The service root url, no trailing `/`.
         */
        constructServiceRoot: function() {
            var url = [];

            url.push(this.scheme + ':/');
            url.push(this.port ? this.host + ':' + this.port : this.host);
            url.push(this.api);
            url.push(this.version);
            url.push(this.document);

            return url.join('/');
        },

        /**
         * Constructs the path segments, the in-between bits after the service root but before the query options/params.
         *
         *     https://example.com/api/1/odata.svc /   path/seg/ments   ?     $format=json
         *     // [ ------ service root -------- ] [-- this function --] [-- query options --]
         *
         * Each path segment is made up of an object that has the keys text or text/predicate:
         *
         *     var segment = {
         *         text: 'foo'
         *     };
         *     // turns into: serviceroot/foo?
         *
         *     var segment = {
         *         text: 'foo',
         *         predicate: 'id=10'
         *     };
         *     // turns into: serviceroot/foo(id=10)?
         *
         * @return {String} The path segment portion of the URL, no trailing `/` or `?`.
         */
        constructPathSegments: function() {
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

        /**
         * Constructs the query options or the params part of the url
         *
         *     https://example.com/api/1/odata.svc /   path/seg/ments   ?     $format=json
         *     // [ ------ service root -------- ] [-- path segments --] [-- this function --]
         *
         * The `queryOptions` property is an object that contains key/value pairs. Each key
         * will be set as the left side and the value as the right:
         *
         *     this.queryOptions = {
         *         foo: 'bar',
         *         test: 'success'
         *     };
         *     // turns into:
         *     // ?foo=bar&test=success
         *
         * Caveat is that both sides will be URIComponent encoded (% encoded).
         *
         * @return {String} The query options portion of the URL
         */
        constructQueryOptions: function() {
            var options = [];
            for (var option in this.queryOptions)
            {
                options.push(encodeURIComponent(option) + '=' + encodeURIComponent(this.queryOptions[option]));
            }
            return (options.length > 0) ? '?' + options.join('&') : false;
        }
    });
});