<script setup lang="ts">
import { defineProps, defineModel, VNode } from 'vue'

interface Props {
  title: string
  description: string
  rawContent: boolean
  type: string
  option?: string[]
  custom?: VNode
}

defineProps<Props>()
const setting = defineModel()
</script>

<template>
  <div>
    <el-form-item v-if="!custom">
      <template #label>
        <div>
          {{ title }}
          <el-tooltip
            class="box-item"
            effect="dark"
            :content="description"
            :raw-content="rawContent"
            placement="right-start"
            ><font-awesome-icon :icon="['fas', 'circle-question']" />
          </el-tooltip>
        </div>
      </template>

      <el-input v-model="setting as string" v-if="type === 'line'" spellcheck="false" />
      <el-input
        v-model="setting as string"
        autosize
        type="textarea"
        placeholder="Please input"
        v-else-if="type === 'text'"
        spellcheck="false"
      />
      <el-input-number v-model="setting as number" v-else-if="type === 'number'" />
      <el-switch v-model="setting as boolean" v-else-if="type === 'boolean'" />
      <el-select v-model="setting as string" v-else-if="type === 'select'">
        <el-option
          v-for="opt in option || []"
          :key="String(opt)"
          :label="String(opt)"
          :value="String(opt)"
        />
      </el-select>
    </el-form-item>
    <div v-else>
      <component :is="custom" />
    </div>
  </div>
</template>
