export default class Event<T = any> {
    constructor(private fn: (data: T) => void) { }

    public trigger(data: T) {
        try {
            this.fn(data);
        } catch (error) {
            throw new Error(`Error in event handler: ${error}`);
        }
    }

    public async timer(intervalMs: number, data: T) {
        await new Promise((resolve) => setTimeout(resolve, intervalMs));
        this.trigger(data);
    }
}