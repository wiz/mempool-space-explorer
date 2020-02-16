/* tslint:disable */
import { Pipe, PipeTransform } from '@angular/core';
import { isNumberFinite, isPositive, isInteger, toDecimal } from './utils';

export type ByteUnit = 'WU' | 'kWU' | 'MWU' | 'GWU' | 'TWU';

@Pipe({
    name: 'wuBytes'
})
export class WuBytesPipe implements PipeTransform {

    static formats: { [key: string]: { max: number, prev?: ByteUnit } } = {
        'WU': {max: 1000},
        'kWU': {max: Math.pow(1000, 2), prev: 'WU'},
        'MWU': {max: Math.pow(1000, 3), prev: 'kWU'},
        'GWU': {max: Math.pow(1000, 4), prev: 'MWU'},
        'TWU': {max: Number.MAX_SAFE_INTEGER, prev: 'GWU'}
    };

    transform(input: any, decimal: number = 0, from: ByteUnit = 'WU', to?: ByteUnit): any {

        if (!(isNumberFinite(input) &&
                isNumberFinite(decimal) &&
                isInteger(decimal) &&
                isPositive(decimal))) {
            return input;
        }

        let bytes = input;
        let unit = from;
        while (unit !== 'WU') {
            bytes *= 1024;
            unit = WuBytesPipe.formats[unit].prev!;
        }

        if (to) {
            const format = WuBytesPipe.formats[to];

            const result = toDecimal(WuBytesPipe.calculateResult(format, bytes), decimal);

            return WuBytesPipe.formatResult(result, to);
        }

        for (const key in WuBytesPipe.formats) {
            const format = WuBytesPipe.formats[key];
            if (bytes < format.max) {

                const result = toDecimal(WuBytesPipe.calculateResult(format, bytes), decimal);

                return WuBytesPipe.formatResult(result, key);
            }
        }
    }

    static formatResult(result: number, unit: string): string {
        return `${result} ${unit}`;
    }

    static calculateResult(format: { max: number, prev?: ByteUnit }, bytes: number) {
        const prev = format.prev ? WuBytesPipe.formats[format.prev] : undefined;
        return prev ? bytes / prev.max : bytes;
    }
}
