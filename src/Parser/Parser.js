/**
 * Created by Iddo on 12/18/2016.
 */
"use strict";
const nearley = require("nearley"),
    grammer = require("./grammer"),
    peg = require("pegjs");


const WHITE_SPACES = [
    ' ',
    '\n',
    '\t'
];
function removeComments(str) {
    str = str.replace(/\/\*[\s\S]*?\*\/|([^\\:]|^)\/\/.*$/gm, '');;
    return str;
}
function removeWhiteSpaces(str) {
    str = str.replace("\n", "").replace("\t", "");
    return str.replace(/\s+(?=((\\[\\"]|[^\\"])*"(\\[\\"]|[^\\"])*")*(\\[\\"]|[^\\"])*$)/g, '');
}
module.exports.removeWhiteSpaces = removeWhiteSpaces;
module.exports.removeComments = removeComments;

module.exports.parse = (str) => {
    //Find and replace comments
    str = removeComments(str);
    //Find and replace spaces
    str = removeWhiteSpaces(str);

    return new Promise((resolve, reject) => {
        try {
            resolve(grammer.parse(str));

        } catch(e) {
            reject(e);
        }
    });
};