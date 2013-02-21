define([
    "doh/runner",
    "argos/OData/Uri"
], function(
    doh,
    Uri
) {
    doh.register("argos-tests.src.OData.Uri", [
        {
            name: 'Can parse a string url into their respective portions of the base URL',
            runTest: function() {
                var uri = new Uri();

                uri.parseUrl('http://odin.contatta.vm/api/1/odata.svc');

                doh.assertEqual('http', uri.scheme);
                doh.assertEqual('odin.contatta.vm', uri.host);
                doh.assertEqual('api', uri.api);
                doh.assertEqual('1', uri.version);
                doh.assertEqual('odata.svc', uri.document);
            }
        },
        {
            name: 'Can set a single query option',
            runTest: function() {
                var uri = new Uri();
                uri.setQueryOption('foo', 'bar');

                doh.assertEqual(uri.queryOptions['foo'], 'bar');
            }
        },
        {
            name: 'Can set multiple query options by merging',
            runTest: function() {
                var uri = new Uri();
                uri.queryOptions = {
                    foo: 'bar',
                    test: 'failure'
                };

                var merge = {
                    test: 'success'
                };

                uri.setQueryOptions(merge, false);

                doh.assertEqual(uri.queryOptions['foo'], 'bar');
                doh.assertEqual(uri.queryOptions['test'], 'success');
            }
        },
        {
            name: 'Can set multiple query options by replacing (losing existing)',
            runTest: function() {
                var uri = new Uri();
                uri.queryOptions = {
                    foo: 'bar',
                    test: 'failure'
                };

                var replace = {
                    test: 'success'
                };

                uri.setQueryOptions(replace, true);

                doh.assertNotEqual(uri.queryOptions['foo'], 'bar'); // should return undefined
                doh.assertEqual(uri.queryOptions['test'], 'success');
            }
        },
        {
            name: 'Can set all path segments directly',
            runTest: function() {
                var uri = new Uri();

                var segments = [
                    {text: 'test'},
                    {text: 'foo', predicate: 'id=bar'}
                ];

                uri.setPathSegments(segments);

                doh.assertEqual(uri.pathSegments, segments);
            }
        },
        {
            name: 'Can set a path segment directly via index, just by string value',
            runTest: function() {
                var uri = new Uri();

                var expected = [{
                    text: 'foo'
                }];

                uri.setPathSegment(0, 'foo');

                doh.assertEqual(uri.pathSegments, expected);
            }
        },
        {
            name: 'Can set a path segment directly via index, with string value and predicate',
            runTest: function() {
                var uri = new Uri();

                var expected = [{
                    text: 'foo',
                    predicate: 'id=bar'
                }];

                uri.setPathSegment(0, 'foo', 'id=bar');

                doh.assertEqual(uri.pathSegments, expected);
            }
        },
        {
            name: 'Can set a path segment directly via index, with object',
            runTest: function() {
                var uri = new Uri();

                var expected = [{
                    text: 'foo'
                }];

                uri.setPathSegment(0, {text: 'foo'});

                doh.assertEqual(uri.pathSegments, expected);
            }
        },
        {
            name: 'Can remove a path segment via index',
            runTest: function() {
                var uri = new Uri();

                uri.pathSegments = [
                    {text: 'foo'},
                    {text: 'test', predicate: 'fail'},
                    {text: 'bar'}
                ];

                var expected = [
                    {text: 'foo'},
                    {text: 'bar'}
                ];

                uri.removePathSegment(1);

                doh.assertEqual(uri.pathSegments, expected);
            }
        }
 ]);
});