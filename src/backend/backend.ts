
export default abstract class Backend {
	constructor(readonly id) { repo.set(id, this); }

	reset() {}
}

export let repo = new Map<string, Backend>();
