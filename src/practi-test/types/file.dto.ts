import { Expose, Type } from 'class-transformer';

export class PTFile {
	@Expose({ name: 'content_encoded' })
	public contentEncoded: string; // base64 encoded files

	public filename: string;
}

export class PTFiles {
	@Type(() => PTFile)
	public data: PTFile[];
}
