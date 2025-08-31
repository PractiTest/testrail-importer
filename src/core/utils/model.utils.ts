import { instanceToPlain, plainToInstance, ClassTransformOptions, ClassConstructor } from 'class-transformer';

export function applyModelDecorators(
	cls: ClassConstructor<unknown>,
	plain: unknown | unknown[],
	options?: ClassTransformOptions,
): Record<string, any> {
	return instanceToPlain(plainToInstance(cls, plain, { ...options, ignoreDecorators: true }), {
		...options,
		ignoreDecorators: false,
	});
}
