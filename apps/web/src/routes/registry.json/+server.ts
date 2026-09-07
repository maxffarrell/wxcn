import registry from '../../../registry.json';
import { json } from '@sveltejs/kit';

export function GET() {
	return json(registry);
}
