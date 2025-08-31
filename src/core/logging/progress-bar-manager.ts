import Progress from 'progress';

class ProgressBarManager {
	private activeBar: Progress;

	public render(current: number, total = 100, stepName?: string): void {
		if (this.activeBar) {
			this.activeBar.terminate();
		}

		this.activeBar = new Progress(`[:bar] :percent [:current/:total] - ${stepName ?? 'Running...'}`, {
			total,
			curr: current,
		});
		this.activeBar.render();
	}

	public refresh(): void {
		process.stdout.write(this.activeBar.lastDraw);
	}
}

export default ProgressBarManager;
