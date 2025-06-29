"use strict";
/**
 * Nobo is ruled by "Values", which are base level variable values, like say
 * the string "foo" or the number 1.5
 *
 * A "ValueSource" is an object that *owns* the value. It is able to produce the value on request
 * and is in charge of ensuring that value changes don't go unnoticed
 *
 * A "ValueSink" is an object that needs to read the value. Anything that could need to know the exact
 * value of the "Value" is a "ValueSink".
 *
 * Each "Value" in any one process has one "ValueSource", which may have any number of "ValueSinks"
 *
 * A core concept is that a value cannot change without all sinks being made aware that there was a change
 *  and being able to obtain the new value.
 * An example would be a database cell value would be associated with a "ValueSource". A DOM text node that
 * displays it would be associated with a "ValueSink"
 */
Object.defineProperty(exports, "__esModule", { value: true });
//# sourceMappingURL=value-sink.js.map