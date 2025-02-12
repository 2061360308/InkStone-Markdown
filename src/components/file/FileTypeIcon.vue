<script setup lang="ts">
import { defineProps } from 'vue'
import { supportedExtensions } from '@/utils/supportFileExtensions'
import { Ref } from 'vue'
import { computed } from 'vue'

const props = defineProps({
  name: {
    type: String,
    required: true,
  },
  light: {
    type: Boolean,
    default: false,
  },
  folder: {
    type: Boolean,
    default: false,
  },
  forderOpen: {
    type: Boolean,
    default: false,
  },
})

const icon: Ref<string> = computed(() => {
  if (props.folder) {
    return props.forderOpen
      ? '/fileTypeIcons/default_folder_opened.svg'
      : '/fileTypeIcons/default_folder.svg'
  }

  // console.log('props.name', props.name)

  if (!props.name) {
    return '/fileTypeIcons/default_file.svg'
  }

  //按照"."分割文件名
  const fileNameChuck = props.name.split('.')
  // 从整个文件名开始由长到短依次尝试后缀名，直到找到支持的后缀名
  let extensionType
  for (let i = 0; i < fileNameChuck.length; i++) {
    const extension = fileNameChuck.slice(i).join('.')
    console.log(extension)
    if (extension in supportedExtensions) {
      extensionType = supportedExtensions[extension]
    }
  }
  let svgFilePath: string
  if (!extensionType) {
    svgFilePath = '/fileTypeIcons/default_file.svg'
  } else {
    if (props.light && extensionType.light) {
      svgFilePath = `/fileTypeIcons/file_type_light_${extensionType.icon}.svg`
    } else {
      svgFilePath = `/fileTypeIcons/file_type_${extensionType.icon}.svg`
    }
  }
  console.log('svgFilePath', svgFilePath)
  return svgFilePath
})
</script>

<template>
  <span class="file-type-icon" v-if="icon">
    <!-- <svg class="icon svg-icon" aria-hidden="true">
      <use :xlink:href="icon"></use>
    </svg> -->
    <img :src="icon" class="icon svg-icon" alt="file type icon" />
  </span>
</template>

<style scoped>
.file-type-icon {
  width: 100%;
  height: 100%;
  margin-right: 5px;
  font-size: 20px;

  .icon {
    width: 1em;
    height: 1em;
    vertical-align: -0.15em;
    fill: currentColor;
    overflow: hidden;
  }
}
</style>
