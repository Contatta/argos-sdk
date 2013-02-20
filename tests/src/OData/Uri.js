define([
    "doh/runner",
    "argos/OData/Uri"
], function(
    doh,
    Uri
) {
    doh.register("argos-tests.src.OData.Uri", [
        {
            name: 'Will parse url if given',
            runTest: function() {
                var uri = new Uri();

                uri.parseUrl('http://odin.contatta.vm/api/1/odata.svc');

                doh.assertEqual('http', uri.scheme);
                doh.assertEqual('odin.contatta.vm', uri.host);
                doh.assertEqual('api', uri.api);
                doh.assertEqual('1', uri.version);
                doh.assertEqual('odata.svc', uri.document);
            }
        }
 ]);
});