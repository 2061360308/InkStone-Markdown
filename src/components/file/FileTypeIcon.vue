<script setup lang="ts">
import { computed } from 'vue'
import { defineProps } from 'vue'

const props = defineProps({
  suffix: {
    type: String,
    required: true,
  },
})

const allowType = [
  'folder',
  'file-unknow',
  'draft',
  'post',
  'AE',
  'AI',
  'APK',
  'C',
  'CSS',
  'AVI',
  'BMP',
  'DOC',
  'HTML',
  'CPP',
  'C#',
  'DLL',
  'DOCX',
  'EXE',
  'GIF',
  'LIB',
  'EXCEL',
  'FLV',
  'JAVA',
  'JSON',
  'JPG',
  'PHP',
  'GO',
  'MP3',
  'MP4',
  'JAR',
  'MOV',
  'PY',
  'SVG',
  'TIFF',
  'RAR',
  'PNG',
  'RUST',
  'PSD',
  'PDF',
  'R',
  'ZIP',
  'SQL',
  'TXT',
  'JS',
  'XLS',
  'XLSX',
  'WOFF',
  'TTF',
  'FOLDER',
  'FILE-UNKNOW',
  'DRAFT',
  'POST',
  'AE',
  'AI',
  'APK',
  'C',
  'CSS',
  'AVI',
  'BMP',
  'DOC',
  'HTML',
  'CPP',
  'C#',
  'DLL',
  'DOCX',
  'EXE',
  'GIF',
  'LIB',
  'EXCEL',
  'FLV',
  'JAVA',
  'JSON',
  'JPG',
  'PHP',
  'GO',
  'MP3',
  'MP4',
  'JAR',
  'MOV',
  'PY',
  'SVG',
  'TIFF',
  'RAR',
  'PNG',
  'RUST',
  'PSD',
  'PDF',
  'R',
  'ZIP',
  'SQL',
  'TXT',
  'JS',
  'XLS',
  'XLSX',
  'WOFF',
  'TTF',
  'folder',
  'file-unknow',
  'draft',
  'post',
  'AE',
  'AI',
  'APK',
  'C',
  'CSS',
  'AVI',
  'BMP',
  'DOC',
  'HTML',
  'CPP',
  'C#',
  'DLL',
  'DOCX',
  'EXE',
  'GIF',
  'LIB',
  'EXCEL',
  'FLV',
  'JAVA',
  'JSON',
  'JPG',
  'PHP',
  'GO',
  'MP3',
  'MP4',
  'JAR',
  'MOV',
  'PY',
  'SVG',
  'TIFF',
  'RAR',
  'PNG',
  'RUST',
  'PSD',
  'PDF',
  'R',
  'ZIP',
  'SQL',
  'TXT',
  'JS',
  'XLS',
  'XLSX',
  'WOFF',
  'TTF',
]

const fileType = computed(() => {
  let result = props.suffix.toUpperCase()
  if (['MD', 'MARKDOWN'].includes(result)) {
    result = 'POST'
  } else if (['JPG', 'JPEG'].includes(result)) {
    result = 'JPG'
  } else if (['HTM', 'HTML'].includes(result)) {
    result = 'HTML'
  }

  if (!allowType.includes(result)) {
    result = 'FILE-UNKNOW'
  }

  return result
})
</script>

<template>
  <!-- <i :class="`iconfont icon-${fileType}`"></i> -->
  <span class="file-type-icon">
    <svg class="icon svg-icon" aria-hidden="true">
      <use :xlink:href="`#icon-${fileType}`"></use>
    </svg>
  </span>
</template>

<style scoped>
.file-type-icon {
  width: 100%;
  height: 100%;
  margin-right: 5px;
  font-size: 20px;
}
.icon {
  width: 1em;
  height: 1em;
  vertical-align: -0.15em;
  fill: currentColor;
  overflow: hidden;
}
</style>
