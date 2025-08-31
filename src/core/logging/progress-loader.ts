import ora from 'ora';

/**
 * @obsolete using this class makes loading animation overflow with previously logged data.
 * Needs to be improved before using in production
 */
class ProgressLoader {
	private readonly loader: any;

	constructor() {
		this.loader = ora({
			text: 'Project migrating...',
			spinner: 'arrow',
			interval: 300,
			stream: process.stdout,
			hideCursor: false,
			discardStdin: false,
		});
	}

	public ensureStarted(status: string): void {
		this.loader.text = status;

		if (!this.loader.isSpinning) {
			this.loader.start();
		}
	}

	public ensureStopped(): void {
		if (this.loader?.isSpinning) {
			this.loader.stop();
		}
	}
}

export default ProgressLoader;
