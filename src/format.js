/* Copyright (c) 2010, Sage Software, Inc. All rights reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

/**
 * Format is a singleton that provides various formatting functions.
 * @alternateClassName format
 * @requires convert
 * @singleton
 */
define('argos/format', [
    'dojo/_base/json',
    'dojo/_base/lang',
    'dojo/dom-construct',
    'dojo/string',
    'moment',
    './convert'
], function(
    json,
    lang,
    domConstruct,
    string,
    moment,
    convert
) {

    var getVectorMaxSize = function (v) {
        var w = 1,
            h = 1;
        for (var i = 0; i < v.length; i++)
        {
            for (var j = 0; j < v[i].length; j++)
            {
                if (w < v[i][j][0]) { w = v[i][j][0]; }
                if (h < v[i][j][1]) { h = v[i][j][1]; }
            }
        }
        // maybe should return bounding box? (x,y,w,h)
        return { width: w, height: h };
    };

    var phoneLettersMap = [
        {
            test: /[ABC]/gi,
            val: '2'
        },{
            test: /[DEF]/gi,
            val: '3'
        },{
            test: /[GHI]/gi,
            val: '4'
        },{
            test: /[JKL]/gi,
            val: '5'
        },{
            test: /[MNO]/gi,
            val: '6'
        },{
            test: /[PQRS]/gi,
            val: '7'
        },{
            test: /[TUV]/gi,
            val: '8'
        },{
            test: /[WXYZwyz]/g, // Note lowercase 'x' should stay for extensions
            val: '9'
        }
    ];


    function isEmpty(val) {
        if (typeof val !== 'string') return !val;

        return (val.length <= 0);
    }

    function encode(val) {
        if (typeof val !== 'string') return val;

        return val
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;');
    }

    function decode(val) {
        if (typeof val !== 'string') return val;

        return val
            .replace(/&amp;/g, '&')
            .replace(/&lt;/g, '<')
            .replace(/&gt;/g, '>')
            .replace(/&quot;/g, '"');
    }

    return lang.setObject('argos.format', {
        /**
         * @property {String}
         * Text used in {@link #yesNo yesNo} formatter for true values
         */
        yesText: 'Yes',
        /**
         * @property {String}
         * Text used in {@link #yesNo yesNo} formatter for false values
         */
        noText: 'No',
        /**
         * @property {String}
         * Text used in {@link #bool bool} formatter for true values
         */
        trueText: 'T',
        /**
         * @property {String}
         * Text used in {@link #bool bool} formatter for false values
         */
        falseText: 'F',
        /**
         * @property {String}
         * Text used in {@link #timespan timespan} formatter for more than one hour
         */
        hoursText: 'hours',
        /**
         * @property {String}
         * Text used in {@link #timespan timespan} formatter for exactly one hour
         */
        hourText: 'hour',
        /**
         * @property {String}
         * Text used in {@link #timespan timespan} formatter for more than one minute
         */
        minutesText: 'minutes',
        /**
         * @property {String}
         * Text used in {@link #timespan timespan} formatter for exactly one minute
         */
        minuteText: 'minute',
        shortDateFormatText: 'M/D/YYYY',

        /**
         * Takes a String and encodes `&`, `<`, `>`, `"` to HTML entities
         * @param {String} String to encode
         * @return {String} Html encoded string
         */
        encode: encode,
        /**
         * Takes a String and decodes `&`, `<`, `>`, `"` from HTML entities back to the character
         * @param {String} String to decode
         * @return {String} Html decoded string
         */
        decode: decode,
        /**
         * Determines if the given item is an empty string or empty arry
         * @param {String/Array} Item to check if empty
         * @return {Boolean} If passed item is empty
         */
        isEmpty: isEmpty,
        /**
         * @property {Object[]}
         * Array of objects that have the keys `test` and `format` where `test` is a RegExp that
         * matches the phone grouping and `format` is the string format to be replaced.
         *
         * The RegExp may have capture groups but when you are defining the format strings use:
         *
         * * `${0}` - original value
         * * `${1}` - cleaned value
         * * `${2}` - entire match (against clean value)
         * * `${3..n}` - match groups (against clean value)
         *
         * The `clean value` is taking the inputted numbers/text and removing any non-number
         * and non-"x" and it replaces A-Z to their respective phone number character.
         *
         * The three default formatters are:
         * * `nnn-nnnn`
         * * `(nnn)-nnn-nnnn`
         * * `(nnn)-nnn-nnnxnnnn`
         *
         * If you plan to override this value make sure you include the default ones provided.
         *
         */
        phoneFormat: [{
            test: /^\+.*/,
            format: '${0}'
        },{
            test: /^(\d{3})(\d{3,4})$/,
            format: '${3}-${4}'
        },{
            test: /^(\d{3})(\d{3})(\d{2,4})$/, // 555 555 5555
            format: '(${3})-${4}-${5}'
        },{
            test: /^1(\d{3})(\d{3})(\d{4})$/, // 1 555 555 5555
            format: '1-${3}-${4}-${5}'
        },{
            test: /^(\d{3})(\d{3})(\d{2,4})([^0-9]{1,}.*)$/, // 555 555 5555x
            format: '(${3})-${4}-${5}${6}'
        },{
            test: /^1(\d{3})(\d{3})(\d{4})([^0-9]{1,}.*)$/, // 1 555 555 5555x
            format: '1-${3}-${4}-${5}${6}'
        },{
            test: /^(\d{11,})(.*)$/,
            format: '${1}'
        }],
        /**
         * Takes a url string and wraps it with an `<a>` element with `href=` pointing to the url.
         * @param {String} val Url string to be wrapped
         * @return {String} An `<a>` element as a string.
         */
        link: function(val) {
            if (typeof val !== 'string')
                return val;

            return string.substitute('<a target="_blank" href="http://${0}">${0}</a>', [val]);
        },
        /**
         * Takes an email string and wraps it with an `<a>` element with `href="mailto:"` pointing to the email.
         * @param {String} val Email string to be wrapped
         * @return {String} An `<a>` element as a string.
         */
        mail: function(val) {
            if (typeof val !== 'string')
                return val;

            return string.substitute('<a href="mailto:${0}">${0}</a>', [val]);
        },
        /**
         * Removes whitespace from from and end of string
         * @param {String} val String to be trimmed
         * @return {String} String without space on either end
         */
        trim: function(val) {
            return val.replace(/^\s+|\s+$/g,'');
        },
        /**
         * Takes a date and format string and returns the formatted date as a string.
         * @param {Date/String} val Date to be converted. If string is passed it is converted to a date using {@link convert#toDateFromString Converts toDateFromString}.
         * @param {String} fmt Format string following [datejs formatting](http://code.google.com/p/datejs/wiki/FormatSpecifiers).
         * @param {Boolean} utc If a date should be in UTC time set this flag to true to counter-act javascripts built-in timezone applier.
         * @return {String} Date formatted as a string.
         */
        date: function(val, fmt, utc) {
            var date = val instanceof Date
                ? val
                : convert.isDateString(val)
                    ? convert.toDateFromString(val)
                    : null;

            if (date)
            {
                date = moment(date);

                if (utc)
                    date.add('minutes', date.zone());

                return date.format(fmt || argos.format.shortDateFormatText);
            }

            return val;
        },
        /**
         * Takes a number and decimal place and floors the number to that place:
         *
         * `fixed(5.555, 0)` => `5`
         * `fixed(5.555, 2)` => `5.55`
         * `fixed(5.555, 5)` => `5.555`
         *
         * @param {Number/String} val The value will be `parseFloat` before operating.
         * @param {Number} d Number of decimals places to keep, defaults to 2 if not provided.
         * @return {Number} Fixed number.
         */
        fixed: function(val, d) {
            if (typeof d !== 'number')
                d = 2;

            var m = Math.pow(10, d),
                v = Math.floor(parseFloat(val) * m) / m;

            return v;
        },
        /**
         * Takes a decimal number, multiplies by 100 and adds the % sign.
         *
         * `perecent(0.35)` => `'35%'`
         * `percent(2)` => `'200%'`
         *
         * @param {Number/String} val The value will be `parseFloat` before operating.
         * @return {String} Number as a percentage with % sign.
         */
        percent: function(val) {
            var intVal = Math.floor(100 * (parseFloat(val) || 0));
            return intVal + "%";
        },
        /**
         * Takes a boolean value and returns the string Yes or No for true or false
         * @param {Boolean/String} val If string it tests if the string is `true` for true, else assumes false
         * @return {String} Yes for true, No for false.
         */
        yesNo: function(val) {
            if (typeof val === 'string') val = /^true$/i.test(val);

            return val
                ? argos.format.yesText || 'Yes'
                : argos.format.noText || 'No';
        },
        /**
         * Takes a boolean value and returns the string T or F for true or false
         * @param {Boolean/String} val If string it tests if the string is `true` for true, else assumes false
         * @return {String} T for true, F for false.
         */
        bool: function(val) {
            if (typeof val === 'string') val = /^true$/i.test(val);

            return val
                ? argos.format.trueText || 'T'
                : argos.format.falseText || 'F';
        },
        /**
         * Takes a string and converts all new lines `\n` to HTML `<br>` elements.
         * @param {String} val String with newlines
         * @return {String} String with replaced `\n` with `<br>`
         */
        nl2br: function(val) {
            if (typeof val !== 'string') return val;

            return val.replace(/\n/g, '<br />');
        },
        /**
         * Takes a number of minutes and turns it into the string: `'n hours m minutes'`
         * @param {Number/String} val Number of minutes, will be `parseFloat` before operations and fixed to 2 decimal places
         * @return {String} A string representation of the minutes as `'n hours m minutes'`
         */
        timespan: function(val) {
            var v = argos.format.fixed(val);
            if (isNaN(v) || !v) return '';

            var hrs = Math.floor(v / 60);
            var mins  = v % 60;

            if (hrs)
                hrs = hrs > 1 ? string.substitute('${0} ${1}', [hrs, (argos.format.hoursText || 'hours')])
                              : string.substitute('${0} ${1}', [hrs, (argos.format.hourText || 'hour')]);
            if (mins)
                mins = mins > 1 ? string.substitute('${0} ${1}', [mins, (argos.format.minutesText || 'minutes')])
                                : string.substitute('${0} ${1}', [mins, (argos.format.minuteText || 'minute')]);

            return (hrs && mins) ? hrs +" "+ mins
                                 : hrs === 0 ? mins : hrs;
        },
        /**
         * Takes a 2D array of `[[x,y],[x,y]]` number coordinates and draws them onto the provided canvas
         * The first point marks where the "pen" starts, each sequential point is then "drawn to" as if holding a
         * pen on paper and moving the pen to the new point.
         * @param {Number[][]} vector A series of x,y coordinates in the format of: `[[0,0],[1,5]]`
         * @param {HTMLElement} canvas The `<canvas>` element to be drawn on
         * @param {Object} options Canvas options: scale, lineWidth and penColor.
         */
        canvasDraw: function (vector, canvas, options) {
            var scale, x, y,
                context = canvas.getContext('2d');

            // Paint canvas white vs. clearing as on Android imageFromVector alpha pixels blacken
            // context.clearRect(0, 0, context.canvas.width, context.canvas.height);
            context.fillStyle = 'rgb(255,255,255)';
            context.fillRect (0, 0, context.canvas.width, context.canvas.height);

            scale               = options && options.scale     ? options.scale     : 1;
            context.lineWidth   = options && options.lineWidth ? options.lineWidth : 1;
            context.strokeStyle = options && options.penColor  ? options.penColor  : 'black';

            for (var trace in vector) {
                if ( 1 < vector[trace].length) {
                    context.beginPath();
                    context.moveTo(vector[trace][0][0] * scale, vector[trace][0][1] * scale);
                    for (var i = 1; i < vector[trace].length; i++) {
                        x = vector[trace][i][0] * scale;
                        y = vector[trace][i][1] * scale;
                        context.lineTo(x, y);
                    }
                    context.stroke();
                }
            }
        },
        /**
         * Returns the image data (or img element) for a series of vectors
         * @param {Number[][]} vector A series of x,y coordinates in the format of: `[[0,0],[1,5]]`. These will be drawn sequentially as one line.
         * @param {Object} options Canvas options: scale, lineWidth and penColor.
         * @param {Boolean} html Flag for returning image as a data-uri or as a stringified `<img>` element.
         * @return {String} The encoded data of the drawn image, optionally wrapped in `<img>` if html was passed as true
         */
        imageFromVector: function (vector, options, html) {
            var img,
                canvasNode = domConstruct.create('canvas');

            options = options || {};

            if (typeof vector == 'string' || vector instanceof String)
                try { vector = json.fromJson(vector); } catch(e) {}

            if (!(vector instanceof Array) || 0 == vector.length)
                vector = [[]]; // blank image.

            var size = getVectorMaxSize(vector);

            canvasNode.width  = options.width  || size.width;
            canvasNode.height = options.height || size.height;

            options.scale = Math.min(
                canvasNode.width  / size.width,
                canvasNode.height / size.height
            );

            argos.format.canvasDraw(vector, canvasNode, options);

            img = canvasNode.toDataURL('image/png');
            if (img.indexOf("data:image/png") != 0)
                img = Canvas2Image.saveAsBMP(canvasNode, true).src;

            return html
                ? string.substitute(
                    '<img src="${0}" width="${1}" height="${2}" alt="${3}" />',
                    [img, options.width, options.height, options.title || ''])
                : img;
        },
        /**
         * Takes a string phone input and attempts to match it against the predefined
         * phone formats - if a match is found it is returned formatted if not it is returned
         * as is.
         * @param val {String} String inputted phone number to format
         * @param asLink {Boolean} True to put the phone in an anchor element pointing to a tel: uri
         * @returns {String}
         */
        phone: function(val, asLink) {
            if (typeof val !== 'string')
                return val;

            val = argos.format.alphaToPhoneNumeric(val);

            var formatters = argos.format.phoneFormat,
                clean = /^\+/.test(val)
                    ? val
                    : val.replace(/[^0-9x]/ig, ''),
                formattedMatch;

            for (var i = 0; i < formatters.length; i++)
            {
                var formatter = formatters[i],
                    match;
                if ((match = formatter.test.exec(clean)))
                {
                    formattedMatch = string.substitute(formatter.format, [val, clean].concat(match));
                    break;
                }
            }

            if (formattedMatch)
                return asLink ? string.substitute('<a href="tel:${0}">${1}</a>', [clean, formattedMatch]) : formattedMatch;

            return val;
        },
        /**
         * Takes a string input and converts A-Z to their respective phone number character
         * `1800CALLME` -> `1800225563`
         * @param val
         * @returns {String}
         */
        alphaToPhoneNumeric: function(val) {
            for (var i = 0; i < phoneLettersMap.length; i++) {
                val = val.replace(phoneLettersMap[i].test, phoneLettersMap[i].val);
            }
            return val;
        }
    });
});