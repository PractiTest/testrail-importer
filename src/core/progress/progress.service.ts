import { Injectable, Scope } from '@nestjs/common';

@Injectable({ scope: Scope.TRANSIENT })
export class ProgressService {
	private static step: string;
	private static progress: number;
	private static total: number;
	private static barVisible: boolean;
	private static loaderVisible: boolean;

	constructor() {
		ProgressService.step = 'Migrating...';
		ProgressService.progress = 0;
		ProgressService.total = 0;
		ProgressService.barVisible = false;
		ProgressService.loaderVisible = false;
	}

	public getBarVisible(): boolean {
		return ProgressService.barVisible;
	}

	public setBarVisible(visible: boolean): void {
		ProgressService.barVisible = visible;
	}

	public getLoaderVisible(): boolean {
		return ProgressService.loaderVisible;
	}

	public setLoaderVisible(visible: boolean): void {
		ProgressService.loaderVisible = visible;
	}

	public getStep(): string {
		return ProgressService.step;
	}

	public setStep(step: string): void {
		ProgressService.step = step;
	}

	public getProgress(): number {
		return ProgressService.progress;
	}

	public setProgress(progress: number): void {
		ProgressService.progress = progress;
	}

	public addProgress(progress: number): void {
		ProgressService.progress = ProgressService.progress + progress;
	}

	public resetProgress(): void {
		ProgressService.progress = 0;
	}

	public getTotal(): number {
		return ProgressService.total;
	}

	public setTotal(total: number): void {
		ProgressService.total = total;
	}

	public addTotal(total: number): void {
		ProgressService.total += total;
	}

	public resetTotal(): void {
		ProgressService.total = 0;
	}
}
