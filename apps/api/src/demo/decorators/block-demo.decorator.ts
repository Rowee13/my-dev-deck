import { SetMetadata } from '@nestjs/common';

export const BLOCK_DEMO_KEY = 'blockDemo';
export const BlockDemo = () => SetMetadata(BLOCK_DEMO_KEY, true);
