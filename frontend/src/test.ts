import { buffer } from "rxjs/operators/buffer";
import {getDiff, validateDiff} from './utils'


const tests = [
    ['some words seq', 'some other words seq'], // +6
    ['some words seq', 'some lol seq'], // -5 +3
    ['some words seq', 'some olohey seq'], // -5 +6
    ['some words seq', 'some seq'], // -5

    ['words seq', 'some words seq'], //+5 in start
    ['some words', 'some words seq'], //+4 in end

    ['some words seq', 'words seq'], //-4 in start
    ['some words seq', 'some words'], //-4 in end

    ['', 'some'], //
    ['some', ''], //
    ['some', 'some'], //
    ['', ''], //
    ['some', 'same'], //
    ['some', 'some'], //
]



// if (lenDiff > 0) {
//     newInd += lenDiff
// } else if (lenDiff < 0) {
//     baseInd += Math.abs(lenDiff)
// }

// function runTests() {
//     for (const [base, neww] of tests) {
//         const diff = getDiff(base, neww)
//         validateDiff(base, neww, diff)
//     }
// }
// runTests()