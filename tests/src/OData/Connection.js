define([
    "doh/runner",
    "argos/OData/Connection"
], function(
    doh,
    Connection
) {
    doh.register("argos-tests.src.OData.Connection", [
        {
            name: 'Create basic auth token',
            runTest: function() {
                var connection = new Connection({
                    userName: 'test',
                    password: 'test'
                });

                // base64 of Basic test:test

                doh.assertEqual('Basic dGVzdDp0ZXN0AAAA', connection.createBasicAuthToken());
            }
        },
        {
            name: 'Create request headers without credentials and without json',
            runTest: function() {
                var connection = new Connection({
                    userName: false,
                    json: false
                });

                var expectedHeaders = {
                    'X-Authorization-Mode': 'no-challenge'
                };

                doh.assertEqual(expectedHeaders, connection.createHeadersForRequest());
            }
        },
        {
            name: 'Create request headers with credentials and with json',
            runTest: function() {
                var connection = new Connection({
                    userName: 'test',
                    useCredentialRequest: true,
                    json: true
                });

                var expectedHeaders = {
                    'X-Authorization-Mode': 'no-challenge',
                    'Authorization': 'TOKEN',
                    'X-Authorization': 'TOKEN',
                    'Content-Type': 'application/json',
                    'Accept': 'application/json,*/*'
                };

                var spy = doh.spyOn(connection, 'createBasicAuthToken').andReturn('TOKEN');

                doh.assertEqual(expectedHeaders, connection.createHeadersForRequest());
                doh.assertWasCalled(spy);
            }
        },
        {
            name: 'Can process JSON from string to object',
            runTest: function() {
                var foo = '{"foo":{"bar":"test"}}';
                var expected = {
                    foo: {
                        bar: 'test'
                    }
                };

                doh.assertEqual(expected, foo);
            }
        }
    ]);
});