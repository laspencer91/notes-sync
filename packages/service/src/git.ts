import fs from 'fs';
import path from 'path';
import simpleGit, { SimpleGit } from 'simple-git';
import { Logger } from './logger';

function nowIso(): string {
  return new Date().toISOString();
}

export function isGitRepo(directoryPath: string): boolean {
  return fs.existsSync(path.join(directoryPath, '.git'));
}

export async function hasOriginRemote(git: SimpleGit): Promise<boolean> {
  const remotes = await git.getRemotes(true);
  const origin = remotes.find(r => r.name === 'origin');
  return Boolean(
    origin && origin.refs && (origin.refs.push || origin.refs.fetch)
  );
}

export function createGit(baseDir: string): SimpleGit {
  return simpleGit({ baseDir });
}

/**
 * Sync the repo with the remote.
 *
 * 1) Stage and commit local changes first to ensure clean working tree
 * 2) Fetch and rebase onto remote, with autostash as a safety net
 * 3) Push if we are ahead or after creating commits
 */
export async function safeSync(git: SimpleGit, reason: string): Promise<void> {
  try {
    Logger.log(`- [GIT] sync start (${reason})`);

    // 1) Stage and commit local changes first to ensure clean working tree
    let status = await git.status();
    if (status.files.length > 0) {
      await git.add(['-A']);
      status = await git.status();
      if (status.files.length > 0) {
        const msg = `notesync: ${nowIso()} (${status.files.length} changes)`;
        await git.commit(msg);
      }
    }

    // 2) Fetch and rebase onto remote, with autostash as a safety net
    await git.fetch();
    try {
      await git.pull(['--rebase', '--autostash']);
    } catch (pullErr: any) {
      Logger.error(
        `- [GIT] - pull --rebase --autostash failed: ${pullErr?.message || pullErr}`
      );
      // Best effort fallback: try a normal pull
      try {
        await git.pull();
      } catch (_) {}
    }

    // 3) Push if we are ahead or after creating commits
    try {
      await git.push();
      Logger.log(`- [GIT] push complete`);
    } catch (pushErr: any) {
      Logger.error(`- [GIT] push failed: ${pushErr?.message || pushErr}`);
    }
  } catch (err: any) {
    Logger.error(`- [GIT] sync error: ${err?.message || err}`);
  }
}
