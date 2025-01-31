<script lang="ts" setup>
import { ref, onMounted, watch, computed, Ref } from "vue";
import { useSettingsStore, useGlobalStore } from "@/stores";
import { FontAwesomeIcon } from "@fortawesome/vue-fontawesome";
import api from "@/utils/api";
import imagehosting from "@/utils/imagehosting";
import { checkRepo, checkInstalledApp } from "@/utils/api";
import { decryptToken } from "@/utils/encryptToken";
import { ElMessage, ElMessageBox } from "element-plus";
import { githubAppName } from "@/config";

const settingsStore = useSettingsStore();
const globalStore = useGlobalStore();

const containerRef = ref<HTMLElement | null>(null);

const repoName = computed(() => settingsStore.settings["基本配置"].repoName);
const branchName = computed(
  () => settingsStore.settings["基本配置"].repoBranch
);

const groupNames = computed(() => Object.keys(settingsStore.settings));
const settingNames = computed(() => {
  let names: Record<string, string[]> = {};
  for (let groupName in settingsStore.settings) {
    names[groupName] = Object.keys(settingsStore.settings[groupName]);
  }
  return names;
});

const imagehostingBucket = computed(
  () => settingsStore.settings["图床配置"].bucket
);
const imagehostingEndpoint = computed(
  () => settingsStore.settings["图床配置"].endpoint
);
const imagehostingRegion = computed(
  () => settingsStore.settings["图床配置"].region
);
const imagehostingAccessKeyId = computed(
  () => settingsStore.settings["图床配置"].accessKeyId
);
const imagehostingSecretAccessKey = computed(
  () => settingsStore.settings["图床配置"].secretAccessKey
);

const imagehostingUseable: Ref<boolean> = ref(imagehosting.ready);

watch(
  [
    imagehostingBucket,
    imagehostingEndpoint,
    imagehostingRegion,
    imagehostingAccessKeyId,
    imagehostingSecretAccessKey,
  ],
  async (
    [newBucket, newEndpoint, newRegion, newAccessKeyId, newSecretAccessKey],
    [oldBucket, oldEndpoint, oldRegion, oldAccessKeyId, oldSecretAccessKey]
  ) => {
    let result = await imagehosting.init(
      newBucket as string,
      newEndpoint as string,
      newRegion as string,
      newAccessKeyId as string,
      newSecretAccessKey as string
    );

    if (!result) {
      imagehostingUseable.value = false;
    } else {
      imagehostingUseable.value = true;
    }
  }
);

const loading = ref(false);
const userInfo: Ref<Record<string, any>> = ref({});

onMounted(async () => {
  // 初始化时更新仓库选项
  if (!api.ready) {
    settingsStore.settingsUsage = {
      themeName: true,
      repoName: false,
      repoBranch: false,
      repoPath: false,
      defaultFrontMatter: true,
      dateTimeFormat: true,
      editorDefaultMode: true,
      editorMaxWidth: true,
      editorTypewriterMode: true,
      editorAutoSpace: true,
      editorGfmAutoLink: true,
      bucket: false,
      endpoint: false,
      region: false,
      accessKeyId: false,
      secretAccessKey: false,
      rootUrl: false,
      defaultImageLinkString: false,
    };
    return;
  }
  settingsStore.selectInputOptions.repoName = ref<string[]>([]);
  let repos = await api.getRepoNames();

  repos.forEach(
    (repo: {
      id: number;
      node_id: string;
      name: string;
      full_name: string;
      license: {
        key: string;
        name: string;
        url: string | null;
        spdx_id: string | null;
        node_id: string;
        html_url?: string | undefined;
      } | null;
      [key: string]: any;
    }) => {
      (settingsStore.selectInputOptions.repoName as unknown as string[]).push(
        repo.name
      );
    }
  );

  updataBranchesOptions(); // 初始化时更新分支选项

  let result = await api.getUserInfo();
  if (result) {
    userInfo.value = result;
  }
});

const updataBranchesOptions = async () => {
  settingsStore.selectInputOptions.repoBranch = ref<string[]>([]);
  let branches = await api.getRepoBranches();

  if (!branches) return;

  branches.forEach(
    (branch: { name: string; commit: { sha: string; url: string } }) => {
      (settingsStore.selectInputOptions.repoBranch as unknown as string[]).push(
        branch.name
      );
    }
  );

};

const updateRepo = async () => {
  // 更新api配置
  let access_token = localStorage.getItem("access_token");
  if (!access_token) {
    globalStore.goLogin();
    return;
  }

  const token = decryptToken(access_token as string);

  loading.value = true;
  // 检查仓库权限
  const { repoValid, hasPushAccess } = await checkRepo(
    api.owner as string,
    settingsStore.settings["基本配置"].repoName,
    token
  );

  if (!repoValid || !hasPushAccess) {
    ElMessage.error("仓库不存在或无权限访问");
    settingsStore.settings["基本配置"].repoName = "";
    globalStore.goLogin();
    loading.value = false;
    return;
  }

  // 检查安装应用
  const installed = await checkInstalledApp(
    settingsStore.settings["基本配置"].repoName,
    token
  );

  if (!installed) {
    ElMessage.error("请先安装应用");
    const url = `https://github.com/apps/${githubAppName}/installations/new`;
    window.open(url, "_blank");
  }

  api.repo = settingsStore.settings["基本配置"].repoName;

  await updataBranchesOptions();

  // 当前分支不在分支选项中时，自动选择第一个分支
  let currentBranch = settingsStore.settings["基本配置"].repoBranch;

  if (
    !(
      settingsStore.selectInputOptions.repoBranch as unknown as string
    ).includes(currentBranch)
  ) {
    if (
      (settingsStore.selectInputOptions.repoBranch as unknown as string)
        .length > 0
    ) {
      settingsStore.settings["基本配置"].repoBranch = (
        settingsStore.selectInputOptions.repoBranch as unknown as string
      )[0];
    }
  }

  loading.value = false;
};

watch(repoName, updateRepo);

watch(branchName, async () => {
  // 更新api配置
  api.branch = settingsStore.settings["基本配置"].repoBranch;
});

const handleClick = (e: MouseEvent) => {
  e.preventDefault();
};

const logout = () => {
  ElMessageBox.confirm("确定要退出登录吗？", "Warning", {
    confirmButtonText: "退出",
    cancelButtonText: "取消",
    type: "warning",
  })
    .then(() => {
      localStorage.removeItem("access_token");
      globalStore.goLogin();
    })
    .catch(() => {
      ElMessage({
        type: "info",
        message: "logout canceled",
      });
    });
};
</script>

<template>
  <div class="main" v-loading="loading">
    <div class="settings-box" ref="containerRef">
      <el-form label-position="top">
        <div
          class="group"
          :id="'group-' + groupName"
          v-for="groupName in groupNames"
        >
          <div class="setting-group-title">{{ groupName }}</div>
          <el-form-item v-for="settingName in settingNames[groupName]">
            <template #label>
              <div>
                {{ settingsStore.settingsInputLabels[settingName] }}
                <el-tooltip
                  class="box-item"
                  effect="dark"
                  :content="
                    settingsStore.settingsInputDescriptions[settingName]
                  "
                  raw-content
                  placement="right-start"
                  ><font-awesome-icon :icon="['fas', 'circle-question']" />
                </el-tooltip>
              </div>
            </template>

            <el-input
              v-model="settingsStore.settings[groupName][settingName]"
              v-if="
                settingsStore.settingsInputTypes[settingName] ===
                settingsStore.InputType.lineInput
              "
              :disabled="!settingsStore.settingsUsage[settingName]"
            />
            <el-input
              v-model="settingsStore.settings[groupName][settingName]"
              autosize
              type="textarea"
              placeholder="Please input"
              v-else-if="
                settingsStore.settingsInputTypes[settingName] ===
                settingsStore.InputType.textInput
              "
              :disabled="!settingsStore.settingsUsage[settingName]"
            />
            <el-input-number
              v-model="settingsStore.settings[groupName][settingName]"
              v-else-if="
                settingsStore.settingsInputTypes[settingName] ===
                settingsStore.InputType.numberInput
              "
              :disabled="!settingsStore.settingsUsage[settingName]"
            />
            <el-switch
              v-model="settingsStore.settings[groupName][settingName]"
              v-else-if="
                settingsStore.settingsInputTypes[settingName] ===
                settingsStore.InputType.booleanInput
              "
              :disabled="!settingsStore.settingsUsage[settingName]"
            />
            <el-select
              v-model="settingsStore.settings[groupName][settingName]"
              v-else-if="
                settingsStore.settingsInputTypes[settingName] ===
                settingsStore.InputType.selectInput
              "
              :disabled="!settingsStore.settingsUsage[settingName]"
            >
              <el-option
                v-for="option in settingsStore.selectInputOptions[settingName]"
                :key="String(option)"
                :label="String(option)"
                :value="String(option)"
              />
            </el-select>
          </el-form-item>
        </div>
      </el-form>
      <div style="height: 100px"></div>
    </div>
    <div class="slider-anchors">
      <div class="user-box" v-if="api.ready">
        <a :href="userInfo.html_url" target="_blank">
          <el-image :src="userInfo.avatar_url+'&48'" />
          <div class="info">
            <div class="name">{{ userInfo.name }}</div>
            <div class="bio">{{ userInfo.bio }}</div>
            <div class="login">{{ userInfo.login }}</div>
          </div>
        </a>
        <el-button type="danger" plain style="width: 100%" @click="logout">
          退出登录
        </el-button>
      </div>
      <el-anchor
        :container="containerRef"
        direction="vertical"
        type="default"
        :offset="30"
        @click="handleClick"
      >
        <el-anchor-link
          :href="'#group-' + groupName"
          :title="groupName"
          v-for="groupName in groupNames"
        />
      </el-anchor>
      <div class="imagehosting-pilot-lamp" v-if="api.ready">
        <div
          :class="`pilot-lamp ${imagehostingUseable ? 'useable' : 'unuseable'}`"
        ></div>
        图床 {{ imagehostingUseable ? "可用" : "不可用" }}
      </div>
    </div>
  </div>
</template>

<style scoped>
.main {
  display: flex;
  width: 100%;
  height: 100vh;
}

.settings-box {
  width: calc(100% - 230px);
  height: 100%;
  overflow: auto;
  padding: 20px;
}

.slider-anchors {
  border-left: 1px solid var(--el-border-color-light);
  width: 230px;
  padding: 10px;
}

.setting-group-title {
  font-size: 20px;
  font-weight: bold;
  margin-bottom: 10px;
  padding: 10px;
  border-bottom: 2px solid var(--el-border-color-light);
}

.user-box {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 15px;
  margin-bottom: 20px;
}

.user-box .el-image {
  width: 150px;
  height: 150px;
  border-radius: 50%;
  margin-bottom: 20px;
}

.user-box .info {
  position: absolute;
  top: 0;
  left: auto;

  width: 150px;
  height: 150px;
  padding: 10px;
  border-radius: 50%;
  margin-top: 20px;
  background-color: rgba(0, 0, 0, 0.6);
  color: white;
  display: flex;
  flex-direction: column;
  justify-content: end;
  align-items: center;
  opacity: 0;
  transition: opacity 0.3s;
}

.user-box:hover .info {
  opacity: 1;
}

.user-box .name {
  font-size: 25px;
  font-weight: bold;
}

.user-box .bio {
  font-size: 14px;
  /* color: var(--el-text-color-secondary); */
}

.user-box .login {
  font-size: 14px;
  /* color: var(--el-text-color-secondary); */
}

.imagehosting-pilot-lamp {
  display: flex;
  justify-content: center;
  align-items: center;
  margin-top: 20px;
  padding: 15px;
  border-top: var(--el-border-color-darker) solid 2px;
}

.pilot-lamp {
  width: 15px;
  height: 15px;
  border-radius: 50%;
  margin-right: 5px;
}

.imagehosting-pilot-lamp .pilot-lamp.useable {
  background-color: var(--el-color-success);
}

.imagehosting-pilot-lamp .pilot-lamp.unuseable {
  background-color: var(--el-color-danger);
}
</style>
