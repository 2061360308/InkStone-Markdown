import { graphql } from '@octokit/graphql'
import { githubAppId } from '@/config'

interface CheckResult {
  tokenValid: string | boolean
  repoValid: boolean
  hasPushAccess: boolean
  branchExists: boolean
}

export const checkGitHub = async (
  token: string,
  owner: string,
  repo: string,
  branch: string,
): Promise<CheckResult> => {
  const graphqlWithAuth = graphql.defaults({
    headers: {
      authorization: `token ${token}`,
    },
  })

  try {
    const { viewer, repository } = await graphqlWithAuth(
      `
      query($owner: String!, $repo: String!, $branch: String!) {
        viewer {
          login
        }
        repository(owner: $owner, name: $repo) {
          viewerPermission
          refs(refPrefix: "refs/heads/", first: 100) {
            nodes {
              name
            }
          }
        }
      }
    `,
      {
        owner,
        repo,
        branch,
      },
    )

    const branches = repository.refs.nodes
    const branchExists = branches.some((b: { name: string }) => b.name === branch)

    return {
      tokenValid: viewer.login,
      repoValid: true,
      hasPushAccess:
        repository.viewerPermission === 'WRITE' || repository.viewerPermission === 'ADMIN',
      branchExists,
    }
  } catch (error) {
    console.error('Error fetching data:', error)
    return {
      tokenValid: false,
      repoValid: false,
      hasPushAccess: false,
      branchExists: false,
    }
  }
}

export const checkInstalledApp = async (repo: string, token: string): Promise<boolean> => {
  const graphqlWithAuth = graphql.defaults({
    headers: {
      authorization: `token ${token}`,
    },
  })

  try {
    // 获取用户安装的所有 GitHub Apps
    const { viewer } = await graphqlWithAuth(`
      query {
        viewer {
          login
          installations(first: 100) {
            nodes {
              id
              app {
                id
              }
              repositorySelection
              repositories(first: 100) {
                nodes {
                  name
                }
              }
            }
          }
        }
      }
    `)

    // 遍历所有安装
    for (const installation of viewer.installations.nodes) {
      if (installation.app.id == githubAppId) {
        if (installation.repositorySelection === 'SELECTED') {
          // 选择安装还需要判断是否在选择的仓库中
          for (const repository of installation.repositories.nodes) {
            if (repository.name === repo) {
              return true
            }
          }
        } else {
          return true
        }
      }
    }

    return false
  } catch (error) {
    console.error('检查安装状态时出错:', error)
    return false
  }
}
