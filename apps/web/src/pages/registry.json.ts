import registry from '../../registry.json';
const json = Response.json;

export function GET() {
	return json(registry);
}
