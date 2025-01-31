<script setup lang="ts">
import { ElTabs, ElTabPane, TabPaneName } from "element-plus";
import MdEditor from "./editor/MdEditor.vue";
import ReadOnly from "./editor/ReadOnly.vue";
import SettingsPanel from "./SettingsPanel.vue";
import { useTabsStore } from "@/stores";

const tabsStore = useTabsStore();

const truncateTitle = (title: any) => {
  const maxLength = 10; // 设置最大字符长度
  if (title.length > maxLength) {
    return title.substring(0, maxLength) + "...";
  }
  return title;
};
</script>

<template>
  <div class="workspace">
    <el-tabs
      v-model="tabsStore.activeTabId"
      type="card"
      closable
      @tab-remove="tabsStore.removeTab"
      class="el-tabs"
      v-if="tabsStore.tabs.length > 0"
    >
      <el-tab-pane
        v-for="item in tabsStore.tabs"
        :key="item.id"
        :name="item.id"
        class="tab-pane"
      >
        <template #label>
          <span :class="{ 'panel-tab': true, native: item.data.native, remote: item.data.remote }">
            <font-awesome-icon
              :icon="['fas', item.icon]"
              style="padding-right: 2px"
            />
            <el-tooltip
              :class="{ 'panel-tab': true, native: item.data.native }"
              effect="dark"
              :content="item.data.title"
              placement="bottom-start"
              >{{ truncateTitle(item.data.title) }}</el-tooltip
            >
          </span>
        </template>
        <MdEditor
          :editor="item.id"
          :path="item.data.path"
          :repo="item.data.repo"
          :native="item.data.native || false"
          v-if="item.type === tabsStore.TabType.MdFile"
        />
        <ReadOnly
          :path="item.data.path"
          v-else-if="item.type === tabsStore.TabType.RemoteFile"
        />
        <SettingsPanel
          v-else-if="item.type === tabsStore.TabType.SettingsPanel"
        />
      </el-tab-pane>
    </el-tabs>
    <div class="empty-box" v-else>
      <el-empty image="cover.png" :image-size="550">
        <template #description>
          <span>请在左侧文件管理器中选择文件打开</span>
        </template>
      </el-empty>
    </div>
  </div>
</template>

<style>
.el-tabs__header {
  margin: 0 !important;
}
</style>

<style scoped>
.workspace {
  width: 100%;
  height: 100vh;
}

.panel-tab.native {
  color: var(--el-color-success);
}

.panel-tab.remote {
  color: var(--el-color-warning);
}

.el-tabs {
  height: 100%;
}

.empty-box {
  width: 100%;
  height: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
}
</style>
