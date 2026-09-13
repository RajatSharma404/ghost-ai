import { auth } from "@clerk/nextjs/server"
import { NextResponse } from "next/server"
import { Octokit } from "@octokit/rest"

interface ExportFileItem {
  path: string
  content: string
}

interface GitHubExportPayload {
  token: string
  owner: string
  repo: string
  branch?: string
  commitMessage?: string
  files: ExportFileItem[]
}

export async function POST(req: Request) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = (await req.json()) as GitHubExportPayload
    const { token, owner, repo, branch, commitMessage, files } = body

    if (!token?.trim()) {
      return NextResponse.json(
        { error: "GitHub Personal Access Token is required." },
        { status: 400 }
      )
    }

    if (!owner?.trim() || !repo?.trim()) {
      return NextResponse.json(
        { error: "Repository owner and repository name are required." },
        { status: 400 }
      )
    }

    if (!Array.isArray(files) || files.length === 0) {
      return NextResponse.json(
        { error: "At least one file must be selected for export." },
        { status: 400 }
      )
    }

    const sanitizedOwner = owner.trim().replace(/^https?:\/\/github\.com\//, "").split("/")[0]
    const sanitizedRepo = repo.trim().replace(/^https?:\/\/github\.com\/[^/]+\//, "").replace(/\.git$/, "")

    const octokit = new Octokit({ auth: token.trim() })

    // 1. Verify repository access & get repository metadata
    let repoData: { default_branch: string }
    try {
      const res = await octokit.rest.repos.get({
        owner: sanitizedOwner,
        repo: sanitizedRepo,
      })
      repoData = res.data
    } catch (err: unknown) {
      const status = (err as { status?: number }).status
      if (status === 401) {
        return NextResponse.json(
          { error: "Invalid GitHub token. Please verify your Personal Access Token." },
          { status: 401 }
        )
      }
      if (status === 404) {
        return NextResponse.json(
          { error: `Repository "${sanitizedOwner}/${sanitizedRepo}" not found or token lacks access.` },
          { status: 404 }
        )
      }
      throw err
    }

    const targetBranch = branch?.trim() || repoData.default_branch || "main"

    // 2. Resolve branch reference or base commit
    let baseCommitSha: string
    let refExists = false

    try {
      const { data: refData } = await octokit.rest.git.getRef({
        owner: sanitizedOwner,
        repo: sanitizedRepo,
        ref: `heads/${targetBranch}`,
      })
      baseCommitSha = refData.object.sha
      refExists = true
    } catch {
      // Branch does not exist yet; branch off default branch
      const { data: defaultRefData } = await octokit.rest.git.getRef({
        owner: sanitizedOwner,
        repo: sanitizedRepo,
        ref: `heads/${repoData.default_branch}`,
      })
      baseCommitSha = defaultRefData.object.sha
      refExists = false
    }

    // 3. Fetch base commit to get tree SHA
    const { data: baseCommit } = await octokit.rest.git.getCommit({
      owner: sanitizedOwner,
      repo: sanitizedRepo,
      commit_sha: baseCommitSha,
    })
    const baseTreeSha = baseCommit.tree.sha

    // 4. Create blobs for each file
    const treeItems = await Promise.all(
      files.map(async (file) => {
        const { data: blob } = await octokit.rest.git.createBlob({
          owner: sanitizedOwner,
          repo: sanitizedRepo,
          content: file.content,
          encoding: "utf-8",
        })
        return {
          path: file.path,
          mode: "100644" as const,
          type: "blob" as const,
          sha: blob.sha,
        }
      })
    )

    // 5. Create new Git tree with the blobs
    const { data: newTree } = await octokit.rest.git.createTree({
      owner: sanitizedOwner,
      repo: sanitizedRepo,
      base_tree: baseTreeSha,
      tree: treeItems,
    })

    // 6. Create atomic commit
    const finalCommitMessage =
      commitMessage?.trim() ||
      `feat(infra): add architecture IaC manifests from Ghost AI (${files.length} files)`

    const { data: newCommit } = await octokit.rest.git.createCommit({
      owner: sanitizedOwner,
      repo: sanitizedRepo,
      message: finalCommitMessage,
      tree: newTree.sha,
      parents: [baseCommitSha],
    })

    // 7. Update or create branch reference
    if (refExists) {
      await octokit.rest.git.updateRef({
        owner: sanitizedOwner,
        repo: sanitizedRepo,
        ref: `heads/${targetBranch}`,
        sha: newCommit.sha,
      })
    } else {
      await octokit.rest.git.createRef({
        owner: sanitizedOwner,
        repo: sanitizedRepo,
        ref: `refs/heads/${targetBranch}`,
        sha: newCommit.sha,
      })
    }

    const commitUrl = `https://github.com/${sanitizedOwner}/${sanitizedRepo}/commit/${newCommit.sha}`
    const branchUrl = `https://github.com/${sanitizedOwner}/${sanitizedRepo}/tree/${targetBranch}`

    return NextResponse.json({
      success: true,
      commitSha: newCommit.sha,
      commitUrl,
      branchUrl,
      targetBranch,
      filesCommitted: files.length,
    })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "GitHub export failed."
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
