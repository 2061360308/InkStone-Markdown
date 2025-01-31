<script setup lang="ts">
import { ref } from "vue";
import {
  ContextMenu,
  ContextMenuGroup,
  ContextMenuSeparator,
  ContextMenuItem,
} from "@imengyu/vue3-context-menu";

const menuVisible = ref(false);
const optionsComponent = ref({
  x: 500,
  y: 200,
});

const onFileMenu = (event: {
  preventDefault: () => void;
  clientX: any;
  clientY: any;
}) => {
  console.log("onFileMenu", event);
  event.preventDefault();

  optionsComponent.value = {
    x: event.clientX,
    y: event.clientY,
  };
  menuVisible.value = !menuVisible.value;
};
</script>

<template>
  <div class="title-bar">
    <div class="logo">
      <el-image src="/favicon.ico" alt="logo" class="logo-img" />
    </div>
    <span class="title">砚台 Inkstone</span>
    <div class="bar-menu" @click="onFileMenu">文件</div>
    <div class="opened-file-tip">这是打开的文件</div>
  </div>
  <context-menu v-model:show="menuVisible" :options="optionsComponent">
    <context-menu-group label="新建" icon="fas fa-plus">
      <context-menu-item
        label="新建文章"
        :clickClose="true"
        data-filetype="post"
      >
        <template #icon>
          <font-awesome-icon :icon="['fas', 'square-pen']" />
        </template>
      </context-menu-item>
      <context-menu-item
        label="新建草稿"
        :clickClose="true"
        data-filetype="draft"
      >
        <template #icon>
          <font-awesome-icon :icon="['fas', 'pen-ruler']" />
        </template>
      </context-menu-item>

      <ContextMenuSeparator />

      <context-menu-item label="文件" :clickClose="true" data-filetype="file">
        <template #icon>
          <font-awesome-icon :icon="['fas', 'file']" />
        </template>
      </context-menu-item>
    </context-menu-group>

    <context-menu-item label="重命名" :clickClose="false">
      <template #icon>
        <font-awesome-icon :icon="['fas', 'i-cursor']" />
      </template>
    </context-menu-item>
    <context-menu-item label="复制" :clickClose="false">
      <template #icon> <font-awesome-icon :icon="['fas', 'copy']" /> </template
    ></context-menu-item>
    <context-menu-item label="删除" :clickClose="false">
      <template #icon>
        <font-awesome-icon
          :icon="['fas', 'trash']"
          style="color: var(--el-color-danger)"
        />
      </template>
    </context-menu-item>
  </context-menu>
</template>

<style scoped>
.title-bar {
  padding: 0 10px;
  position: fixed;
  left: env(titlebar-area-x, 0);
  top: env(titlebar-area-y, 0);
  height: env(titlebar-area-height, 33px);
  width: env(titlebar-area-width, 100%);
  -webkit-app-region: drag;
  display: flex;
  gap: 10px;
  justify-content: left;
  align-items: center;
  white-space: nowrap;
  background-color: #dde3e9;
}

.logo-img {
  width: env(titlebar-area-height, 33px);
  height: env(titlebar-area-height, 33px);
  border-radius: 50%;
}

.title {
  font-size: 18px;
  font-weight: bold;
}

.bar-menu {
  padding: 4px 6px;
  border-radius: 4px;
  -webkit-app-region: no-drag;
}

.bar-menu:hover {
  background-color: var(--el-color-primary-light-8);
}

.opened-file-tip {
  font-size: 14px;
  color: #666;
  z-index: -1;
  margin: auto;
}
</style>
