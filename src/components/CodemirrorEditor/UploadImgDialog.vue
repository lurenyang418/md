<script setup lang="ts">
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { useDisplayStore } from '@/stores'
import { checkImage } from '@/utils'

import { UploadFilled } from '@element-plus/icons-vue'

import { ElMessage } from 'element-plus'
import { onBeforeMount, ref } from 'vue'

const emit = defineEmits([`uploadImage`])
const displayStore = useDisplayStore()

const formGitHub = ref({
  username: ``,
  repo: ``,
  branch: ``,
  accessToken: ``,
})

const formR2 = ref({
  accountId: ``,
  accessKey: ``,
  secretKey: ``,
  bucket: ``,
  domain: ``,
  region: ``,
  path: ``,
})

const options = [
  {
    value: `github`,
    label: `GitHub`,
  },
  {
    value: `r2`,
    label: `Cloudflare`,
  },
]

const imgHost = ref(`r2`)
const activeName = ref(`upload`)

onBeforeMount(() => {
  if (localStorage.getItem(`githubConfig`)) {
    formGitHub.value = JSON.parse(localStorage.getItem(`githubConfig`)!)
  }
  if (localStorage.getItem(`r2Config`)) {
    formR2.value = JSON.parse(localStorage.getItem(`r2Config`)!)
  }
  if (localStorage.getItem(`imgHost`)) {
    imgHost.value = localStorage.getItem(`imgHost`)!
  }
})

function changeImgHost() {
  localStorage.setItem(`imgHost`, imgHost.value)
  ElMessage.success(`已成功切换图床`)
}

function saveGitHubConfiguration() {
  if (
    !(
      formGitHub.value.username
      && formGitHub.value.repo
      && formGitHub.value.accessToken
    )
  ) {
    ElMessage.error(`Github 参数配置不全`)
    return
  }
  if (formGitHub.value.branch === ``) {
    formGitHub.value.branch = `main`
  }
  localStorage.setItem(`githubConfig`, JSON.stringify(formGitHub.value))
  ElMessage.success(`保存成功`)
}

function saveR2Configuration() {
  if (
    !(
      formR2.value.accountId
      && formR2.value.accessKey
      && formR2.value.secretKey
      && formR2.value.bucket
    )
  ) {
    ElMessage.error(`CloudFlare 参数配置不全`)
    return
  }
  localStorage.setItem(`r2Config`, JSON.stringify(formR2.value))
  ElMessage.success(`保存成功`)
}

function beforeImageUpload(file: File) {
  // check image
  const checkResult = checkImage(file)
  if (!checkResult.ok) {
    ElMessage.error(checkResult.msg)
    return false
  }
  // check image host
  const imgHost = localStorage.getItem(`imgHost`) as string
  localStorage.setItem(`imgHost`, imgHost)

  const config = localStorage.getItem(`${imgHost}Config`)
  const isValidHost = imgHost === `default` || config
  if (!isValidHost) {
    ElMessage.error(`请先配置 ${imgHost} 图床参数`)
    return false
  }
  return true
}

function uploadImage(params: { file: any }) {
  emit(`uploadImage`, params.file)
}
</script>

<template>
  <Dialog v-model:open="displayStore.isShowUploadImgDialog">
    <DialogContent class="max-w-max">
      <DialogHeader>
        <DialogTitle>本地上传</DialogTitle>
      </DialogHeader>

      <el-tabs v-model="activeName">
        <el-tab-pane class="upload-panel" label="选择上传" name="upload">
          <el-select
            v-model="imgHost"
            placeholder="请选择"
            size="small"
            @change="changeImgHost"
          >
            <el-option
              v-for="item in options"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </el-select>
          <el-upload
            drag
            multiple
            action=""
            :headers="{ 'Content-Type': 'multipart/form-data' }"
            :show-file-list="false"
            accept=".jpg, .jpeg, .png, .gif"
            name="file"
            :before-upload="beforeImageUpload"
            :http-request="uploadImage"
          >
            <el-icon class="el-icon--upload">
              <UploadFilled />
            </el-icon>
            <div class="el-upload__text">
              将图片拖到此处，或
              <em>点击上传</em>
            </div>
          </el-upload>
        </el-tab-pane>
        <el-tab-pane class="github-panel" label="GitHub 图床" name="github">
          <el-form
            class="setting-form"
            :model="formGitHub"
            label-position="right"
            label-width="150px"
          >
            <el-form-item label="用户名" :required="true">
              <el-input
                v-model.trim="formGitHub.username"
              />
            </el-form-item>
            <el-form-item label="仓库(repo)" :required="true">
              <el-input
                v-model.trim="formGitHub.repo"
              />
            </el-form-item>
            <el-form-item label="分支(branch)">
              <el-input
                v-model.trim="formGitHub.branch"
                placeholder="如：release，可不填，默认 main"
              />
            </el-form-item>
            <el-form-item label="Token(PAT)" :required="true">
              <el-input
                v-model.trim="formGitHub.accessToken"
                show-password
                placeholder="如：cc1d0c1426d0fd0902bd2d7184b14da61b8abc46"
              />
              <el-link
                type="primary"
                href="https://docs.github.com/en/github/authenticating-to-github/creating-a-personal-access-token"
                target="_blank"
              >
                如何获取 GitHub Token？
              </el-link>
            </el-form-item>
            <el-form-item>
              <el-button type="primary" @click="saveGitHubConfiguration">
                保存配置
              </el-button>
            </el-form-item>
          </el-form>
        </el-tab-pane>
        <el-tab-pane class="github-panel" label="CloudFlare R2" name="r2">
          <el-form
            class="setting-form"
            :model="formR2"
            label-position="right"
            label-width="150px"
          >
            <el-form-item label="AccountId" :required="true">
              <el-input
                v-model.trim="formR2.accountId"
                placeholder="选中 R2后，右上角账号详细信息"
              />
            </el-form-item>
            <el-form-item label="AccessKey" :required="true">
              <el-input
                v-model.trim="formR2.accessKey"
                placeholder="如：6DD3VaLJ_SQgOdoocsyTV_YWaDmdnL2n8EGx7kG"
              />
            </el-form-item>
            <el-form-item label="SecretKey" :required="true">
              <el-input
                v-model.trim="formR2.secretKey"
                show-password
                placeholder="如：qgZa5qrvDOOcsmdKStD1oCjZ9nB7MDvJUs_34SIm"
              />
            </el-form-item>
            <el-form-item label="Bucket" :required="true">
              <el-input v-model.trim="formR2.bucket" placeholder="如：md" />
            </el-form-item>
            <el-form-item label="Bucket 对应域名" :required="true">
              <el-input
                v-model.trim="formR2.domain"
                placeholder="如：https://images.123ylb.cn"
              />
            </el-form-item>
            <el-form-item label="存储区域" :required="false">
              <el-input v-model.trim="formR2.region" placeholder="如：z2，可不填" />
            </el-form-item>
            <el-form-item label="存储路径" :required="false">
              <el-input
                v-model.trim="formR2.path"
                placeholder="如：img，可不填，默认为根目录"
              />
              <el-link
                type="primary"
                href="https://developers.cloudflare.com/r2/examples/aws/aws-sdk-js-v3/"
                target="_blank"
              >
                如何使用Cloudflare R2？
              </el-link>
            </el-form-item>
            <el-form-item>
              <el-button type="primary" @click="saveR2Configuration">
                保存配置
              </el-button>
            </el-form-item>
          </el-form>
        </el-tab-pane>
      </el-tabs>
    </DialogContent>
  </Dialog>
</template>

<style lang="less" scoped>
:deep(.el-upload-dragger) {
  display: flex;
  flex-flow: column;
  justify-content: center;
  align-items: center;
  width: 500px;
  height: 360px;

  .el-icon-upload {
    margin-top: 0;
  }
}

:deep(.el-dialog__body) {
  padding-bottom: 50px;
}

.upload-panel {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  text-align: center;

  .el-select {
    align-self: flex-end;
    margin: 0 67.75px 20px;
    width: 100px;
  }
}

.github-panel {
  display: flex;
  justify-content: center;

  &.formCustom {
    width: 100%;
  }

  .formCustomElInput {
    :deep(.CodeMirror) {
      border: 1px solid #eee;
      height: 300px !important;
      font-family: 'Fira Mono', 'DejaVu Sans Mono', Menlo, Consolas, 'Liberation Mono', Monaco, 'Lucida Console',
        monospace !important;
      line-height: 20px;

      .CodeMirror-scroll {
        padding: 10px;
      }
    }
  }
}

.setting-form {
  width: 100%;

  .el-form-item {
    margin: 15px;
  }

  .el-form-item:last-child {
    text-align: right;
  }
}
</style>
