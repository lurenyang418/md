<script setup lang="ts">
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { useDisplayStore } from '@/stores'
import { checkImage } from '@/utils'

import { UploadFilled } from '@element-plus/icons-vue'
import CodeMirror from 'codemirror'

import { ElMessage } from 'element-plus'
import { nextTick, onBeforeMount, ref, watch } from 'vue'

const emit = defineEmits([`uploadImage`])

const displayStore = useDisplayStore()

const formGitHub = ref({
  repo: ``,
  branch: ``,
  accessToken: ``,
})

const formQiniu = ref({
  accessKey: ``,
  secretKey: ``,
  bucket: ``,
  domain: ``,
  region: ``,
  path: ``,
})

const options = [
  {
    value: `default`,
    label: `默认`,
  },
  {
    value: `github`,
    label: `GitHub`,
  },
  {
    value: `qiniu`,
    label: `七牛云`,
  },
]

const imgHost = ref(`default`)

const formCustomElInput = ref<(HTMLInputElement & { $el: HTMLElement }) | null>(null)
const activeName = ref(`upload`)

watch(
  activeName,
  async (val) => {
    if (val === `formCustom`) {
      nextTick(() => {
        const textarea = formCustomElInput.value!.$el.querySelector(`textarea`)!
        formCustom.value.editor ||= CodeMirror.fromTextArea(textarea, {
          mode: `javascript`,
        })
        // formCustom.value.editor.setValue(formCustom.value.code)
      })
    }
  },
  {
    immediate: true,
  },
)

onBeforeMount(() => {
  if (localStorage.getItem(`githubConfig`)) {
    formGitHub.value = JSON.parse(localStorage.getItem(`githubConfig`)!)
  }
  if (localStorage.getItem(`qiniuConfig`)) {
    formQiniu.value = JSON.parse(localStorage.getItem(`qiniuConfig`)!)
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
  if (!(formGitHub.value.repo && formGitHub.value.accessToken)) {
    const blankElement = formGitHub.value.repo ? `token` : `GitHub 仓库`
    ElMessage.error(`参数「${blankElement}」不能为空`)
    return
  }

  localStorage.setItem(`githubConfig`, JSON.stringify(formGitHub.value))
  ElMessage.success(`保存成功`)
}

function saveQiniuConfiguration() {
  if (
    !(
      formQiniu.value.accessKey
      && formQiniu.value.secretKey
      && formQiniu.value.bucket
      && formQiniu.value.domain
    )
  ) {
    ElMessage.error(`七牛云 Kodo 参数配置不全`)
    return
  }
  localStorage.setItem(`qiniuConfig`, JSON.stringify(formQiniu.value))
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
  let imgHost = localStorage.getItem(`imgHost`)
  imgHost = imgHost || `default`
  localStorage.setItem(`imgHost`, imgHost)

  const config = localStorage.getItem(`\${imgHost}Config`)
  const isValidHost = imgHost === `default` || config
  if (!isValidHost) {
    ElMessage.error(`请先配置 \${imgHost} 图床参数`)
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
            <el-form-item label="GitHub 仓库" :required="true">
              <el-input
                v-model.trim="formGitHub.repo"
                placeholder="如：github.com/yanglbme/resource"
              />
            </el-form-item>
            <el-form-item label="分支">
              <el-input
                v-model.trim="formGitHub.branch"
                placeholder="如：release，可不填，默认 master"
              />
            </el-form-item>
            <el-form-item label="Token" :required="true">
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
        <el-tab-pane class="github-panel" label="七牛云 Kodo" name="qiniu">
          <el-form
            class="setting-form"
            :model="formQiniu"
            label-position="right"
            label-width="150px"
          >
            <el-form-item label="AccessKey" :required="true">
              <el-input
                v-model.trim="formQiniu.accessKey"
                placeholder="如：6DD3VaLJ_SQgOdoocsyTV_YWaDmdnL2n8EGx7kG"
              />
            </el-form-item>
            <el-form-item label="SecretKey" :required="true">
              <el-input
                v-model.trim="formQiniu.secretKey"
                show-password
                placeholder="如：qgZa5qrvDOOcsmdKStD1oCjZ9nB7MDvJUs_34SIm"
              />
            </el-form-item>
            <el-form-item label="Bucket" :required="true">
              <el-input v-model.trim="formQiniu.bucket" placeholder="如：md" />
            </el-form-item>
            <el-form-item label="Bucket 对应域名" :required="true">
              <el-input
                v-model.trim="formQiniu.domain"
                placeholder="如：https://images.123ylb.cn"
              />
            </el-form-item>
            <el-form-item label="存储区域" :required="false">
              <el-input v-model.trim="formQiniu.region" placeholder="如：z2，可不填" />
            </el-form-item>
            <el-form-item label="存储路径" :required="false">
              <el-input
                v-model.trim="formQiniu.path"
                placeholder="如：img，可不填，默认为根目录"
              />
              <el-link
                type="primary"
                href="https://developer.qiniu.com/kodo"
                target="_blank"
              >
                如何使用七牛云 Kodo？
              </el-link>
            </el-form-item>
            <el-form-item>
              <el-button type="primary" @click="saveQiniuConfiguration">
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
