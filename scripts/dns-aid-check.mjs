import { readFile } from 'node:fs/promises';

const template = await readFile(new URL('../docs/dns-aid.zone.example', import.meta.url), 'utf8');
const documentation = await readFile(new URL('../docs/dns-aid.md', import.meta.url), 'utf8');

const failures = [];
const record = template.split('\n').find((line) => line.includes(' IN HTTPS '));

if (!record) failures.push('template must contain an HTTPS ServiceMode record');
if (!record?.includes(' HTTPS 1 '))
	failures.push('DNS-AID records must use ServiceMode priority 1 or greater');
if (!record?.includes('alpn=') || !record?.includes('port=')) {
	failures.push('DNS-AID records must declare alpn and port');
}
if (!record?.includes('mandatory="alpn,port"'))
	failures.push('alpn and port must be mandatory in the template');
if (
	!template.includes('<endpoint>.') ||
	!template.includes('<alpn>') ||
	!template.includes('<port>')
) {
	failures.push('the template must remain non-deployable until an operator supplies real values');
}
for (const term of ['DNSSEC', 'DS record', 'RRSIG', 'cannot', 'prove']) {
	if (!documentation.includes(term)) failures.push(`operator documentation must cover ${term}`);
}

if (failures.length) {
	console.error(failures.map((failure) => `DNS-AID check: ${failure}`).join('\n'));
	process.exitCode = 1;
} else {
	console.log('DNS-AID template and operator-evidence checks passed.');
}
