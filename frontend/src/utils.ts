



export interface Diff {
    start: number
    end: number
    text: string
} 

interface Ctx {

}

export function getDiff(base: string, neww: string, ctx?: Ctx): Diff | null {
    let lenDiff = neww.length - base.length

    let start = 0
    let end = 0
    let baseInd = 0
    let newInd = 0
    let text = ''
    let isDiff = false

    let buf = ''

    while (true) {
        if (baseInd === base.length && newInd === neww.length) {
            break
        }
        if (!isDiff && base[baseInd] !== neww[newInd]) { //cmp for undefined
            isDiff = true
        }
        if (isDiff) {

            if (lenDiff > 0) {
                lenDiff -= 1
                text += neww[newInd]
                newInd += 1
            } else if (lenDiff < 0) {
                lenDiff += 1
                baseInd += 1
                end += 1
            } else {
                if (base[baseInd] === neww[newInd]) {
                    buf += neww[newInd]
                } else {
                    if (buf.length>0) {
                        text += buf
                        end += buf.length
                        buf = ''
                    }
                    end += 1
                    text += neww[newInd]
                }
                newInd += 1
                baseInd += 1
            }
        } else {
            start += 1
            end += 1
            baseInd += 1
            newInd += 1
        }
    }

    if (start === end && text.length === 0) {
        return null
    }
    return { start, end, text }
}

export function replaceRange(s: string, start: number, end: number, substitute: string) {
    return s.substring(0, start) + substitute + s.substring(end);
}





export function validateDiff(base: string, neww: string, diff: Diff | null) {
    console.log(`base="${base}", new="${neww}", ${JSON.stringify(diff)}`)
    
    if (diff === null) {
        if (neww !== base) {
            throw new Error(`"${neww}", "${base}" should be the same`)            
        }
        return
    }
    const newwCalc = replaceRange(base, diff.start, diff.end, diff.text)
    if (newwCalc !== neww) {
        throw new Error(`"${newwCalc}" !== "${neww}", base="${base}"`)
    }
}