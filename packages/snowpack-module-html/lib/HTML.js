let { ...linkedom } = require('linkedom')

let parse = (code) => linkedom.parseHTML(code).document.childNodes

exports.parse = parse
