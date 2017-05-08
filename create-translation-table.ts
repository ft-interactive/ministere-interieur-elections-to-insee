/**
 * Create a translation table
 */

const insee = require('./data/insee-codes.json');
const gov   = require('./data/gov-codes.json');
const {compareTwoStrings: compare} = require('string-similarity');
const {remove} = require('diacritics');
const {writeFileSync} = require('fs');
const assert = require('assert');
const stringify = require('csv-stringify');

const unmatched0: string[] = [];
const unmatched1: string[] = [];
const unmatched2: string[] = [];
const unmatched3: string[] = [];
const unmatched4: string[] = [];
const lowDiceScore: Array<{
	inseeCode: string;
	inseeNameString: string;
	ministereInterieurNameString: string;
}> = [];

console.log(`Total, Ministère Interieur dataset: ${Object.keys(gov).length}`);
console.log(`Total, INSEE dataset: ${Object.keys(insee).length}`);

const govToInsee = Object.entries(gov).reduce((govCodes: any, [code, data]) => {
	const normalised = remove(data.comName).toUpperCase();

	// Strategy 0: Non renseigné (excluded from dataset as have no INSEE code)
	if (data.regName === 'Non renseigné') return govCodes;
	else unmatched0.push(code);

	// Strategy 1: straight 1:1 mapping
	if (insee.hasOwnProperty(code)) {
		govCodes[code] = insee[code].code;

		checkScore(insee[code].comName, normalised, code);

		return govCodes;
	} else {
		unmatched1.push(code);
	}

	// Strategy 2: remove first digit of departement code
	const newCode = String(data.depCode) + String(data.comCode.slice(1));
	if (insee.hasOwnProperty(newCode)) {
		govCodes[code] = insee[newCode].code;

		checkScore(insee[newCode].comName, normalised, code);

		return govCodes;
	} else {
		unmatched2.push(code);
	}

	let replaced = '';
	// Strategy 3: Handle metropolitan areas separately
	switch (data.depCode) {
		case '75': // Paris arrondisements
			/**
			 * Paris: 75056
			 * Paris 1er: 75056AR01
			 */
			replaced = data.depCode + data.comCode.replace('056AR', '1');
			if (insee.hasOwnProperty(replaced)) {
				govCodes[code] = replaced;

				checkScore(insee[replaced].comName, normalised, code);

				return govCodes;
			} else {
				unmatched3.push(code);
				return govCodes;
			}
		case '69': // Rhône
			replaced = data.depCode + data.comCode.replace('123AR0', '38');

			if (code === '69123') { // Lyon "Préfecture de région"
				govCodes[code] = '69381';

				return govCodes;
			} else if (insee.hasOwnProperty(replaced)) {

				govCodes[code] = replaced;

				checkScore(insee[replaced].comName, normalised, code);

				return govCodes;
			} else {
				unmatched3.push(code);
				return govCodes;
			}

		case '13': // Bouches-du-Rhône
			replaced = data.depCode + data.comCode.replace('055AR', '2');
			// CodDpt = 13
			// CodSubCom = 055AR01
			// Marseille 1er Arr = 13201
			if (code === '13055') { // Marseille "Préfecture de région"
				govCodes[code] = '13201';

				return govCodes;
			} else if (insee.hasOwnProperty(replaced)) {
				govCodes[code] = replaced;

				checkScore(insee[replaced].comName, normalised, code);

				return govCodes;
			} else if (data.comCode.match('SR')) { // Marseille secteurs have no INSEE code; discard.
				return govCodes;
			} else {
				unmatched3.push(code);
				return govCodes;
			}

		default:
			unmatched3.push(code);
	}

	// Strategy 4: Missing from the INSEE dataset I've used. Codes validate via insee.fr
	switch (code) {
		case '55138': // "Culey"
		case '76095': // "Bihorel"
		case '76601': // "Saint-Lucien"
			govCodes[code] = code;
			return govCodes;
		default:
			unmatched4.push(code);
	}

	return govCodes;
}, {});

function checkScore(_string1: string, string2: string, code: string) {
	const string1 = remove(_string1).toUpperCase();
	try {
		const dice = compare(string1, string2).toFixed(2);
		assert(
			dice > 0.4,
			`Low Dice coefficient (${dice}) for ${code} (${string1} vs ${string2})`
		);
	} catch (e) {
		console.log(e.message);
		lowDiceScore.push({
			inseeCode: code,
			inseeNameString: _string1,
			ministereInterieurNameString: string2,
		});
	}
}

console.log('------');
console.log(`Found in stage 0: ${Object.keys(gov).length - unmatched0.length}`);
console.log(`Found in stage 1: ${unmatched0.length - unmatched1.length}`);
console.log(`Found in stage 2: ${unmatched1.length - unmatched2.length}`);
console.log(`Found in stage 3: ${unmatched2.length - unmatched3.length}`);
console.log(`Found in stage 4: ${unmatched3.length - unmatched4.length}`);
console.log(`Remaining: ${unmatched4.length}`);
console.dir(unmatched4);

writeFileSync(`${__dirname}/government-to-insee.json`, JSON.stringify(govToInsee), {encoding: 'utf-8'});
writeFileSync(`${__dirname}/data/possibly-dubious-codes.json`, JSON.stringify(lowDiceScore), {encoding: 'utf-8'});

const tableEntries = Object.entries(govToInsee);
tableEntries.unshift(['ministere interieur', 'insee']);
stringify(tableEntries,
	{header: true}, (err: Error, data: string) => {
	writeFileSync(`${__dirname}/code-translation-table.csv`, data, {encoding: 'utf-8'});
	console.log('done!');
});

//////// TypeScript def stubs
declare module 'string-similarity';
declare module 'diacritics';
