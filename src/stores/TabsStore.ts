import { TabPaneName } from "element-plus";
import { defineStore } from "pinia";
import { title } from "process";
import { ref, Ref } from "vue";

const generateRandomId = (length: number) => {
  let result = "";
  const characters = "abcdefghijklmnopqrstuvwxyz";
  const charactersLength = characters.length;
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
  }
  return result;
};

export const useTabsStore = defineStore("tabs", () => {
  enum TabType {
    File = "file",
    MdFile = "mdFile",
    RemoteFile = "remoteFile",
    SettingsPanel = "settings",
  }

  const tabs: Ref<
    {
      id: string;
      type: TabType;
      icon: string;
      data: Record<string, any>;
    }[]
  > = ref([]);

  const activeTabId = ref("");

  const addTab = (type: TabType, icon = "", data: any, id = "") => {
    if (!id) {
      id = generateRandomId(6);
    }

    if (tabs.value.find((tab) => tab.id === id)) {
      setActiveTab(id);
      return;
    }

    tabs.value.push({ id, type, icon, data });
    setActiveTab(id);
  };

  const removeTab = (id: TabPaneName) => {
    const index = tabs.value.findIndex((tab) => tab.id === id);
    if (index !== -1) {
      tabs.value.splice(index, 1);
      // 如果删除的是当前激活的tab，激活前一个或后一个tab
      if (activeTabId.value === id) {
        if (tabs.value.length > 0) {
          // 优先激活前一个tab，如果没有前一个，则激活后一个
          const newIndex = index > 0 ? index - 1 : 0;
          setActiveTab(tabs.value[newIndex].id);
        } else {
          activeTabId.value = "";
        }
      }
    }
  };

  const setActiveTab = (id: string) => {
    activeTabId.value = id;
  };

  const openFile = (path: string, repo: string) => {
    // 防止重复打开
    for (let tab of tabs.value) {
      if (tab.data.path === path) {
        if (tab.data.repo === repo) {
          setActiveTab(tab.id);
          return;
        }
      }
    }

    let title = ref(path.split("/").pop() || "");

    // 如果有路径文件，标题加上repo
    for (let tab of tabs.value) {
      if (tab.data.path === path) {
        tab.data.title = tab.data.title + " @ " + tab.data.repo;
        title.value = path + " @ " + repo;
      }
    }

    // 防止不同目录下同名文件标题相同
    for (let tab of tabs.value) {
      if (tab.data.title === title) {
        let original_tab_title = tab.data.title;
        let original_title = title.value;

        if (original_tab_title.endsWith(" @ " + tab.data.repo)) {
          tab.data.title = tab.data.path + " @ " + tab.data.repo;
        } else {
          tab.data.title = tab.data.path;
        }

        if (original_title.endsWith(" @ " + repo)) {
          title.value = path + " @ " + repo;
        } else {
          title.value = path;
        }
      }
    }

    let data = {
      path,
      title,
      repo,
    };

    // 获取后缀
    const ext = path.split(".").pop()?.toLowerCase();
    addTab(
      ext === "md" ? TabType.MdFile : TabType.File,
      ext === "md" ? "m" : "",
      data
    );
  };

  const openNativeFile = async (fileHandle: FileSystemFileHandle) => {
    /**
     * 打开用户本机上的文件
     **/
    const path = `${fileHandle.name} @local`;
    let title = ref(path.split("/").pop() || "");

    // 防止重复打开, 同时处理同名文件
    for (let tab of tabs.value) {
      if (tab.data.native) {
        let isSame = await fileHandle.isSameEntry(tab.data.fileHandle);
        if (isSame) {
          setActiveTab(tab.id);
          return;
        } else {
          // 如果不是同一个文件，但是文件名相同，修改标题,添加随机id
          title.value = path + `- ${generateRandomId(4)}`;
          tab.data.title = path + `- ${generateRandomId(4)}`;
        }
      }
    }

    let repo = "instone.native";

    let data = {
      path,
      title,
      repo,
      fileHandle,
      native: true,
    };

    // 获取后缀
    const ext = fileHandle.name.split(".").pop()?.toLowerCase();
    addTab(
      ext === "md" ? TabType.MdFile : TabType.File,
      ext === "md" ? "m" : "",
      data
    );
  };

  const openRemoteFile = async (path: string) => {
    // 打开远程的文件，远程文件为只读模式

    let title = ref((path.split("/").pop() || "") + " @remote");

    // 防止重复打开
    for (let tab of tabs.value) {
      if (tab.data.remote) {
        if (tab.data.path === path) {
          setActiveTab(tab.id);
          return;
        }

        // 有同名文件，展示完整路径
        if (tab.data.title === title) {
          title.value = path + " @remote";
          tab.data.title = tab.data.path + " @remote";
        }
      }
    }

    let repo = "instone.remote";

    let data = {
      path,
      title,
      repo,
      remote: true,
    };

    // 获取后缀
    const ext = path.split(".").pop()?.toLowerCase();
    addTab(TabType.RemoteFile, ext === "md" ? "m" : "", data);
  };

  const vditorInstance: Record<string, any> = {};

  return {
    TabType,
    tabs,
    activeTabId,
    vditorInstance,
    addTab,
    removeTab,
    setActiveTab,
    openFile,
    openNativeFile,
    openRemoteFile,
  };
});
