// utils/shutdown.ts
import {unmuteAll} from './mute';
import {closeBrowser} from './stats-screenshot';
import {getClient} from '../discord/client';
import {logErrorToFile} from './logger';

let shutdownPromise: Promise<void> | null = null;

function errorMessage(error: unknown): string {
    return error instanceof Error ? error.stack ?? error.message : String(error);
}

async function runCleanup(name: string, cleanup: () => Promise<unknown> | unknown): Promise<void> {
    try {
        await cleanup();
    } catch (error) {
        const message = `Shutdown cleanup failed (${name}): ${errorMessage(error)}`;
        console.error(message);
        logErrorToFile(message);
    }
}

// Unmute everyone before exiting — otherwise players muted at shutdown
// stay server-muted in Discord with no bot left to unmute them.
async function performShutdown(): Promise<void> {
    await runCleanup('unmute Discord members', async () => {
        const result = await unmuteAll();
        if (!result.success) throw new Error(result.message ?? result.code);
    });
    await runCleanup('close browser', closeBrowser);
    await runCleanup('destroy Discord client', () => getClient().destroy());
    process.exit(0);
}

export function shutdownGracefully(): Promise<void> {
    shutdownPromise ??= performShutdown();
    return shutdownPromise;
}
