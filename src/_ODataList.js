/**
 * _ODataList enables OData for the List view.
 *
 * Adds the OData store to the view and exposes the needed properties for creating a Feed request.
 *
 * @alternateClassName _ODataList
 * @requires OData
 * @requires utility
 */
define('argos/_ODataList', [
    'dojo/_base/declare',
    './Store/OData',
    './utility'
], function(
    declare,
    OData,
    utility
    ) {
    return declare('argos._ODataList', null, {
        /**
         * @cfg {String} resourceKind
         * The OData resource kind the view is responsible for.  This will be used as the default resource kind
         * for all OData requests.
         */
        resourceKind: '',
        /**
         * @cfg {String[]}
         * A list of fields to be selected in an OData request.
         */
        querySelect: null,
        /**
         * @cfg {String[]?}
         * A list of related entities (1:M, 1:1) to be included in an OData request.
         */
        queryExpand: null,
        /**
         * @cfg {String}
         * The default order by expression for an OData request.
         */
        queryOrderBy: null,
        /**
         * @cfg {String/Function}
         * The default where expression for an OData request.
         */
        queryWhere: null,
        /**
         * @cfg {Object}
         * Key/value map of additional query arguments to add to the request.
         * Example:
         *     queryArgs: { _filter: 'Active' }
         *
         *     /OData/app/dynamic/-/resource?_filter=Active&where=""&format=json
         */
        queryArgs: null,
        /**
         * @cfg {String?/Function?}
         * The default resource property for an OData request.
         */
        resourceProperty: null,
        /**
         * @cfg {String?/Function?}
         * The default resource predicate for an OData request.
         */
        resourcePredicate: null,
        keyProperty: '$key',
        descriptorProperty: '$descriptor',

        //temp override while testing
        connectionName: 'crm-odin',

        createStore: function() {
            return new OData({
                service: this.getConnection(),
                contractName: this.contractName,
                dataSet: this.dataSet,
                resourceKind: this.resourceKind,
                resourceProperty: this.resourceProperty,
                resourcePredicate: this.resourcePredicate,
                expand: this.queryExpand,
                select: this.querySelect,
                where: this.queryWhere,
                queryArgs: this.queryArgs,
                orderBy: this.queryOrderBy,
                idProperty: this.keyProperty,
                scope: this
            });
        },
        _buildQueryExpression: function() {
            var options = this.options,
                passed = options && (options.query || options.where);

            return passed
                ? this.query
                ? '(' + utility.expand(this, passed) + ') and (' + this.query + ')'
                : '(' + utility.expand(this, passed) + ')'
                : this.query;
        },
        _applyStateToQueryOptions: function(queryOptions) {
            var options = this.options;
            if (options)
            {
                if (options.select) queryOptions.select = options.select;
                if (options.expand) queryOptions.expand = options.expand;
                if (options.orderBy) queryOptions.sort = options.orderBy;
                if (options.contractName) queryOptions.contractName = options.contractName;
                if (options.resourceKind) queryOptions.resourceKind = options.resourceKind;
                if (options.resourceProperty) queryOptions.resourceProperty = options.resourceProperty;
                if (options.resourcePredicate) queryOptions.resourcePredicate = options.resourcePredicate;
                if (options.queryArgs) queryOptions.queryArgs = options.queryArgs;
            }
        },
        formatSearchQuery: function(query) {
            return query;
        },
        formatHashTagQuery: function(query) {
            var layout = this.get('hashTags') || [],
                queries = [],
                additional = query;

            this.hashTagSearchRE.lastIndex = 0;

            var match;
            while (match = this.hashTagSearchRE.exec(query))
            {
                var tag = match[1],
                    expression = null;

                // todo: can optimize later if necessary
                for (var i = 0; i < layout.length && !expression; i++)
                {
                    if (layout[i].tag == tag) expression = layout[i].query;
                }

                if (!expression) continue;

                queries.push(this.expandExpression(expression));

                additional = additional.replace(match[0], '');
            }

            if (queries.length < 1) return this.formatSearchQuery(query);

            query = '(' + queries.join(') and (') + ')';

            additional = additional.replace(/^\s+|\s+$/g, '');

            if (additional)
            {
                query += ' and (' + this.formatSearchQuery(additional) + ')';
            }

            return query;
        },
        escapeSearchQuery: function(query) {
            return (query || '').replace(/"/g, '""');
        }
    });
});