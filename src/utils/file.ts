import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import { v4 as uuidv4 } from 'uuid'

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
  return `${currentTimestamp}-${uuidv4().replace(/-/g, ``)}.${fileSuffix}`
}

// -----------------------------------------------------------------------
// GitHub File Upload
// -----------------------------------------------------------------------

async function ghFileUpload(content: string, filename: string) {
  const { username, repo, branch, accessToken } = JSON.parse(
    localStorage.getItem(`githubConfig`)!,
  )
  const dir = getDir()
  const url = `https://api.github.com/repos/${username}/${repo}/contents/${dir}/`
  const dateFilename = getDateFilename(filename)
  const res = await fetch(
    url + dateFilename,
    {
      method: `put`,
      headers: {
        Authorization: `token ${accessToken}`,
      },
      body: JSON.stringify({
        content,
        branch,
        message: `Upload by ${window.location.href}`,
      }),
    },
  ).then(res => res.json()).catch(err => console.log(err))
  return res.content.download_url
}

// -----------------------------------------------------------------------
// Cloudflare R2 File Upload
// -----------------------------------------------------------------------

async function r2Upload(file: File) {
  const { accountId, accessKey, secretKey, bucket, path, domain } = JSON.parse(
    localStorage.getItem(`r2Config`)!,
  )
  const dir = path ? `${path}/` : ``
  const dateFilename = dir + getDateFilename(file.name)
  const client = new S3Client({ region: `auto`, endpoint: `https://${accountId}.r2.cloudflarestorage.com`, credentials: { accessKeyId: accessKey, secretAccessKey: secretKey } })
  const signedUrl = await getSignedUrl(
    client,
    new PutObjectCommand({ Bucket: bucket, Key: dateFilename, ContentType: file.type }),
    { expiresIn: 300 },
  )
  await fetch(signedUrl, {
    method: `PUT`,
    headers: {
      'Content-Type': file.type,
    },
    body: file,
  }).catch((err) => { console.log(err, 3456) })
  return `${domain}/${dateFilename}`
}

function fileUpload(content: string, file: File) {
  const imgHost = localStorage.getItem(`imgHost`)
  if (!imgHost) {
    localStorage.setItem(`imgHost`, `default`)
  }
  switch (imgHost) {
    case `r2`:
      return r2Upload(file)
    default:
      return ghFileUpload(content, file.name)
  }
}

export default {
  fileUpload,
}
