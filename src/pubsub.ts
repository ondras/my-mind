type SubscribeFunction = (message: string, publisher: any, data?: any) => void;

interface SubscriberObject {
	handleMessage: SubscribeFunction;
}

type Subscriber = SubscriberObject | SubscribeFunction;

let subscribers = new Map<string, Subscriber[]>();

export function publish(message: string, publisher?: any, data?: any) {
	let subs = subscribers.get(message) || [];
	subs.forEach(sub => {
		if (typeof(sub) == "function") {
			sub(message, publisher, data);
		} else {
			sub.handleMessage(message, publisher, data);
		}
	});
}

export function subscribe(message: string, subscriber: Subscriber) {
	if (!subscribers.has(message)) {
		subscribers.set(message, []);
	}
	let subs = subscribers.get(message) || [];
	let index = subs.indexOf(subscriber);
	if (index == -1) { subs.push(subscriber); }
}

export function  unsubscribe(message: string, subscriber: Subscriber) {
	let subs = subscribers.get(message) || [];
	let index = subs.indexOf(subscriber);
	if (index > -1) { subs.splice(index, 1); }
}
