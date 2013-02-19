/**
 * _ODataDetail enables OData for the Detail view.
 *
 * Adds the OData store to the view and exposes the needed properties for creating a Entry request.
 *
 * @alternateClassName _ODataDetail
 * @requires OData
 */
define('argos/_ODataDetail', [
    'dojo/_base/declare',
    'dojo/string',
    'argos/utility',
    './Store/OData'
], function(
    declare,
    string,
    utility,
    OData
    ) {
    return declare('argos._ODataDetail', null, {
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
         * A list of child properties to be included in an OData request.
         */
        queryExpand: null,
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
        keyProperty: 'id',
        descriptorProperty: '$descriptor',

        //temp override while testing
        connectionName: 'crm-odin',

        createStore: function() {
            return new OData({
                service: this.getConnection(),
                resourceKind: this.resourceKind,
                resourceProperty: this.resourceProperty,
                resourcePredicate: this.resourcePredicate,
                expand: this.queryExpand,
                select: this.querySelect,
                identityProperty: this.keyProperty,
                scope: this
            });
        },
        _processItem: function(item) {
            return item.results;
        },
        formatRelatedQuery: function(entry, fmt, property) {
            property = property || 'id';
            return string.substitute(fmt, [utility.getValue(entry, property)]);
        },
        _buildGetExpression: function() {
            var options = this.options;

            return options && (options.id || options.key);
        },
        _applyStateToGetOptions: function(getOptions) {
            var options = this.options;
            if (options)
            {
                if (options.select) getOptions.select = options.select;
                if (options.expand) getOptions.expand = options.expand;
                if (options.contractName) getOptions.contractName = options.contractName;
                if (options.resourceKind) getOptions.resourceKind = options.resourceKind;
                if (options.resourceProperty) getOptions.resourceProperty = options.resourceProperty;
                if (options.resourcePredicate) getOptions.resourcePredicate = options.resourcePredicate;
            }
        }
    });
});