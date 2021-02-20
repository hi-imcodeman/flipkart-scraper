import numeral from 'numeral'

export const sleep = async (ms: number): Promise<void> => {
    return new Promise(resolve => {
        setTimeout(() => {
            resolve()
        }, ms)
    })
}

export const durationFormatWithMs = (ms: number):string => `${numeral(ms / 1000).format('00:00:00')} ${ms % 1000}ms`