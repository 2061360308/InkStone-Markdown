<script setup lang="ts">
import { Ref, ref } from 'vue'
import { uploadTheme } from '@/utils/theme'
import { UploadRawFile } from 'element-plus'

const isIntroduce: Ref<string[]> = ref([])
const isMarket = ref(false)

const fileList = ref([])

const handleChange = async (rawFile: UploadRawFile) => {
  console.log(rawFile)
  const result = await uploadTheme(rawFile)

  console.log('上传结果', result)

  return false
}
</script>

<template>
  <div class="theme-panel">
    <div class="header">
      <div class="content">
        <div>主题管理</div>
        <svg
          t="1739888481650"
          class="icon"
          viewBox="0 0 1024 1024"
          version="1.1"
          xmlns="http://www.w3.org/2000/svg"
          p-id="9975"
          width="32"
          height="32"
        >
          <path
            d="M430.4 192A4340.48 4340.48 0 0 1 341.12 320h341.76a4332.8 4332.8 0 0 1-89.28-128z"
            fill="#FFE345"
            p-id="9976"
          ></path>
          <path
            d="M341.12 320c-33.664 46.592-65.28 90.88-88 128h517.76c-22.72-37.12-54.336-81.408-88-128z"
            fill="#80FF45"
            p-id="9977"
          ></path>
          <path
            d="M253.12 448c-26.496 43.264-45.76 83.712-54.72 128h627.2c-8.96-44.288-28.16-84.736-54.72-128h-517.76z"
            fill="#45FFA2"
            p-id="9978"
          ></path>
          <path
            d="M198.4 576a319.552 319.552 0 0 0 0.128 128h626.944a319.552 319.552 0 0 0 0.128-128H198.4z"
            fill="#45D7FF"
            p-id="9979"
          ></path>
          <path
            d="M198.528 704c9.792 47.616 31.36 90.624 59.84 128h507.264a316.928 316.928 0 0 0 59.904-128H198.464z"
            fill="#8045FF"
            p-id="9980"
          ></path>
          <path
            d="M258.368 832C317.44 909.312 409.472 960 512 960s194.624-50.688 253.632-128z"
            fill="#FF4596"
            p-id="9981"
          ></path>
          <path
            d="M512 64c-28.928 48.192-55.808 89.6-81.6 128h163.2C567.808 153.6 540.928 112.192 512 64z"
            fill="#FF4545"
            p-id="9982"
          ></path>
        </svg>
      </div>
      <div class="extra">
        <el-button type="text">主题市场</el-button>
      </div>
    </div>
    <el-collapse v-model="isIntroduce">
      <el-collapse-item title="关于主题" name="1"> </el-collapse-item>
    </el-collapse>
    <div v-if="isMarket"></div>
    <div v-else>
      <el-upload
        class="upload-demo"
        drag
        :auto-upload="true"
        v-model:file-list="fileList"
        :before-upload="handleChange"
      >
        <font-awesome-icon :icon="['fas', 'upload']" size="2xl" />
        <div class="el-upload__text">拖动文件到这里 或者 <em>点击上传</em></div>
        <template #tip>
          <div class="el-upload__tip">上传主题文件应该是以zip后缀结尾的压缩包</div>
        </template>
      </el-upload>
    </div>
  </div>
</template>

<style scoped lang="scss">
.theme-panel {
  padding: 0 20px;

  .header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 10px 0;

    .content {
      display: flex;
      align-items: center;
      gap: 10px;
      font-size: 18px;
      font-weight: bold;
    }

    .extra {
      display: flex;
      gap: 10px;
    }
  }
}
</style>
