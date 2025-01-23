import core = require('@actions/core');
import exec = require('@actions/exec');

const main = async () => {
    try {
        const ref = process.env.GITHUB_REF;
        if (!ref || !ref.startsWith('refs/tags/')) {
            throw new Error('This action can only be run on a tag.');
        }
        core.info('Updating pinned release versions...');
        const updateMajor = (core.getInput('update-major') || 'true') === 'true';
        core.debug(`updateMajor: ${updateMajor}`);
        const updateMinor = (core.getInput('update-minor') || 'true') === 'true';
        core.debug(`updateMinor: ${updateMinor}`);
        await exec.exec('git', ['config', 'user.name', 'github-actions[bot]']);
        await exec.exec('git', ['config', 'user.email', '41898282+github-actions[bot]@users.noreply.github.com']);
        await exec.exec('git', ['fetch', '--tags', '--force']);
        const tags = await getTags();
        if (tags.size === 0) {
            core.info('No tags found!');
            return;
        }
        const latestTag = [...tags.keys()].pop();
        core.debug(`latestTag: ${latestTag}`);
        const hasPrefix = latestTag.startsWith('v');
        const [major, minor] = latestTag.replace(/^v/, '').split('.');
        if (updateMajor) {
            const majorTag = hasPrefix ? `v${major}` : major;
            core.debug(`majorTag: ${majorTag}`);
            let majorSha: string | null = null;
            try {
                majorSha = await getParentSha(majorTag);
            } catch (error) {
                core.debug(`major version tag not found.`);
            }
            if (!majorSha) {
                await git(['tag', '-a', majorTag, '-m', 'create major release tag']);
                await git(['push', 'origin', majorTag, '--force']);
            } else if (tags.get(latestTag) !== majorSha) {
                await git(['tag', '-fa', majorTag, '-m', 'update major release tag']);
                await git(['push', 'origin', majorTag, '--force']);
            }
        }
        if (updateMinor && minor !== '0') {
            const minorTag = hasPrefix ? `v${major}.${minor}` : `${major}.${minor}`;
            core.debug(`minorTag: ${minorTag}`);
            let minorSha: string | null = null;
            try {
                minorSha = await getParentSha(minorTag);
            } catch (error) {
                core.debug(`minor version tag not found.`);
            }
            if (!minorSha) {
                await git(['tag', '-a', minorTag, '-m', 'create minor release tag']);
                await git(['push', 'origin', minorTag, '--force']);
            } else if (tags.get(latestTag) !== minorSha) {
                await git(['tag', '-fa', minorTag, '-m', 'update minor release tag']);
                await git(['push', 'origin', minorTag, '--force']);
            }
        }
    } catch (error) {
        core.setFailed(error);
    }
}

main();

/**
 * Get the list of valid SemVer tags and their parent sha
 * @returns Map of tags and their parent sha
 */
async function getTags(): Promise<Map<string, string>> {
    const semverRegex = /^v?\d+\.\d+\.\d+$/;
    const tags = (await git(['tag', '--list', `--sort=version:refname`])).split('\n').filter(tag => tag.trim() !== '').filter(tag => semverRegex.test(tag));
    const tagMap = new Map<string, string>();
    for (let i = 0; i < tags.length; i++) {
        const tag = tags[i];
        tagMap.set(tag, await getParentSha(tag));
    }
    return tagMap;
}

/**
 * Get the parent sha of a ref
 * @param ref Ref to get parent sha for
 * @returns Parent sha
 */
async function getParentSha(ref: string): Promise<string> {
    return (await git(['rev-parse', '--verify', `${ref}^{}`])).trim();
}

/**
 * Run a git command
 * @param params Git command parameters
 * @returns Git command output
 */
async function git(params: string[]): Promise<string> {
    let output: string = '';
    let error: string = '';
    await exec.exec('git', params, {
        listeners: {
            stdout: (data: Buffer) => {
                output += data.toString();
            },
            stderr: (data: Buffer) => {
                error += data.toString();
            }
        }
    });
    if (error) {
        throw new Error(error);
    }
    return output;
}
