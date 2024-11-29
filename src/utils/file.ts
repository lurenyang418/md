import { githubConfig } from '@/config'
import fetch from '@/utils/fetch'

import { base64encode, safe64, utf16to8 } from '@/utils/tokenTools'
import CryptoJS from 'crypto-js'
import * as qiniu from 'qiniu-js'
import { v4 as uuidv4 } from 'uuid'

function getConfig(useDefault: boolean, platform: string) {
  if (useDefault) {
    // load default config file
    const config = githubConfig
    const { username, repoList, branch, accessTokenList } = config

    // choose random token from access_token list
    const tokenIndex = Math.floor(Math.random() * accessTokenList.length)
    const accessToken = accessTokenList[tokenIndex].replace(`doocsmd`, ``)

    // choose random repo from repo list
    const repoIndex = Math.floor(Math.random() * repoList.length)
    const repo = repoList[repoIndex]

    return { username, repo, branch, accessToken }
  }

  // load configuration from localStorage
  const customConfig = JSON.parse(localStorage.getItem(`${platform}Config`)!)

  // split username/repo
  const repoUrl = customConfig.repo
    .replace(`https://${platform}.com/`, ``)
    .replace(`http://${platform}.com/`, ``)
    .replace(`${platform}.com/`, ``)
    .split(`/`)
  return {
    username: repoUrl[0],
    repo: repoUrl[1],
    branch: customConfig.branch || `master`,
    accessToken: customConfig.accessToken,
  }
}

/**
 * 获取 "年/月/日" 形式的目录
 * @returns string
 */
function getDir() {
  const date = new Date()
  const year = date.getFullYear()
  const month = (date.getMonth() + 1).toString().padStart(2, `0`)
  const day = date.getDate().toString().padStart(2, `0`)
  return `${year}/${month}/${day}`
}

/**
 * 根据文件名获取它以 "时间戳+uuid" 的形式
 * @param {string} filename 文件名
 * @returns {string} "时间戳+uuid"
 */
function getDateFilename(filename: string) {
  const currentTimestamp = new Date().getTime()
  const fileSuffix = filename.split(`.`)[1]
  return `${currentTimestamp}-${uuidv4()}.${fileSuffix}`
}

// -----------------------------------------------------------------------
// GitHub File Upload
// -----------------------------------------------------------------------

async function ghFileUpload(content: string, filename: string) {
  const useDefault = localStorage.getItem(`imgHost`) === `default`
  const { username, repo, branch, accessToken } = getConfig(
    useDefault,
    `github`,
  )

  const dir = getDir()
  const url = `https://api.github.com/repos/${username}/${repo}/contents/${dir}/`
  const dateFilename = getDateFilename(filename)
  const res = await fetch<{ content: {
    download_url: string
  } }, {
      content: {
        download_url: string
      }
      data?: {
        content: {
          download_url: string
        }
      }
    }>({
    url: url + dateFilename,
    method: `put`,
    headers: {
      Authorization: `token ${accessToken}`,
    },
    data: {
      content,
      branch,
      message: `Upload by ${window.location.href}`,
    },
  })
  const githubResourceUrl = `raw.githubusercontent.com/${username}/${repo}/${branch}/`
  const cdnResourceUrl = `fastly.jsdelivr.net/gh/${username}/${repo}@${branch}/`
  res.content = res.data?.content || res.content
  return useDefault
    ? res.content.download_url.replace(githubResourceUrl, cdnResourceUrl)
    : res.content.download_url
}

// -----------------------------------------------------------------------
// Qiniu File Upload
// -----------------------------------------------------------------------

function getQiniuToken(accessKey: string, secretKey: string, putPolicy: {
  scope: string
  deadline: number
}) {
  const policy = JSON.stringify(putPolicy)
  const encoded = base64encode(utf16to8(policy))
  const hash = CryptoJS.HmacSHA1(encoded, secretKey)
  const encodedSigned = hash.toString(CryptoJS.enc.Base64)
  return `${accessKey}:${safe64(encodedSigned)}:${encoded}`
}

async function qiniuUpload(file: File) {
  const { accessKey, secretKey, bucket, region, path, domain } = JSON.parse(
    localStorage.getItem(`qiniuConfig`)!,
  )
  const token = getQiniuToken(accessKey, secretKey, {
    scope: bucket,
    deadline: Math.trunc(new Date().getTime() / 1000) + 3600,
  })
  const dir = path ? `${path}/` : ``
  const dateFilename = dir + getDateFilename(file.name)
  const observable = qiniu.upload(file, dateFilename, token, {}, { region })
  return new Promise<string>((resolve, reject) => {
    observable.subscribe({
      next: (result) => {
        console.log(result)
      },
      error: (err) => {
        reject(err.message)
      },
      complete: (result) => {
        resolve(`${domain}/${result.key}`)
      },
    })
  })
}

function fileUpload(content: string, file: File) {
  const imgHost = localStorage.getItem(`imgHost`)
  if (!imgHost) {
    localStorage.setItem(`imgHost`, `default`)
  }
  switch (imgHost) {
    case `qiniu`:
      return qiniuUpload(file)
    case `github`:
      return ghFileUpload(content, file.name)
    default:
      // return file.size / 1024 < 1024
      //     ? giteeUpload(content, file.name)
      //     : ghFileUpload(content, file.name);
      return ghFileUpload(content, file.name)
  }
}

export default {
  fileUpload,
}
